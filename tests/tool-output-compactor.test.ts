import test from "node:test";
import assert from "node:assert/strict";
import { ToolOutputCompactor } from "../src/compression/ToolOutputCompactor.js";

test("keeps short tool payloads lightweight", () => {
  const compactor = new ToolOutputCompactor(100);
  const result = compactor.compact("read", "short content");
  assert.match(result.compacted, /Summary:/);
  assert.ok((result.savedTokens ?? 0) >= 0);
});

test("compresses large tool payloads and reports token savings", () => {
  const compactor = new ToolOutputCompactor(40);
  const payload = "README section\n".repeat(80);
  const result = compactor.compact("read", payload);
  assert.match(result.compacted, /Tool: read/);
  assert.ok((result.savedTokens ?? 0) > 0);
});
