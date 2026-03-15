import { estimateTokens, truncateToTokens } from "../shared/text.js";
import { PromptLayer } from "../types/domain.js";

type LayerInput = {
  name: string;
  content: string;
  priority: number;
  targetRatio: number;
  minTokens?: number;
  neverTrim?: boolean;
};

export class BudgetManager {
  fit(totalBudget: number, inputs: LayerInput[]): PromptLayer[] {
    const layers = inputs.map((input) => {
      const targetTokens = Math.max(input.minTokens ?? 24, Math.floor(totalBudget * input.targetRatio));
      const truncated = truncateToTokens(input.content, targetTokens);
      return {
        name: input.name,
        priority: input.priority,
        content: truncated.text,
        estimatedTokens: estimateTokens(truncated.text),
        trimmed: truncated.trimmed,
      };
    });

    let total = layers.reduce((sum, layer) => sum + layer.estimatedTokens, 0);
    if (total <= totalBudget) return layers;

    const trimOrder = [...layers]
      .map((layer) => ({
        layer,
        input: inputs.find((input) => input.name === layer.name),
      }))
      .filter((entry) => !entry.input?.neverTrim)
      .sort((a, b) => a.layer.priority - b.layer.priority);

    for (const entry of trimOrder) {
      if (total <= totalBudget) break;
      const layer = entry.layer;
      const source = entry.input;
      const overBy = total - totalBudget;
      const nextBudget = Math.max(source?.minTokens ?? 16, layer.estimatedTokens - overBy);
      const truncated = truncateToTokens(layer.content, nextBudget);
      const nextEstimate = estimateTokens(truncated.text);
      total -= layer.estimatedTokens - nextEstimate;
      layer.content = truncated.text;
      layer.trimmed = true;
      layer.estimatedTokens = nextEstimate;
    }

    return layers;
  }
}
