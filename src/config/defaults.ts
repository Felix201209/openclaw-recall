export const DEFAULT_PLUGIN_ID = "openclaw-memory-plugin";
export const DEFAULT_HTTP_PATH = "/plugins/openclaw-memory-plugin";

export const defaultPluginConfig = {
  enabled: true,
  embedding: {
    provider: "local" as const,
    model: "text-embedding-3-small",
    baseUrl: "https://api.openai.com/v1",
    dimensions: 256,
  },
  memory: {
    topK: 6,
    bootTopK: 4,
    maxWritesPerTurn: 6,
    dedupeSimilarity: 0.95,
  },
  compression: {
    recentTurns: 6,
    contextBudget: 2400,
    historySummaryThreshold: 6,
    toolCompactionThresholdChars: 600,
  },
  profile: {
    retainRuns: 500,
  },
  inspect: {
    httpPath: DEFAULT_HTTP_PATH,
  },
};
