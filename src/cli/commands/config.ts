import { Command } from "commander";
import { addJsonFlag, loadOpenClawPluginConfig, printOutput } from "../shared.js";
import type { ConfigValidationIssue, ConfigValidationReport } from "../../types/domain.js";

export function registerConfigCommands(program: Command): void {
  const config = addJsonFlag(program.command("config").description("Inspect plugin configuration"));

  addJsonFlag(
    config.command("show").action(async function action() {
      const loaded = await loadOpenClawPluginConfig();
      printOutput(this, {
        openclawHome: loaded.openclawHome,
        configPath: loaded.configPath,
        configExists: loaded.configExists,
        enabled: loaded.enabled,
        pluginConfig: loaded.pluginConfig ?? {},
        resolved: loaded.resolved,
      });
    }),
  );

  addJsonFlag(
    config.command("validate").description("Validate plugin configuration").action(async function action() {
      const loaded = await loadOpenClawPluginConfig();
      const issues: ConfigValidationIssue[] = [];

      if (!loaded.configExists) {
        issues.push({
          field: "openclaw.json",
          severity: "warn",
          message: "OpenClaw config does not exist yet.",
          repairHint: "Run `openclaw plugins install --link /path/to/openclaw-memory-plugin` first.",
        });
      }

      if (!loaded.enabled) {
        issues.push({
          field: "plugins.entries.openclaw-memory-plugin.enabled",
          severity: "warn",
          message: "Plugin entry is disabled.",
          repairHint: "Run `openclaw plugins enable openclaw-memory-plugin`.",
        });
      }

      if (
        loaded.resolved.embedding.provider === "openai" &&
        !loaded.resolved.embedding.apiKey?.trim()
      ) {
        issues.push({
          field: "embedding.apiKey",
          severity: "error",
          message: "OpenAI-compatible embeddings were selected but no API key was found.",
          repairHint: "Set OPENCLAW_MEMORY_PLUGIN_EMBEDDING_API_KEY or plugins.entries.openclaw-memory-plugin.config.embedding.apiKey.",
        });
      }

      if (!loaded.resolved.inspect.httpPath.startsWith("/plugins/")) {
        issues.push({
          field: "inspect.httpPath",
          severity: "warn",
          message: "Inspect path does not use the standard /plugins/ prefix.",
          repairHint: "Use /plugins/openclaw-memory-plugin or another plugin-prefixed route.",
        });
      }

      const report: ConfigValidationReport = {
        valid: !issues.some((issue) => issue.severity === "error"),
        issues,
        precedence: [
          "environment variables OPENCLAW_MEMORY_PLUGIN_*",
          "plugins.entries.openclaw-memory-plugin.config",
          "src/config/defaults.ts",
        ],
      };
      printOutput(this, report);
    }),
  );
}
