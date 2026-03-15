import crypto from "node:crypto";
import { PluginDatabase } from "../storage/PluginDatabase.js";
import { CompactedToolResult } from "../types/domain.js";

export class ToolOutputStore {
  constructor(private readonly database: PluginDatabase) {}

  async record(params: {
    sessionId: string;
    runId?: string;
    toolName: string;
    compacted: CompactedToolResult;
    rawPayload: unknown;
  }): Promise<void> {
    const fingerprint = sha1(
      JSON.stringify({
        toolName: params.toolName,
        compacted: params.compacted.compacted,
      }),
    );
    const existing = this.database.connection
      .prepare(
        `
          SELECT id
          FROM tool_outputs
          WHERE session_id = ? AND fingerprint = ? AND COALESCE(run_id, '') = COALESCE(?, '')
          LIMIT 1
        `,
      )
      .get(params.sessionId, fingerprint, params.runId ?? null) as { id: string } | undefined;

    if (existing) {
      return;
    }

    this.database.connection
      .prepare(`
        INSERT INTO tool_outputs (
          id,
          session_id,
          run_id,
          tool_name,
          fingerprint,
          compacted,
          raw_json,
          estimated_tokens,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        crypto.randomUUID(),
        params.sessionId,
        params.runId ?? null,
        params.toolName,
        fingerprint,
        params.compacted.compacted,
        JSON.stringify({
          payload: params.rawPayload ?? null,
          originalEstimatedTokens: params.compacted.originalEstimatedTokens ?? null,
          savedTokens: params.compacted.savedTokens ?? null,
          status: params.compacted.status ?? null,
        }),
        params.compacted.estimatedTokens,
        Date.now(),
      );
  }

  async listRecent(sessionId: string, limit: number): Promise<CompactedToolResult[]> {
    const rows = this.database.connection
      .prepare(
        `
          SELECT id, session_id, run_id, tool_name, compacted, raw_json, estimated_tokens, created_at
          FROM tool_outputs
          WHERE session_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `,
      )
      .all(sessionId, limit) as Array<{
      id: string;
      session_id: string;
      run_id: string | null;
      tool_name: string;
      compacted: string;
      raw_json: string;
      estimated_tokens: number;
      created_at: number;
    }>;

    return rows.reverse().map((row) => this.fromRow(row));
  }

  async getById(id: string): Promise<CompactedToolResult | null> {
    const row = this.database.connection
      .prepare(
        `
          SELECT id, session_id, run_id, tool_name, compacted, raw_json, estimated_tokens, created_at
          FROM tool_outputs
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(id) as
      | {
          id: string;
          session_id: string;
          run_id: string | null;
          tool_name: string;
          compacted: string;
          raw_json: string;
          estimated_tokens: number;
          created_at: number;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return this.fromRow(row);
  }

  async listByRun(sessionId: string, runId: string): Promise<CompactedToolResult[]> {
    const rows = this.database.connection
      .prepare(
        `
          SELECT id, session_id, run_id, tool_name, compacted, raw_json, estimated_tokens, created_at
          FROM tool_outputs
          WHERE session_id = ? AND run_id = ?
          ORDER BY created_at ASC
        `,
      )
      .all(sessionId, runId) as ToolOutputRow[];
    return rows.map((row) => this.fromRow(row));
  }

  async listSession(sessionId: string, limit = 50): Promise<CompactedToolResult[]> {
    const rows = this.database.connection
      .prepare(
        `
          SELECT id, session_id, run_id, tool_name, compacted, raw_json, estimated_tokens, created_at
          FROM tool_outputs
          WHERE session_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `,
      )
      .all(sessionId, limit) as ToolOutputRow[];
    return rows.map((row) => this.fromRow(row));
  }

  private fromRow(row: ToolOutputRow): CompactedToolResult {
    const decoded = safeJson(row.raw_json);
    const rawPayload =
      decoded && typeof decoded === "object" && "payload" in (decoded as Record<string, unknown>)
        ? (decoded as Record<string, unknown>).payload
        : decoded;
    const meta =
      decoded && typeof decoded === "object"
        ? decoded as Record<string, unknown>
        : {};
    const error = readString(rawPayload, "error");
    const durationMs = readNumber(rawPayload, "durationMs");
    return {
      id: row.id,
      sessionId: row.session_id,
      runId: row.run_id ?? undefined,
      toolName: row.tool_name,
      status: readToolStatus(meta, error),
      compacted: row.compacted,
      estimatedTokens: row.estimated_tokens,
      originalEstimatedTokens: readNumber(meta, "originalEstimatedTokens") ?? undefined,
      savedTokens: readNumber(meta, "savedTokens") ?? undefined,
      durationMs: durationMs ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      rawPayload,
      rawTrimmed: true,
      error: error ?? undefined,
    };
  }
}

function sha1(value: string): string {
  return crypto.createHash("sha1").update(value).digest("hex");
}

type ToolOutputRow = {
  id: string;
  session_id: string;
  run_id: string | null;
  tool_name: string;
  compacted: string;
  raw_json: string;
  estimated_tokens: number;
  created_at: number;
};

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function readString(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.trim() ? candidate : null;
}

function readNumber(value: unknown, key: string): number | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
}

function readToolStatus(value: Record<string, unknown>, error: string | null): CompactedToolResult["status"] {
  const candidate = value.status;
  if (candidate === "started" || candidate === "running" || candidate === "completed" || candidate === "failed") {
    return candidate;
  }
  return error ? "failed" : "completed";
}
