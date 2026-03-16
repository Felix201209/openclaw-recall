import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { PluginContainer } from "../src/plugin/runtime-state.js";
import { resolvePluginConfig } from "../src/config/loader.js";
import { ImportService } from "../src/importing/ImportService.js";
import { createTempDir, cleanupTempDir } from "./helpers/temp-db.js";

function createTestContainer(
  openclawHome: string,
  overrides: {
    identity?: Partial<ReturnType<typeof resolvePluginConfig>["identity"]>;
  } = {},
): PluginContainer {
  return new PluginContainer(
    resolvePluginConfig({
      env: {
        ...process.env,
        OPENCLAW_HOME: openclawHome,
      },
      pluginConfig: {
        storageDir: path.join(openclawHome, ".openclaw", "plugins", "openclaw-recall"),
        identity: { mode: "local", ...overrides.identity },
      },
      openclawHome: path.join(openclawHome, ".openclaw"),
    }),
    {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    },
  );
}

test("v1.3 hybrid retrieval uses RRF-style fusion to preserve mixed preference, project, and task context", async () => {
  const tempDir = await createTempDir("openclaw-recall-v13-rrf-");
  try {
    const container = createTestContainer(tempDir);
    const now = new Date().toISOString();
    await container.memoryStore.upsertMany([
      {
        id: "pref-1",
        kind: "preference",
        summary: "User prefers concise Chinese updates.",
        content: "User prefers concise Chinese updates.",
        topics: ["user", "prefers", "concise", "chinese", "updates"],
        entityKeys: ["recall", "backend"],
        salience: 9,
        fingerprint: "pref-1",
        createdAt: now,
        lastSeenAt: now,
        ttlDays: 180,
        decayRate: 0.01,
        confidence: 0.93,
        importance: 9.2,
        active: true,
        scope: "private",
        scopeKey: "user:default",
        sourceSessionId: "seed",
        sourceTurnIds: ["pref-1"],
        embedding: [0.9, 0.1, 0.2],
      },
      {
        id: "pref-2",
        kind: "preference",
        summary: "User prefers direct execution-first reporting.",
        content: "User prefers direct execution-first reporting.",
        topics: ["direct", "execution", "reporting"],
        entityKeys: ["recall"],
        salience: 8.8,
        fingerprint: "pref-2",
        createdAt: now,
        lastSeenAt: now,
        ttlDays: 180,
        decayRate: 0.01,
        confidence: 0.92,
        importance: 9.1,
        active: true,
        scope: "private",
        scopeKey: "user:default",
        sourceSessionId: "seed",
        sourceTurnIds: ["pref-2"],
        embedding: [0.88, 0.12, 0.18],
      },
      {
        id: "semantic-1",
        kind: "semantic",
        summary: "Project focus is backend import quality and retrieval composition for Recall.",
        content: "Project focus is backend import quality and retrieval composition for Recall.",
        topics: ["project", "backend", "import", "quality", "retrieval", "recall"],
        entityKeys: ["recall", "backend", "import"],
        salience: 8.7,
        fingerprint: "semantic-1",
        createdAt: now,
        lastSeenAt: now,
        ttlDays: 120,
        decayRate: 0.01,
        confidence: 0.9,
        importance: 8.9,
        active: true,
        scope: "workspace",
        scopeKey: "workspace:default",
        memoryGroup: "semantic:project",
        sourceSessionId: "seed",
        sourceTurnIds: ["semantic-1"],
        embedding: [0.1, 0.95, 0.2],
      },
      {
        id: "task-1",
        kind: "session_state",
        summary: "Current task: verify reconnect import roundtrip and profile visibility.",
        content: "Current task: verify reconnect import roundtrip and profile visibility.",
        topics: ["current", "task", "reconnect", "import", "roundtrip", "profile"],
        entityKeys: ["import", "profile"],
        salience: 8.4,
        fingerprint: "task-1",
        createdAt: now,
        lastSeenAt: now,
        ttlDays: 21,
        decayRate: 0.08,
        confidence: 0.88,
        importance: 8.5,
        active: true,
        scope: "session",
        scopeKey: "session:s1",
        sourceSessionId: "s1",
        sourceTurnIds: ["task-1"],
        embedding: [0.2, 0.85, 0.25],
      },
    ]);

    const result = await container.memoryRetriever.explainDetailed(
      "继续当前 Recall backend import 任务，并记得我的偏好和项目重点",
      3,
      { sessionId: "s1" },
    );

    assert.equal(result.selected.length, 3);
    assert.ok(result.selected.some((memory) => memory.kind === "preference"));
    assert.ok(result.selected.some((memory) => memory.kind === "semantic"));
    assert.ok(result.selected.some((memory) => memory.kind === "session_state"));
    assert.ok(result.selected.some((memory) => (memory.scoreBreakdown?.rrfContribution ?? 0) > 0));
  } finally {
    await cleanupTempDir(tempDir);
  }
});

test("v1.3 import chunking preserves multiple useful long-form project facts for later recall", async () => {
  const tempDir = await createTempDir("openclaw-recall-v13-import-chunk-");
  const previousHome = process.env.OPENCLAW_HOME;
  try {
    process.env.OPENCLAW_HOME = tempDir;
    const fixtureRoot = path.join(tempDir, "fixtures");
    await fs.mkdir(path.join(fixtureRoot, "memories"), { recursive: true });
    const largeContent = [
      "Recall v1.3 project context starts with backend and reconnect quality.",
      "",
      "It also focuses on import normalization, scope preservation, and retrieval composition.",
      "",
      ...Array.from({ length: 60 }, (_, index) =>
        `Detail ${index + 1}: preserve project facts, operator visibility, and practical token efficiency without leaking scaffold.`,
      ),
      "",
      "The current task focus includes prompt memory dedupe and better tool-output structural compaction.",
    ].join("\n");

    await fs.writeFile(
      path.join(fixtureRoot, "memories", "large-memory.json"),
      JSON.stringify([
        {
          kind: "semantic",
          summary: "Recall v1.3 project context",
          content: largeContent,
          scope: "workspace",
          memoryGroup: "semantic:project",
        },
      ]),
    );

    const container = createTestContainer(tempDir);
    const importer = new ImportService(container, container.config, fixtureRoot);
    const report = await importer.run();
    const memories = await container.memoryStore.listActive();
    const retrieval = await container.memoryRetriever.retrieveWithContext(
      "当前 Recall v1.3 项目重点是什么？也记得 compaction 和 import 方向",
      4,
      { sessionId: "import-s1" },
    );

    assert.ok(report.imported >= 2);
    assert.ok(memories.filter((memory) => memory.memoryGroup?.startsWith("import:")).length >= 2);
    assert.ok(retrieval.memories.some((memory) => /compaction|import/i.test(`${memory.summary} ${memory.content}`)));
  } finally {
    if (previousHome === undefined) {
      delete process.env.OPENCLAW_HOME;
    } else {
      process.env.OPENCLAW_HOME = previousHome;
    }
    await cleanupTempDir(tempDir);
  }
});
