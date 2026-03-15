import { estimateTokens, sentenceFromText } from "../shared/text.js";
import { CompactedToolResult } from "../types/domain.js";

export class ToolOutputCompactor {
  compact(toolName: string, payload: unknown): CompactedToolResult {
    const originalEstimatedTokens = estimateTokens(serializePayload(payload));
    const compacted = this.renderPayload(toolName, payload);
    const estimatedTokens = estimateTokens(compacted);
    return {
      toolName,
      compacted,
      estimatedTokens,
      originalEstimatedTokens,
      savedTokens: Math.max(0, originalEstimatedTokens - estimatedTokens),
    };
  }

  private renderPayload(toolName: string, payload: unknown): string {
    if (typeof payload === "string") {
      const lines = payload
        .split(/\r?\n/)
        .filter(Boolean)
        .slice(0, 10)
        .map((line, index) => `${index + 1}. ${sentenceFromText(line, 160)}`)
        .join("\n");
      return [`Tool: ${toolName}`, `Summary: ${sentenceFromText(payload, 180)}`, lines ? `Key facts:\n${lines}` : ""]
        .filter(Boolean)
        .join("\n");
    }

    if (Array.isArray(payload)) {
      const lines = payload
        .slice(0, 6)
        .map((entry, index) => {
          const rendered = JSON.stringify(entry) ?? String(entry ?? "");
          return `${index + 1}. ${sentenceFromText(rendered, 140)}`;
        })
        .join("\n");
      return [`Tool: ${toolName}`, `Summary: returned ${payload.length} items.`, `Key facts:\n${lines}`]
        .filter(Boolean)
        .join("\n");
    }

    if (payload && typeof payload === "object") {
      const entries = Object.entries(payload as Record<string, unknown>)
        .slice(0, 8)
        .map(([key, value]) => {
          const rendered = JSON.stringify(value) ?? String(value ?? "");
          return `${key}: ${sentenceFromText(rendered, 120)}`;
        })
        .join("\n");
      return [
        `Tool: ${toolName}`,
        `Summary: structured payload with ${Object.keys(payload as Record<string, unknown>).length} fields.`,
        entries ? `Key facts:\n${entries}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    return [`Tool: ${toolName}`, `Summary: ${sentenceFromText(String(payload ?? ""), 240)}`].join("\n");
  }
}

function serializePayload(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload ?? null, null, 2) ?? String(payload ?? "");
  } catch {
    return String(payload ?? "");
  }
}
