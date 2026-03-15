export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatTurn {
  id: string;
  sessionId: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export type MemoryKind = "preference" | "semantic" | "session_state" | "episodic";

export interface MemoryScoreBreakdown {
  semanticSimilarity: number;
  salience: number;
  recency: number;
  confidence: number;
  typeWeight: number;
  overlap: number;
  redundancyPenalty: number;
  finalScore: number;
}

export interface MemoryRecord {
  id: string;
  kind: MemoryKind;
  summary: string;
  content: string;
  topics: string[];
  entityKeys: string[];
  salience: number;
  fingerprint: string;
  createdAt: string;
  lastSeenAt: string;
  lastAccessedAt?: string;
  ttlDays?: number;
  decayRate: number;
  confidence?: number;
  importance?: number;
  active?: boolean;
  memoryGroup?: string;
  supersededAt?: string;
  supersededBy?: string;
  version?: number;
  retrievalReason?: string;
  scoreBreakdown?: MemoryScoreBreakdown;
  sourceSessionId: string;
  sourceTurnIds: string[];
  embedding?: number[];
  score?: number;
}

export interface SessionState {
  sessionId: string;
  currentTask?: string;
  constraints: string[];
  decisions: string[];
  openQuestions: string[];
  updatedAt: string;
}

export interface PromptLayer {
  name: string;
  priority: number;
  content: string;
  estimatedTokens: number;
  trimmed: boolean;
}

export interface PromptBuild {
  layers: PromptLayer[];
  totalEstimatedTokens: number;
  assembled: string;
}

export interface CompressionResult {
  summary: string;
  hierarchicalSummaries: string[];
  compressedTurns: ChatTurn[];
  keptRecentTurns: ChatTurn[];
  originalEstimatedTokens?: number;
  estimatedTokens: number;
  savedTokens?: number;
}

export interface CompactedToolResult {
  id?: string;
  sessionId?: string;
  runId?: string;
  toolName: string;
  toolCallId?: string;
  status?: "started" | "running" | "completed" | "failed";
  meta?: string;
  compacted: string;
  estimatedTokens: number;
  originalEstimatedTokens?: number;
  savedTokens?: number;
  durationMs?: number;
  createdAt?: string;
  rawPayload?: unknown;
  rawTrimmed?: boolean;
  error?: string;
}

export interface SessionSummary {
  sessionId: string;
  title: string;
  preview: string;
  turnCount: number;
  userTurns: number;
  assistantTurns: number;
  updatedAt: string;
  archivedAt?: string;
  lastRole?: ChatRole;
  provider?: string;
  model?: string;
}

export interface SessionInspection {
  summary: SessionSummary;
  state: SessionState;
  transcript: ChatTurn[];
  toolResults: CompactedToolResult[];
}

export interface DoctorCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface DoctorReport {
  generatedAt: string;
  dataDir: string;
  databasePath: string;
  openclawHome: string;
  checks: DoctorCheck[];
}

export interface TurnProfile {
  runId: string;
  sessionId: string;
  createdAt: string;
  promptTokens: number;
  promptBudget: number;
  memoryInjected: number;
  memoryCandidates: number;
  memoryWritten: number;
  toolTokens: number;
  toolTokensSaved: number;
  historySummaryTokens: number;
  compressionSavings: number;
  retrievalCount: number;
}

export interface StoredTurnProfile extends TurnProfile {
  details: Record<string, unknown>;
}

export interface ConfigValidationIssue {
  field: string;
  severity: "warn" | "error";
  message: string;
  repairHint?: string;
}

export interface ConfigValidationReport {
  valid: boolean;
  issues: ConfigValidationIssue[];
  precedence: string[];
}

export interface PluginRunContext {
  runId: string;
  sessionId: string;
  prompt: PromptBuild;
  state: SessionState;
  memories: MemoryRecord[];
  compression: CompressionResult;
  toolResults: CompactedToolResult[];
  memoryCandidates: number;
  memoryWriteCount: number;
  toolTokensSaved: number;
  provider: string;
  model: string;
  usage?: {
    input?: number;
    output?: number;
    total?: number;
  };
  lastUpdatedAt: string;
}
