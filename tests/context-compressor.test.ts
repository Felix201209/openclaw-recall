import test from "node:test";
import assert from "node:assert/strict";
import { ContextCompressor } from "../src/compression/ContextCompressor.js";
import type { ChatTurn, SessionState } from "../src/types/domain.js";

test("does not summarize when history is below threshold", () => {
  const compressor = new ContextCompressor(4, 6);
  const turns = [turn("user", "one"), turn("assistant", "two"), turn("user", "three")];
  const result = compressor.compress(turns, emptyState());
  assert.equal(result.summary, "");
  assert.equal(result.compressedTurns.length, 0);
  assert.equal(result.keptRecentTurns.length, 3);
});

test("summarizes older history once threshold is exceeded", () => {
  const compressor = new ContextCompressor(2, 4);
  const turns = [
    turn("user", "We fixed the memory pipeline."),
    turn("assistant", "Done."),
    turn("user", "The next step is compression."),
    turn("assistant", "Agreed."),
    turn("user", "Please keep concise answers."),
  ];
  const result = compressor.compress(turns, {
    ...emptyState(),
    currentTask: "Improve compression",
  });
  assert.ok(result.summary.includes("Task: Improve compression"));
  assert.equal(result.keptRecentTurns.length, 2);
  assert.ok((result.savedTokens ?? 0) >= 0);
});

function turn(role: ChatTurn["role"], text: string): ChatTurn {
  return {
    id: `${role}-${text}`,
    sessionId: "session-1",
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

function emptyState(): SessionState {
  return {
    sessionId: "session-1",
    constraints: [],
    decisions: [],
    openQuestions: [],
    updatedAt: new Date().toISOString(),
  };
}
