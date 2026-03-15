import { DEFAULT_HTTP_PATH } from "./defaults.js";

export type EmbeddingProviderId = "local" | "openai";

export type OpenClawMemoryPluginConfig = {
  enabled?: boolean;
  storageDir?: string;
  embedding?: {
    provider?: EmbeddingProviderId;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    dimensions?: number;
  };
  memory?: {
    topK?: number;
    bootTopK?: number;
    maxWritesPerTurn?: number;
    dedupeSimilarity?: number;
  };
  compression?: {
    recentTurns?: number;
    contextBudget?: number;
    historySummaryThreshold?: number;
    toolCompactionThresholdChars?: number;
  };
  profile?: {
    retainRuns?: number;
  };
  inspect?: {
    httpPath?: string;
  };
};

export type ResolvedPluginConfig = {
  enabled: boolean;
  storageDir: string;
  databasePath: string;
  embedding: {
    provider: EmbeddingProviderId;
    apiKey?: string;
    model: string;
    baseUrl: string;
    dimensions: number;
  };
  memory: {
    topK: number;
    bootTopK: number;
    maxWritesPerTurn: number;
    dedupeSimilarity: number;
  };
  compression: {
    recentTurns: number;
    contextBudget: number;
    historySummaryThreshold: number;
    toolCompactionThresholdChars: number;
  };
  profile: {
    retainRuns: number;
  };
  inspect: {
    httpPath: string;
  };
};

export const pluginConfigSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    enabled: { type: "boolean" },
    storageDir: { type: "string" },
    embedding: {
      type: "object",
      additionalProperties: false,
      properties: {
        provider: { type: "string", enum: ["local", "openai"] },
        apiKey: { type: "string" },
        model: { type: "string" },
        baseUrl: { type: "string" },
        dimensions: { type: "number" },
      },
    },
    memory: {
      type: "object",
      additionalProperties: false,
      properties: {
        topK: { type: "number", minimum: 1, maximum: 20 },
        bootTopK: { type: "number", minimum: 1, maximum: 20 },
        maxWritesPerTurn: { type: "number", minimum: 1, maximum: 20 },
        dedupeSimilarity: { type: "number", minimum: 0, maximum: 1 },
      },
    },
    compression: {
      type: "object",
      additionalProperties: false,
      properties: {
        recentTurns: { type: "number", minimum: 2, maximum: 20 },
        contextBudget: { type: "number", minimum: 800, maximum: 64000 },
        historySummaryThreshold: { type: "number", minimum: 4, maximum: 200 },
        toolCompactionThresholdChars: { type: "number", minimum: 100, maximum: 200000 },
      },
    },
    profile: {
      type: "object",
      additionalProperties: false,
      properties: {
        retainRuns: { type: "number", minimum: 10, maximum: 10000 },
      },
    },
    inspect: {
      type: "object",
      additionalProperties: false,
      properties: {
        httpPath: { type: "string", default: DEFAULT_HTTP_PATH },
      },
    },
  },
} as const;

export const runtimePluginConfigSchema = {
  jsonSchema: pluginConfigSchema,
  uiHints: {
    "embedding.provider": {
      label: "Embedding Provider",
      help: "Use local hashed embeddings or OpenAI-compatible embeddings.",
    },
    "embedding.apiKey": {
      label: "Embedding API Key",
      sensitive: true,
      placeholder: "sk-proj-...",
      help: "Required only for OpenAI-compatible embedding mode.",
    },
    "compression.contextBudget": {
      label: "Context Budget",
      help: "Maximum estimated tokens for injected memory and compression context.",
    },
    "inspect.httpPath": {
      label: "Inspect HTTP Path",
      help: "Plugin inspect route prefix. Defaults to /plugins/openclaw-memory-plugin.",
    },
  },
  parse(value: unknown): OpenClawMemoryPluginConfig {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }
    return value as OpenClawMemoryPluginConfig;
  },
};
