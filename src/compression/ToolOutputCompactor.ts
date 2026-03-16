import { estimateTokens, sentenceFromText } from "../shared/text.js";
import { CompactedToolResult } from "../types/domain.js";
import { chunkStructuredText, prioritizeStructuredChunks, renderStructuredChunk } from "./StructuralChunking.js";

export class ToolOutputCompactor {
  constructor(private readonly thresholdChars = 600) {}

  compact(toolName: string, payload: unknown): CompactedToolResult {
    const serialized = serializePayload(payload);
    const originalEstimatedTokens = estimateTokens(serialized);
    if (serialized.length < this.thresholdChars) {
      const compacted = [`Tool: ${toolName}`, `Summary: ${sentenceFromText(serialized, 240)}`].join("\n");
      return {
        toolName,
        compacted,
        estimatedTokens: estimateTokens(compacted),
        originalEstimatedTokens,
        savedTokens: Math.max(0, originalEstimatedTokens - estimateTokens(compacted)),
      };
    }
    const compacted = this.renderPayload(toolName, payload);
    const estimatedTokens = estimateTokens(compacted);
    const finalCompacted =
      estimatedTokens >= originalEstimatedTokens
        ? this.renderFallback(toolName, serialized)
        : compacted;
    const finalEstimatedTokens = estimateTokens(finalCompacted);
    return {
      toolName,
      compacted: finalCompacted,
      estimatedTokens: finalEstimatedTokens,
      originalEstimatedTokens,
      savedTokens: Math.max(0, originalEstimatedTokens - finalEstimatedTokens),
    };
  }

  private renderPayload(toolName: string, payload: unknown): string {
    if (typeof payload === "string") {
      return this.renderStructuredText(toolName, payload);
    }

    const extractedText = extractPrimaryTextPayload(payload);
    if (extractedText) {
      return this.renderStructuredText(toolName, extractedText);
    }

    if (Array.isArray(payload)) {
      const lines = payload
        .slice(0, 6)
        .map((entry, index) => {
          const rendered = JSON.stringify(entry) ?? String(entry ?? "");
          return `${index + 1}. ${sentenceFromText(rendered, 140)}`;
        })
        .join("\n");
      const structured = this.renderStructuredText(toolName, JSON.stringify(payload, null, 2) ?? String(payload));
      return [structured, lines ? `Items:\n${lines}` : ""].filter(Boolean).join("\n");
    }

    if (payload && typeof payload === "object") {
      const entries = Object.entries(payload as Record<string, unknown>)
        .slice(0, 8)
        .map(([key, value]) => {
          const rendered = JSON.stringify(value) ?? String(value ?? "");
          return `${key}: ${sentenceFromText(rendered, 120)}`;
        })
        .join("\n");
      const structured = this.renderStructuredText(toolName, JSON.stringify(payload, null, 2) ?? String(payload));
      return [structured, entries ? `Key facts:\n${entries}` : ""].filter(Boolean).join("\n");
    }

    return [`Tool: ${toolName}`, `Summary: ${sentenceFromText(String(payload ?? ""), 240)}`].join("\n");
  }

  private renderStructuredText(toolName: string, text: string): string {
    const normalized = collapseRepeatedLines(text);
    const maxChunks = normalized.length < 500 ? 4 : normalized.length < 900 ? 5 : 6;
    const summaryChars = normalized.length < 500 ? 96 : 132;
    const chunkChars = normalized.length < 500 ? 110 : 145;
    const chunks = prioritizeStructuredChunks(chunkStructuredText(normalized)).slice(0, maxChunks);
    const lines = chunks.map((chunk, index) => `${index + 1}. ${renderStructuredChunk(chunk, chunkChars)}`).join("\n");
    return [`Tool: ${toolName}`, `Summary: ${sentenceFromText(normalized, summaryChars)}`, lines ? `Key facts:\n${lines}` : ""]
      .filter(Boolean)
      .join("\n");
  }

  private renderFallback(toolName: string, text: string): string {
    const normalized = collapseRepeatedLines(text);
    const highlights = prioritizeStructuredChunks(chunkStructuredText(normalized))
      .slice(0, normalized.length < 500 ? 3 : 4)
      .map((chunk, index) => `${index + 1}. ${renderStructuredChunk(chunk, normalized.length < 500 ? 90 : 110)}`)
      .join("\n");
    return [`Tool: ${toolName}`, `Summary: ${sentenceFromText(normalized, normalized.length < 500 ? 72 : 96)}`, highlights ? `Highlights:\n${highlights}` : ""]
      .filter(Boolean)
      .join("\n");
  }
}

function serializePayload(payload: unknown): string {
  const extractedText = extractPrimaryTextPayload(payload);
  if (extractedText) {
    return extractedText;
  }
  if (typeof payload === "string") {
    return payload;
  }
  try {
    return JSON.stringify(payload ?? null, null, 2) ?? String(payload ?? "");
  } catch {
    return String(payload ?? "");
  }
}

function extractPrimaryTextPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const directText = readStringField(payload, ["text", "output_text", "contentText"]);
  if (directText) {
    return directText;
  }

  const content = (payload as { content?: unknown }).content;
  if (Array.isArray(content)) {
    const textParts = content
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }
        if (entry && typeof entry === "object") {
          return readStringField(entry, ["text", "content", "value"]);
        }
        return null;
      })
      .filter((value): value is string => Boolean(value?.trim()));
    if (textParts.length > 0) {
      return textParts.join("\n\n");
    }
  }

  return null;
}

function readStringField(payload: object, fields: string[]): string | null {
  for (const field of fields) {
    const value = (payload as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function collapseRepeatedLines(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const collapsed: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const current = lines[index];
    let count = 1;
    while (index + count < lines.length && lines[index + count] === current) {
      count += 1;
    }
    collapsed.push(count > 1 ? `${current} (repeated ${count}x)` : current);
    index += count;
  }
  return collapsed.join("\n");
}
