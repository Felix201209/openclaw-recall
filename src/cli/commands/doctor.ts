import fs from "node:fs";
import { Command } from "commander";
import { addJsonFlag, createCliContainer, printOutput } from "../shared.js";
import type { DoctorReport } from "../../types/domain.js";

export function registerDoctorCommands(program: Command): void {
  addJsonFlag(
    program.command("doctor").description("Run plugin diagnostics").action(async function action() {
      const { container, resolved, enabled, configPath, configExists, openclawHome } =
        await createCliContainer();
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
            status: fs.existsSync(container.database.path) ? "pass" : "warn",
            detail: container.database.path,
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
        ],
      };
      printOutput(this, report);
    }),
  );
}
