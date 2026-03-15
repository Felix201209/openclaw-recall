import path from "node:path";
import { resolveOpenClawHome } from "../config/loader.js";

export function resolvePluginPaths(env: NodeJS.ProcessEnv = process.env): {
  openclawHome: string;
  pluginRoot: string;
  databasePath: string;
  importsDir: string;
  exportsDir: string;
  reportsDir: string;
  latestImportPath: string;
  latestExportPath: string;
} {
  const openclawHome = resolveOpenClawHome(env);
  const pluginRoot = path.join(openclawHome, "plugins", "openclaw-recall");
  const reportsDir = path.join(pluginRoot, "reports");
  return {
    openclawHome,
    pluginRoot,
    databasePath: path.join(pluginRoot, "memory.sqlite"),
    importsDir: path.join(pluginRoot, "imports"),
    exportsDir: path.join(pluginRoot, "exports"),
    reportsDir,
    latestImportPath: path.join(reportsDir, "latest-import.json"),
    latestExportPath: path.join(reportsDir, "latest-export.json"),
  };
}
