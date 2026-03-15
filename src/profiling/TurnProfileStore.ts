import { PluginDatabase } from "../storage/PluginDatabase.js";
import { StoredTurnProfile, TurnProfile } from "../types/domain.js";

export class TurnProfileStore {
  constructor(private readonly database: PluginDatabase) {}

  async record(profile: TurnProfile, details: Record<string, unknown> = {}): Promise<void> {
    this.database.connection
      .prepare(`
        INSERT INTO turn_profiles (
          run_id,
          session_id,
          created_at,
          prompt_tokens,
          prompt_budget,
          memory_injected,
          memory_candidates,
          memory_written,
          tool_tokens,
          tool_tokens_saved,
          history_summary_tokens,
          compression_savings,
          retrieval_count,
          details_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(run_id) DO UPDATE SET
          session_id = excluded.session_id,
          created_at = excluded.created_at,
          prompt_tokens = excluded.prompt_tokens,
          prompt_budget = excluded.prompt_budget,
          memory_injected = excluded.memory_injected,
          memory_candidates = excluded.memory_candidates,
          memory_written = excluded.memory_written,
          tool_tokens = excluded.tool_tokens,
          tool_tokens_saved = excluded.tool_tokens_saved,
          history_summary_tokens = excluded.history_summary_tokens,
          compression_savings = excluded.compression_savings,
          retrieval_count = excluded.retrieval_count,
          details_json = excluded.details_json
      `)
      .run(
        profile.runId,
        profile.sessionId,
        new Date(profile.createdAt).getTime(),
        profile.promptTokens,
        profile.promptBudget,
        profile.memoryInjected,
        profile.memoryCandidates,
        profile.memoryWritten,
        profile.toolTokens,
        profile.toolTokensSaved,
        profile.historySummaryTokens,
        profile.compressionSavings,
        profile.retrievalCount,
        JSON.stringify(details),
      );
  }

  async list(limit = 20, options: { sessionId?: string } = {}): Promise<StoredTurnProfile[]> {
    const rows = (options.sessionId?.trim()
      ? this.database.connection
          .prepare(`
            SELECT *
            FROM turn_profiles
            WHERE session_id = ?
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .all(options.sessionId.trim(), limit)
      : this.database.connection
          .prepare(`
            SELECT *
            FROM turn_profiles
            ORDER BY created_at DESC
            LIMIT ?
          `)
          .all(limit)) as TurnProfileRow[];

    return rows.map((row) => this.fromRow(row));
  }

  async get(runId: string): Promise<StoredTurnProfile | null> {
    const row = this.database.connection
      .prepare(`
        SELECT *
        FROM turn_profiles
        WHERE run_id = ?
        LIMIT 1
      `)
      .get(runId) as TurnProfileRow | undefined;

    return row ? this.fromRow(row) : null;
  }

  async prune(retainRuns: number): Promise<void> {
    if (retainRuns <= 0) {
      return;
    }
    this.database.connection
      .prepare(`
        DELETE FROM turn_profiles
        WHERE run_id NOT IN (
          SELECT run_id
          FROM turn_profiles
          ORDER BY created_at DESC
          LIMIT ?
        )
      `)
      .run(retainRuns);
  }

  private fromRow(row: TurnProfileRow): StoredTurnProfile {
    return {
      runId: row.run_id,
      sessionId: row.session_id,
      createdAt: new Date(row.created_at).toISOString(),
      promptTokens: row.prompt_tokens,
      promptBudget: row.prompt_budget,
      memoryInjected: row.memory_injected,
      memoryCandidates: row.memory_candidates,
      memoryWritten: row.memory_written,
      toolTokens: row.tool_tokens,
      toolTokensSaved: row.tool_tokens_saved,
      historySummaryTokens: row.history_summary_tokens,
      compressionSavings: row.compression_savings,
      retrievalCount: row.retrieval_count,
      details: safeJson(row.details_json),
    };
  }
}

type TurnProfileRow = {
  run_id: string;
  session_id: string;
  created_at: number;
  prompt_tokens: number;
  prompt_budget: number;
  memory_injected: number;
  memory_candidates: number;
  memory_written: number;
  tool_tokens: number;
  tool_tokens_saved: number;
  history_summary_tokens: number;
  compression_savings: number;
  retrieval_count: number;
  details_json: string;
};

function safeJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}
