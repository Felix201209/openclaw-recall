import test from "node:test";
import assert from "node:assert/strict";
import { ToolOutputCompactor } from "../src/compression/ToolOutputCompactor.js";

function legacyCompaction(toolName: string, payload: string): string {
  const lines = payload
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 10)
    .map((line, index) => `${index + 1}. ${line.slice(0, 160)}`)
    .join("\n");
  return [`Tool: ${toolName}`, `Summary: ${payload.slice(0, 180)}`, lines ? `Key facts:\n${lines}` : ""]
    .filter(Boolean)
    .join("\n");
}

test("structural compaction preserves more useful signal than the legacy line-based baseline", () => {
  const compactor = new ToolOutputCompactor(40);
  const payload = [
    "$ npm run build",
    "$ npm run test:integration",
    "",
    "Error: build failed",
    "    at compile (src/build.ts:10:2)",
    "    at main (src/index.ts:5:1)",
    "",
    "```ts",
    "export function buildProject() {",
    "  return compileProject();",
    "}",
    "```",
    "",
    "Repeated reminder: backend scope import quality matters.",
    "Repeated reminder: backend scope import quality matters.",
    "Repeated reminder: backend scope import quality matters.",
  ].join("\n");

  const result = compactor.compact("run", payload);
  const legacy = legacyCompaction("run", payload);

  assert.match(result.compacted, /Command:/);
  assert.match(result.compacted, /Error:/);
  assert.match(result.compacted, /Code:/);
  assert.ok((result.savedTokens ?? 0) > 0);
  assert.ok(result.compacted.length < payload.length);
  assert.ok(result.compacted.length <= legacy.length + 120);
});

test("structural compaction reduces low-value repetition while keeping key facts for semi-structured output", () => {
  const compactor = new ToolOutputCompactor(40);
  const payload = Array.from({ length: 20 }, (_, index) =>
    index < 10
      ? `- repeated item: backend scope import quality`
      : `field_${index}: value_${index}`
  ).join("\n");

  const result = compactor.compact("inspect", payload);

  assert.ok((result.savedTokens ?? 0) > 0);
  assert.ok((result.compacted.match(/backend scope import quality/g) ?? []).length <= 2);
  assert.match(result.compacted, /Key facts:/);
});

test("structural compaction unwraps provider-style text wrappers before chunking", () => {
  const compactor = new ToolOutputCompactor(40);
  const payload = {
    content: [
      {
        type: "text",
        text: [
          "# Plugin Smoke Workspace",
          "",
          "This file exists to exercise OpenClaw tool execution and force compaction savings.",
          "",
          "Sections:",
          "- runtime",
          "- memory",
          "- compression",
          "",
          "Details:",
          "OpenClaw Recall stores structured memory, compressed tool output, and prompt profiles.",
        ].join("\n"),
      },
    ],
  };

  const result = compactor.compact("read", payload);
  const serialized = JSON.stringify(payload, null, 2) ?? "";

  assert.doesNotMatch(result.compacted, /"content"/);
  assert.match(result.compacted, /Plugin Smoke Workspace/);
  assert.ok(result.compacted.length < serialized.length);
  assert.ok((result.savedTokens ?? 0) >= 0);
});
