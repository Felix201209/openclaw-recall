/**
 * Reciprocal Rank Fusion adapted from MemOS
 * Upstream: https://github.com/MemTensor/MemOS
 * License: MIT
 */

export interface RankedItem {
  id: string;
  score: number;
}

export function rrfFuse(lists: RankedItem[][], k: number = 60): Map<string, number> {
  const scores = new Map<string, number>();

  for (const list of lists) {
    for (let rank = 0; rank < list.length; rank += 1) {
      const item = list[rank];
      const previous = scores.get(item.id) ?? 0;
      scores.set(item.id, previous + 1 / (k + rank + 1));
    }
  }

  return scores;
}
