import { Command } from "commander";
import { addJsonFlag, createCliContainer, pluginConfigSources, printOutput } from "../shared.js";
import { readJsonFile } from "../../shared/fileStore.js";
import { explainSuppression } from "../../memory/MemoryRanker.js";
import type { PruneReport } from "../../types/domain.js";

export function registerStatusCommands(program: Command): void {
  addJsonFlag(
    program.command("status").description("Show plugin status").action(async function action() {
      const { container, resolved, enabled, openclawHome, identity, importService, exportService, pluginPaths } =
        await createCliContainer();
      const memories = await container.memoryStore.listActive();
      const profiles = await container.profileStore.list(5);
      const sessions = await container.eventStore.listSessions(5);
      const latestProfile = profiles[0] ?? null;
      const latestImport = await importService.status();
      const latestExport = await exportService.latest();
      const latestPrune = await readJsonFile<PruneReport | null>(pluginPaths.latestPrunePath, null);
      const identityStatus = identity.status();
      const noisyCandidates = memories
        .map((memory) => ({ id: memory.id, reasons: explainSuppression(memory) }))
        .filter((entry) => entry.reasons.length > 0);
      printOutput(this, {
        enabled,
        mode: identityStatus.mode,
        identity: identityStatus,
        autoWriteEnabled: resolved.memory.autoWrite,
        openclawHome,
        databasePath: container.database.path,
        embeddingProvider: resolved.embedding.provider,
        inspectPath: resolved.inspect.httpPath,
        configSources: pluginConfigSources(),
        memoryCount: memories.length,
        profileCount: profiles.length,
        sessionCount: sessions.length,
        lastHookExecutionAt: latestProfile?.createdAt ?? sessions[0]?.updatedAt ?? null,
        recentRetrievalCount: latestProfile?.retrievalCount ?? 0,
        recentCompressionSavings: latestProfile?.compressionSavings ?? 0,
        recentMemoryWrites: latestProfile?.memoryWritten ?? 0,
        lastImportTime: latestImport?.completedAt ?? null,
        recentImportStats: latestImport
          ? {
              imported: latestImport.imported,
              skippedDuplicates: latestImport.skippedDuplicates,
              rejectedNoise: latestImport.rejectedNoise,
            }
          : null,
        lastExportPath: latestExport?.outputPath ?? null,
        lastPrune: latestPrune,
        noisyActiveMemoryCount: noisyCandidates.length,
        lastRecoveryWarning: identityStatus.warnings[0] ?? null,
        lastError:
          typeof latestProfile?.details?.error === "string" ? latestProfile.details.error : null,
        latestSession: sessions[0] ?? null,
        latestProfile,
      });
    }),
  );
}
