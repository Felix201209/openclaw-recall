import { Command } from "commander";
import { addJsonFlag, createCliContainer, printOutput } from "../shared.js";

export function registerExportCommands(program: Command): void {
  const root = addJsonFlag(program.command("export").description("Export memory, sessions, and profiles for backup or recovery"));

  addJsonFlag(
    root
      .command("memory")
      .option("--format <format>", "json | jsonl", "json")
      .action(async function action() {
        const { exportService } = await createCliContainer();
        printOutput(this, await exportService.exportMemory(this.opts().format));
      }),
  );

  addJsonFlag(
    root
      .command("profile")
      .option("--format <format>", "json | jsonl", "json")
      .action(async function action() {
        const { exportService } = await createCliContainer();
        printOutput(this, await exportService.exportProfile(this.opts().format));
      }),
  );

  addJsonFlag(
    root
      .command("session")
      .option("--session <id>", "Optional session id to export")
      .option("--format <format>", "json | jsonl", "json")
      .action(async function action() {
        const { exportService } = await createCliContainer();
        printOutput(this, await exportService.exportSession(this.opts().session, this.opts().format));
      }),
  );
}
