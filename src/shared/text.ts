import crypto from "node:crypto";

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

export function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2),
    ),
  );
}

export function fingerprint(value: string): string {
  return crypto
    .createHash("sha1")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export function truncateToTokens(text: string, maxTokens: number): { text: string; trimmed: boolean } {
  if (estimateTokens(text) <= maxTokens) {
    return { text, trimmed: false };
  }

  const approxChars = Math.max(24, maxTokens * 4);
  const slice = `${text.slice(0, approxChars).trimEnd()}…`;
  return { text: slice, trimmed: true };
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function sentenceFromText(text: string, maxLength = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trimEnd()}…`;
}

export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}
