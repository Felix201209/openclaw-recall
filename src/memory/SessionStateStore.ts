import { uniqueStrings } from "../shared/text.js";
import { PluginDatabase } from "../storage/PluginDatabase.js";
import { SessionState } from "../types/domain.js";

type SessionStatePatch = Partial<Omit<SessionState, "sessionId" | "updatedAt">>;

export class SessionStateStore {
  constructor(private readonly database: PluginDatabase) {}

  async get(sessionId: string): Promise<SessionState> {
    const row = this.database.connection
      .prepare(
        `
          SELECT session_id, current_task, constraints_json, decisions_json, open_questions_json, updated_at
          FROM session_state
          WHERE session_id = ?
        `,
      )
      .get(sessionId) as
      | {
          session_id: string;
          current_task: string | null;
          constraints_json: string;
          decisions_json: string;
          open_questions_json: string;
          updated_at: number;
        }
      | undefined;

    if (!row) {
      return {
        sessionId,
        constraints: [],
        decisions: [],
        openQuestions: [],
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      sessionId: row.session_id,
      currentTask: row.current_task ?? undefined,
      constraints: JSON.parse(row.constraints_json) as string[],
      decisions: JSON.parse(row.decisions_json) as string[],
      openQuestions: JSON.parse(row.open_questions_json) as string[],
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }

  async applyPatch(sessionId: string, patch: SessionStatePatch): Promise<SessionState> {
    const current = await this.get(sessionId);
    const next: SessionState = {
      sessionId,
      currentTask: patch.currentTask ?? current.currentTask,
      constraints: uniqueStrings([...(current.constraints ?? []), ...(patch.constraints ?? [])]).slice(-8),
      decisions: uniqueStrings([...(current.decisions ?? []), ...(patch.decisions ?? [])]).slice(-8),
      openQuestions: uniqueStrings([...(current.openQuestions ?? []), ...(patch.openQuestions ?? [])]).slice(-8),
      updatedAt: new Date().toISOString(),
    };

    this.database.connection
      .prepare(`
        INSERT INTO session_state (
          session_id,
          current_task,
          constraints_json,
          decisions_json,
          open_questions_json,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          current_task = excluded.current_task,
          constraints_json = excluded.constraints_json,
          decisions_json = excluded.decisions_json,
          open_questions_json = excluded.open_questions_json,
          updated_at = excluded.updated_at
      `)
      .run(
        next.sessionId,
        next.currentTask ?? null,
        JSON.stringify(next.constraints),
        JSON.stringify(next.decisions),
        JSON.stringify(next.openQuestions),
        new Date(next.updatedAt).getTime(),
      );

    return next;
  }
}
