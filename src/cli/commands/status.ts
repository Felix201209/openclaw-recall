import { Command } from "commander";
import { addJsonFlag, createCliContainer, printOutput } from "../shared.js";

export function registerStatusCommands(program: Command): void {
  addJsonFlag(
    program.command("status").description("Show plugin status").action(async function action() {
      const { container, resolved, enabled, openclawHome } = await createCliContainer();
      const memories = await container.memoryStore.listActive();
      const profiles = await container.profileStore.list(5);
      const sessions = await container.eventStore.listSessions(5);
      printOutput(this, {
        enabled,
        openclawHome,
        databasePath: container.database.path,
        embeddingProvider: resolved.embedding.provider,
        inspectPath: resolved.inspect.httpPath,
        memoryCount: memories.length,
        profileCount: profiles.length,
        sessionCount: sessions.length,
        latestSession: sessions[0] ?? null,
        latestProfile: profiles[0] ?? null,
      });
    }),
  );
}
