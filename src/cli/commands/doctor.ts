import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { addJsonFlag, createCliContainer, printOutput } from "../shared.js";
import type { DoctorReport } from "../../types/domain.js";

export function registerDoctorCommands(program: Command): void {
  addJsonFlag(
    program.command("doctor").description("Run plugin diagnostics").action(async function action() {
      const { container, resolved, enabled, configPath, configExists, openclawHome } =
        await createCliContainer();
      const profiles = await container.profileStore.list(5);
      const sessions = await container.eventStore.listSessions(5);
      const memories = await container.memoryStore.listActive();
      const latestProfile = profiles[0] ?? null;
      const toolResults = sessions[0]
        ? await container.toolOutputStore.listSession(sessions[0].sessionId, 10)
        : [];
      const writable = await isWritable(path.dirname(container.database.path));
      const sqliteHealthy = isSqliteHealthy(container.database);
      const promptLayers = Array.isArray(latestProfile?.details?.promptLayers)
        ? (latestProfile?.details?.promptLayers as Array<Record<string, unknown>>)
        : [];
      const hasCompressionLayer = promptLayers.some(
        (layer) => layer.name === "OLDER HISTORY SUMMARY" || layer.name === "COMPRESSED TOOL OUTPUT",
      );
      const report: DoctorReport = {
        generatedAt: new Date().toISOString(),
        dataDir: resolved.storageDir,
        databasePath: container.database.path,
        openclawHome,
        checks: [
          {
            name: "openclaw config",
            status: configExists ? "pass" : "warn",
            detail: configExists ? `Found ${configPath}` : `No config found at ${configPath}`,
          },
          {
            name: "plugin enabled",
            status: enabled ? "pass" : "warn",
            detail: enabled
              ? "plugins.entries.openclaw-memory-plugin.enabled is active or defaults to true"
              : "Plugin entry is disabled in OpenClaw config",
          },
          {
            name: "database path",
            status:
              fs.existsSync(container.database.path) && sqliteHealthy && writable ? "pass" : "warn",
            detail: `${container.database.path} (sqlite=${sqliteHealthy ? "ok" : "check failed"}, writable=${writable})`,
          },
          {
            name: "embedding provider",
            status:
              resolved.embedding.provider === "local" ||
              Boolean(resolved.embedding.apiKey?.trim())
                ? "pass"
                : "warn",
            detail:
              resolved.embedding.provider === "local"
                ? "Local hashed embeddings enabled"
                : "OpenAI-compatible embeddings selected but no API key detected",
          },
          {
            name: "inspect route",
            status: resolved.inspect.httpPath.startsWith("/plugins/") ? "pass" : "warn",
            detail: resolved.inspect.httpPath,
          },
          {
            name: "recent hook activity",
            status: latestProfile || sessions[0] ? "pass" : "warn",
            detail: latestProfile?.createdAt ?? sessions[0]?.updatedAt ?? "No recorded runs yet",
          },
          {
            name: "memory pipeline",
            status: memories.length > 0 || (latestProfile?.memoryWritten ?? 0) > 0 ? "pass" : "warn",
            detail:
              memories.length > 0
                ? `${memories.length} active memories stored`
                : "No memory writes recorded yet",
          },
          {
            name: "retrieval pipeline",
            status: (latestProfile?.retrievalCount ?? 0) > 0 ? "pass" : "warn",
            detail:
              (latestProfile?.retrievalCount ?? 0) > 0
                ? `Latest run retrieved ${latestProfile?.retrievalCount} memories`
                : "No retrieval activity recorded yet",
          },
          {
            name: "compression pipeline",
            status:
              (latestProfile?.compressionSavings ?? 0) > 0 || hasCompressionLayer ? "pass" : "warn",
            detail:
              latestProfile
                ? `Latest savings=${latestProfile.compressionSavings}, layers=${promptLayers.length}`
                : "No compression profile recorded yet",
          },
          {
            name: "tool compaction",
            status: toolResults.length > 0 ? "pass" : "warn",
            detail:
              toolResults.length > 0
                ? `Recent session has ${toolResults.length} compacted tool outputs`
                : "No compacted tool outputs recorded yet",
          },
        ],
      };
      printOutput(this, report);
    }),
  );
}

async function isWritable(dirPath: string): Promise<boolean> {
  try {
    await fsPromises.mkdir(dirPath, { recursive: true });
    const probe = path.join(dirPath, ".write-test");
    await fsPromises.writeFile(probe, "ok");
    await fsPromises.rm(probe, { force: true });
    return true;
  } catch {
    return false;
  }
}

function isSqliteHealthy(database: { connection: { prepare: (sql: string) => { get: () => unknown } } }): boolean {
  try {
    database.connection.prepare("SELECT 1 AS ok").get();
    return true;
  } catch {
    return false;
  }
}
