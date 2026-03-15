import path from "node:path";
import { homedir } from "node:os";
import { defaultPluginConfig } from "./defaults.js";
import type { OpenClawMemoryPluginConfig, ResolvedPluginConfig } from "./schema.js";

export function resolveOpenClawHome(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.OPENCLAW_HOME?.trim();
  if (!configured) {
    return path.join(homedir(), ".openclaw");
  }
  return path.basename(configured) === ".openclaw"
    ? configured
    : path.join(configured, ".openclaw");
}

export function resolvePluginStateDir(
  pluginConfig: OpenClawMemoryPluginConfig | undefined,
  openclawHome: string,
): string {
  return pluginConfig?.storageDir?.trim() || path.join(openclawHome, "plugins", "openclaw-memory-plugin");
}

export function resolvePluginConfig(params: {
  pluginConfig?: OpenClawMemoryPluginConfig;
  env?: NodeJS.ProcessEnv;
  openclawHome?: string;
}): ResolvedPluginConfig {
  const env = params.env ?? process.env;
  const pluginConfig = params.pluginConfig ?? {};
  const openclawHome = params.openclawHome ?? resolveOpenClawHome(env);
  const storageDir = resolvePluginStateDir(pluginConfig, openclawHome);

  const embeddingProvider = env.OPENCLAW_MEMORY_PLUGIN_EMBEDDING_PROVIDER?.trim() as
    | "local"
    | "openai"
    | undefined;

  return {
    enabled: pluginConfig.enabled ?? true,
    storageDir,
    databasePath: path.join(storageDir, "memory.sqlite"),
    embedding: {
      provider:
        embeddingProvider ??
        pluginConfig.embedding?.provider ??
        defaultPluginConfig.embedding.provider,
      apiKey:
        env.OPENCLAW_MEMORY_PLUGIN_EMBEDDING_API_KEY?.trim() ||
        pluginConfig.embedding?.apiKey,
      model:
        env.OPENCLAW_MEMORY_PLUGIN_EMBEDDING_MODEL?.trim() ||
        pluginConfig.embedding?.model ||
        defaultPluginConfig.embedding.model,
      baseUrl:
        env.OPENCLAW_MEMORY_PLUGIN_EMBEDDING_BASE_URL?.trim() ||
        pluginConfig.embedding?.baseUrl ||
        defaultPluginConfig.embedding.baseUrl,
      dimensions:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_EMBEDDING_DIMENSIONS) ??
        pluginConfig.embedding?.dimensions ??
        defaultPluginConfig.embedding.dimensions,
    },
    memory: {
      topK:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_MEMORY_TOP_K) ??
        pluginConfig.memory?.topK ??
        defaultPluginConfig.memory.topK,
      bootTopK:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_BOOT_TOP_K) ??
        pluginConfig.memory?.bootTopK ??
        defaultPluginConfig.memory.bootTopK,
      maxWritesPerTurn:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_MAX_WRITES) ??
        pluginConfig.memory?.maxWritesPerTurn ??
        defaultPluginConfig.memory.maxWritesPerTurn,
      dedupeSimilarity:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_DEDUPE_SIMILARITY) ??
        pluginConfig.memory?.dedupeSimilarity ??
        defaultPluginConfig.memory.dedupeSimilarity,
    },
    compression: {
      recentTurns:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_RECENT_TURNS) ??
        pluginConfig.compression?.recentTurns ??
        defaultPluginConfig.compression.recentTurns,
      contextBudget:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_CONTEXT_BUDGET) ??
        pluginConfig.compression?.contextBudget ??
        defaultPluginConfig.compression.contextBudget,
      historySummaryThreshold:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_HISTORY_THRESHOLD) ??
        pluginConfig.compression?.historySummaryThreshold ??
        defaultPluginConfig.compression.historySummaryThreshold,
      toolCompactionThresholdChars:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_TOOL_THRESHOLD) ??
        pluginConfig.compression?.toolCompactionThresholdChars ??
        defaultPluginConfig.compression.toolCompactionThresholdChars,
    },
    profile: {
      retainRuns:
        parseNumber(env.OPENCLAW_MEMORY_PLUGIN_PROFILE_RETAIN_RUNS) ??
        pluginConfig.profile?.retainRuns ??
        defaultPluginConfig.profile.retainRuns,
    },
    inspect: {
      httpPath:
        env.OPENCLAW_MEMORY_PLUGIN_HTTP_PATH?.trim() ||
        pluginConfig.inspect?.httpPath ||
        defaultPluginConfig.inspect.httpPath,
    },
  };
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
