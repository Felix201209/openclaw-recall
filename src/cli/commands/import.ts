import { Command } from "commander";
import { addJsonFlag, createCliContainer, printOutput } from "../shared.js";

export function registerImportCommands(program: Command): void {
  const root = addJsonFlag(program.command("import").description("Import memory and session artifacts"));

  addJsonFlag(
    root
      .command("dry-run")
      .argument("[paths...]", "Optional extra roots to scan")
      .action(async function action(paths: string[] = []) {
        const { importService } = await createCliContainer();
        printOutput(this, await importService.dryRun(paths));
      }),
  );

  addJsonFlag(
    root
      .command("run")
      .argument("[paths...]", "Optional extra roots to scan")
      .action(async function action(paths: string[] = []) {
        const { importService } = await createCliContainer();
        printOutput(this, await importService.run(paths));
      }),
  );

  addJsonFlag(
    root.command("status").action(async function action() {
      const { importService } = await createCliContainer();
      printOutput(this, await importService.status());
    }),
  );
}
