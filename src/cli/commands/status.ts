import { Command } from "commander";
import { addJsonFlag, createCliContainer, pluginConfigSources, printOutput } from "../shared.js";

export function registerStatusCommands(program: Command): void {
  addJsonFlag(
    program.command("status").description("Show plugin status").action(async function action() {
      const { container, resolved, enabled, openclawHome } = await createCliContainer();
      const memories = await container.memoryStore.listActive();
      const profiles = await container.profileStore.list(5);
      const sessions = await container.eventStore.listSessions(5);
      const latestProfile = profiles[0] ?? null;
      printOutput(this, {
        enabled,
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
        lastError:
          typeof latestProfile?.details?.error === "string" ? latestProfile.details.error : null,
        latestSession: sessions[0] ?? null,
        latestProfile,
      });
    }),
  );
}
