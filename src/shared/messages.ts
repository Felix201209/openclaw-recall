import fs from "node:fs/promises";
import { ChatTurn, ChatRole } from "../types/domain.js";

function resolveRole(role: unknown): ChatRole {
  if (role === "assistant" || role === "tool" || role === "system") {
    return role;
  }
  if (role === "toolResult") {
    return "tool";
  }
  return "user";
}

export function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (!block || typeof block !== "object") return "";
        const record = block as Record<string, unknown>;
        if (typeof record.text === "string") return record.text;
        if (typeof record.output_text === "string") return record.output_text;
        if (typeof record.toolOutput === "string") return record.toolOutput;
        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (content && typeof content === "object" && typeof (content as Record<string, unknown>).text === "string") {
    return String((content as Record<string, unknown>).text).trim();
  }

  return "";
}

export function normalizeRuntimeMessages(messages: unknown[], sessionId: string): ChatTurn[] {
  return messages
    .flatMap((message, index) => {
      if (!message || typeof message !== "object") return [];
      const record = message as Record<string, unknown>;
      const text = extractTextFromContent(record.content);
      if (!text) return [];

      return [
        {
          id: String(record.id ?? `${sessionId}-${index}`),
          sessionId,
          role: resolveRole(record.role),
          text,
          createdAt: new Date(
            typeof record.timestamp === "number" ? record.timestamp : Date.now(),
          ).toISOString(),
        } satisfies ChatTurn,
      ];
    })
    .filter((turn) => turn.text.trim().length > 0);
}

export async function readTranscriptFile(sessionFile: string, sessionId: string): Promise<ChatTurn[]> {
  try {
    const raw = await fs.readFile(sessionFile, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line, index) => {
        const entry = JSON.parse(line) as Record<string, unknown>;
        if (entry.type !== "message") return [];
        const message = entry.message as Record<string, unknown> | undefined;
        if (!message) return [];
        const text = extractTextFromContent(message.content);
        if (!text) return [];
        return [
          {
            id: String(message.id ?? `${sessionId}-t-${index}`),
            sessionId,
            role: resolveRole(message.role),
            text,
            createdAt: new Date(
              typeof message.timestamp === "number" ? message.timestamp : Date.now(),
            ).toISOString(),
          } satisfies ChatTurn,
        ];
      });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
