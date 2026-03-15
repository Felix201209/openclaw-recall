import { Command } from "commander";
import { addJsonFlag, createCliContainer, printOutput } from "../shared.js";

export function registerSessionCommands(program: Command): void {
  const session = addJsonFlag(program.command("session").description("Inspect plugin session data"));

  addJsonFlag(
    session
      .command("list")
      .option("--limit <n>", "Maximum records", "20")
      .action(async function action() {
        const { container } = await createCliContainer();
        printOutput(this, await container.eventStore.listSessions(Number(this.opts().limit)));
      }),
  );

  addJsonFlag(
    session
      .command("inspect")
      .argument("<sessionId>", "Session id")
      .action(async function action(sessionId: string) {
        const { container } = await createCliContainer();
        const summary = await container.eventStore.getSessionSummary(sessionId);
        if (!summary) {
          printOutput(this, null);
          return;
        }
        printOutput(this, {
          summary,
          state: await container.stateStore.get(sessionId),
          transcript: await container.eventStore.listTurns(sessionId),
          toolResults: await container.toolOutputStore.listSession(sessionId, 25),
          profiles: await container.profileStore.list(25, { sessionId }),
        });
      }),
  );
}
