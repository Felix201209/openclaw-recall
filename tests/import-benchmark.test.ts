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

test("import benchmark keeps useful preference/project context and rejects noise in the same run", async () => {
  const tempDir = await createTempDir("openclaw-recall-import-benchmark-");
  const previousHome = process.env.OPENCLAW_HOME;
  try {
    process.env.OPENCLAW_HOME = tempDir;
    const fixtureRoot = path.join(tempDir, "fixtures");
    await fs.mkdir(path.join(fixtureRoot, "sessions"), { recursive: true });
    await fs.mkdir(path.join(fixtureRoot, "memories"), { recursive: true });
    await fs.writeFile(
      path.join(fixtureRoot, "sessions", "mixed.json"),
      JSON.stringify({
        turns: [
          {
            id: "u1",
            sessionId: "import-bench",
            role: "user",
            text: "以后默认叫我 Felix，用中文回答，并且尽量简洁。",
            createdAt: new Date().toISOString(),
          },
          {
            id: "u2",
            sessionId: "import-bench",
            role: "user",
            text: "项目上下文：Recall v1.1 主要聚焦 backend、scope 和 import quality。",
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    );
    await fs.writeFile(
      path.join(fixtureRoot, "memories", "noise-and-dup.json"),
      JSON.stringify([
        {
          kind: "session_state",
          summary: 'Sender (untrusted metadata): {"label":"openclaw-control-ui"}',
          content: 'Sender (untrusted metadata): {"label":"openclaw-control-ui"}',
        },
        {
          kind: "semantic",
          summary: "Project focus is backend, scope, and import quality for Recall v1.1.",
          content: "Project focus is backend, scope, and import quality for Recall v1.1.",
          scope: "shared",
          scopeKey: "shared:team-alpha",
          memoryGroup: "semantic:project",
        },
      ]),
    );

    const container = createTestContainer(tempDir, {
      identity: { mode: "shared", sharedScope: "team-alpha", workspaceScope: "workspace-alpha", userScope: "felix" },
    });
    const importer = new ImportService(container, container.config, fixtureRoot);
    const report = await importer.run();
    const memories = await container.memoryStore.listActive();
    const retrieval = await container.memoryRetriever.retrieveWithContext("你记得我的偏好和当前项目重点吗？", 3, {
      sessionId: "import-bench",
    });

    assert.ok(report.imported >= 2);
    assert.ok(report.rejectedNoise >= 1);
    assert.ok((report.scopeCounts?.workspace ?? 0) >= 1);
    assert.ok(memories.some((memory) => memory.kind === "preference"));
    assert.ok(memories.some((memory) => memory.kind === "semantic" && memory.scope === "workspace"));
    assert.ok(retrieval.memories.some((memory) => memory.kind === "preference"));
    assert.ok(retrieval.memories.some((memory) => memory.kind === "semantic"));
  } finally {
    if (previousHome === undefined) {
      delete process.env.OPENCLAW_HOME;
    } else {
      process.env.OPENCLAW_HOME = previousHome;
    }
    await cleanupTempDir(tempDir);
  }
});

