import test from "node:test";
import assert from "node:assert/strict";
import { BudgetManager } from "../src/compression/BudgetManager.js";

test("never trims protected layers and trims lower-priority layers first", () => {
  const manager = new BudgetManager();
  const layers = manager.fit(60, [
    {
      name: "SYSTEM",
      content: "system ".repeat(30),
      priority: 100,
      targetRatio: 0.3,
      minTokens: 10,
      neverTrim: true,
    },
    {
      name: "OLDER HISTORY SUMMARY",
      content: "history ".repeat(50),
      priority: 10,
      targetRatio: 0.4,
      minTokens: 8,
    },
    {
      name: "CURRENT USER MESSAGE",
      content: "current user message should survive",
      priority: 110,
      targetRatio: 0.3,
      minTokens: 8,
      neverTrim: true,
    },
  ]);

  const system = layers.find((layer) => layer.name === "SYSTEM");
  const history = layers.find((layer) => layer.name === "OLDER HISTORY SUMMARY");
  const current = layers.find((layer) => layer.name === "CURRENT USER MESSAGE");

  assert.equal(system?.trimmed, false);
  assert.equal(current?.trimmed, false);
  assert.equal(history?.trimmed, true);
});
