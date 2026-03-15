import { chunkArray, estimateTokens, sentenceFromText, uniqueStrings } from "../shared/text.js";
import { ChatTurn, CompressionResult, SessionState } from "../types/domain.js";

export class ContextCompressor {
  constructor(
    private readonly recentTurns: number,
    private readonly historySummaryThreshold: number,
  ) {}

  compress(turns: ChatTurn[], state: SessionState): CompressionResult {
    if (turns.length < this.historySummaryThreshold) {
      return {
        summary: "",
        hierarchicalSummaries: [],
        compressedTurns: [],
        keptRecentTurns: turns,
        originalEstimatedTokens: estimateTokens(turns.map((turn) => `${turn.role}: ${turn.text}`).join("\n")),
        estimatedTokens: 0,
        savedTokens: 0,
      };
    }
    const keepCount = Math.max(2, this.recentTurns);
    const cutIndex = Math.max(0, turns.length - keepCount);
    const compressedTurns = turns.slice(0, cutIndex);
    const keptRecentTurns = turns.slice(cutIndex);

    const hierarchicalSummaries = chunkArray(compressedTurns, 4)
      .map((chunk, index) => {
        const lines = chunk.map((turn) => `${turn.role}: ${sentenceFromText(turn.text, 96)}`);
        if (!lines.length) {
          return "";
        }
        return `Chunk ${index + 1}: ${uniqueStrings(lines).join(" | ")}`;
      })
      .filter(Boolean)
      .slice(-6);

    const resolved = uniqueStrings(
      compressedTurns
        .filter((turn) => /完成|fixed|done|decided|选择|采用|ship|implemented/i.test(turn.text))
        .map((turn) => sentenceFromText(turn.text, 100)),
    ).slice(-4);
    const entities = uniqueStrings(
      compressedTurns
        .flatMap((turn) => turn.text.match(/\b[A-Z][a-zA-Z0-9_-]{2,}\b/g) ?? [])
        .map((value) => value.toLowerCase()),
    ).slice(-8);

    const openItems = uniqueStrings(
      [
        ...state.openQuestions,
        ...compressedTurns
          .filter((turn) => turn.role === "user" && /[?？]/.test(turn.text))
          .map((turn) => sentenceFromText(turn.text, 90)),
      ].filter(Boolean),
    ).slice(-4);

    const sections: string[] = [];
    if (state.currentTask) sections.push(`Task: ${state.currentTask}`);
    if (state.decisions.length) sections.push(`Decisions: ${state.decisions.slice(-3).join(" | ")}`);
    if (state.constraints.length) sections.push(`Constraints: ${state.constraints.slice(-3).join(" | ")}`);
    if (resolved.length) sections.push(`Resolved: ${resolved.join(" | ")}`);
    if (openItems.length) sections.push(`Open: ${openItems.join(" | ")}`);
    if (entities.length) sections.push(`Entities: ${entities.join(" | ")}`);
    if (hierarchicalSummaries.length) sections.push(`Timeline: ${hierarchicalSummaries.join(" || ")}`);

    const summary = sections.join("\n");
    const originalEstimatedTokens = estimateTokens(
      compressedTurns.map((turn) => `${turn.role}: ${turn.text}`).join("\n"),
    );
    const summaryTokens = estimateTokens(summary);

    return {
      summary,
      hierarchicalSummaries,
      compressedTurns,
      keptRecentTurns,
      originalEstimatedTokens,
      estimatedTokens: summaryTokens,
      savedTokens: Math.max(0, originalEstimatedTokens - summaryTokens),
    };
  }
}
