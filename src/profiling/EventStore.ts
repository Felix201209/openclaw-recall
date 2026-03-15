import { PluginDatabase } from "../storage/PluginDatabase.js";
import { ChatTurn, SessionSummary } from "../types/domain.js";
import { sentenceFromText } from "../shared/text.js";

export class EventStore {
  constructor(private readonly database: PluginDatabase) {}

  async appendTurn(turn: ChatTurn): Promise<void> {
    this.ensureSessionMetadata(turn.sessionId);
    this.database.connection
      .prepare(`
        INSERT INTO turns (id, session_id, role, text, created_at, metadata_json)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          text = excluded.text,
          created_at = excluded.created_at,
          metadata_json = excluded.metadata_json
      `)
      .run(
        turn.id,
        turn.sessionId,
        turn.role,
        turn.text,
        new Date(turn.createdAt).getTime(),
        turn.metadata ? JSON.stringify(turn.metadata) : null,
      );
    this.touchSessionMetadata(turn.sessionId);
  }

  async listTurns(sessionId: string): Promise<ChatTurn[]> {
    const rows = this.database.connection
      .prepare(
        `
          SELECT id, session_id, role, text, created_at, metadata_json
          FROM turns
          WHERE session_id = ?
          ORDER BY created_at ASC, id ASC
        `,
      )
      .all(sessionId) as Array<{
      id: string;
      session_id: string;
      role: ChatTurn["role"];
      text: string;
      created_at: number;
      metadata_json: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      text: row.text,
      createdAt: new Date(row.created_at).toISOString(),
      metadata: row.metadata_json ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : undefined,
    }));
  }

  async listRecentTurns(sessionId: string, limit: number): Promise<ChatTurn[]> {
    const turns = await this.listTurns(sessionId);
    return turns.slice(-limit);
  }

  async listSessions(limit = 100): Promise<SessionSummary[]> {
    const rows = this.database.connection
      .prepare(
        `
          SELECT
            session_id,
            MAX(created_at) AS updated_at,
            COUNT(*) AS turn_count,
            SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS user_turns,
            SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) AS assistant_turns
          FROM turns
          GROUP BY session_id
          ORDER BY updated_at DESC
          LIMIT ?
        `,
      )
      .all(limit) as Array<{
      session_id: string;
      updated_at: number;
      turn_count: number;
      user_turns: number;
      assistant_turns: number;
    }>;

    return rows.map((row) => this.toSessionSummary(row));
  }

  async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
    const row = this.database.connection
      .prepare(
        `
          SELECT
            session_id,
            MAX(created_at) AS updated_at,
            COUNT(*) AS turn_count,
            SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS user_turns,
            SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) AS assistant_turns
          FROM turns
          WHERE session_id = ?
          GROUP BY session_id
        `,
      )
      .get(sessionId) as
      | {
          session_id: string;
          updated_at: number;
          turn_count: number;
          user_turns: number;
          assistant_turns: number;
        }
      | undefined;

    return row ? this.toSessionSummary(row) : null;
  }

  async renameSession(sessionId: string, title: string): Promise<void> {
    this.ensureSessionMetadata(sessionId);
    this.database.connection
      .prepare(
        `
          UPDATE session_metadata
          SET title = ?, updated_at = ?
          WHERE session_id = ?
        `,
      )
      .run(title.trim() || null, Date.now(), sessionId);
  }

  async archiveSession(sessionId: string): Promise<void> {
    this.ensureSessionMetadata(sessionId);
    this.database.connection
      .prepare(
        `
          UPDATE session_metadata
          SET archived_at = ?, updated_at = ?
          WHERE session_id = ?
        `,
      )
      .run(Date.now(), Date.now(), sessionId);
  }

  async unarchiveSession(sessionId: string): Promise<void> {
    this.ensureSessionMetadata(sessionId);
    this.database.connection
      .prepare(
        `
          UPDATE session_metadata
          SET archived_at = NULL, updated_at = ?
          WHERE session_id = ?
        `,
      )
      .run(Date.now(), sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const deleteStatements = [
      "DELETE FROM turns WHERE session_id = ?",
      "DELETE FROM session_state WHERE session_id = ?",
      "DELETE FROM tool_outputs WHERE session_id = ?",
      "DELETE FROM turn_profiles WHERE session_id = ?",
      "DELETE FROM session_runtime WHERE session_id = ?",
      "DELETE FROM session_metadata WHERE session_id = ?",
    ];
    for (const statement of deleteStatements) {
      this.database.connection.prepare(statement).run(sessionId);
    }
  }

  private toSessionSummary(row: {
    session_id: string;
    updated_at: number;
    turn_count: number;
    user_turns: number;
    assistant_turns: number;
  }): SessionSummary {
    const firstUser = this.database.connection
      .prepare(
        `
          SELECT text
          FROM turns
          WHERE session_id = ? AND role = 'user'
          ORDER BY created_at ASC, id ASC
          LIMIT 1
        `,
      )
      .get(row.session_id) as { text: string } | undefined;
    const lastTurn = this.database.connection
      .prepare(
        `
          SELECT role, text, metadata_json
          FROM turns
          WHERE session_id = ?
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        `,
      )
      .get(row.session_id) as
      | {
          role: ChatTurn["role"];
          text: string;
          metadata_json: string | null;
        }
      | undefined;
    const metadataRow = this.database.connection
      .prepare(
        `
          SELECT title, archived_at
          FROM session_metadata
          WHERE session_id = ?
          LIMIT 1
        `,
      )
      .get(row.session_id) as
      | {
          title: string | null;
          archived_at: number | null;
        }
      | undefined;

    const metadata = lastTurn?.metadata_json
      ? (JSON.parse(lastTurn.metadata_json) as Record<string, unknown>)
      : undefined;
    const computedTitle = sentenceFromText(firstUser?.text ?? row.session_id, 48);

    return {
      sessionId: row.session_id,
      title: metadataRow?.title?.trim() || computedTitle,
      preview: sentenceFromText(lastTurn?.text ?? "", 84),
      turnCount: row.turn_count,
      userTurns: row.user_turns,
      assistantTurns: row.assistant_turns,
      updatedAt: new Date(row.updated_at).toISOString(),
      archivedAt: metadataRow?.archived_at ? new Date(metadataRow.archived_at).toISOString() : undefined,
      lastRole: lastTurn?.role,
      provider: typeof metadata?.provider === "string" ? metadata.provider : undefined,
      model: typeof metadata?.model === "string" ? metadata.model : undefined,
    };
  }

  private ensureSessionMetadata(sessionId: string): void {
    this.database.connection
      .prepare(
        `
          INSERT INTO session_metadata (session_id, title, archived_at, created_at, updated_at)
          VALUES (?, NULL, NULL, ?, ?)
          ON CONFLICT(session_id) DO NOTHING
        `,
      )
      .run(sessionId, Date.now(), Date.now());
  }

  private touchSessionMetadata(sessionId: string): void {
    this.database.connection
      .prepare(
        `
          UPDATE session_metadata
          SET updated_at = ?
          WHERE session_id = ?
        `,
      )
      .run(Date.now(), sessionId);
  }
}
