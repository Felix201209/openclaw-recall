import { sentenceFromText } from "../shared/text.js";

export interface ImportTextChunk {
  summary: string;
  content: string;
  index: number;
  total: number;
}

interface ChunkConfig {
  maxChunkSize: number;
  overlapSize: number;
  minChunkSize: number;
  semanticSplit: boolean;
  maxLinesPerChunk: number;
}

const DEFAULT_CONFIG: ChunkConfig = {
  maxChunkSize: 2400,
  overlapSize: 120,
  minChunkSize: 180,
  semanticSplit: true,
  maxLinesPerChunk: 40,
};

const SENTENCE_ENDING = /[.!?。！？]/;

export function chunkImportedText(summary: string, content: string): ImportTextChunk[] {
  if (content.length <= DEFAULT_CONFIG.maxChunkSize) {
    return [{ summary, content, index: 0, total: 1 }];
  }

  const ranges = chunkDocument(content, DEFAULT_CONFIG);
  return ranges.map((range, index) => {
    const chunk = content.slice(range.startIndex, range.endIndex).trim();
    return {
      summary: `${sentenceFromText(summary, 96)} (part ${index + 1}/${ranges.length})`,
      content: chunk,
      index,
      total: ranges.length,
    };
  });
}

interface ChunkRange {
  startIndex: number;
  endIndex: number;
}

function chunkDocument(text: string, config: ChunkConfig): ChunkRange[] {
  const chunks: ChunkRange[] = [];
  let position = 0;

  while (position < text.length) {
    const remaining = text.length - position;
    if (remaining <= config.maxChunkSize) {
      chunks.push(trimmedRange(text, position, text.length));
      break;
    }

    const maxEnd = Math.min(position + config.maxChunkSize, text.length);
    const minEnd = Math.min(position + config.minChunkSize, maxEnd);
    const end = findSplitEnd(text, position, maxEnd, minEnd, config);
    chunks.push(trimmedRange(text, position, end));
    position = Math.max(end - config.overlapSize, position + 1);
  }

  return chunks.filter((chunk) => chunk.endIndex > chunk.startIndex);
}

function trimmedRange(text: string, start: number, end: number): ChunkRange {
  const raw = text.slice(start, end);
  const leading = raw.match(/^\s*/)?.[0]?.length ?? 0;
  const trailing = raw.match(/\s*$/)?.[0]?.length ?? 0;
  return {
    startIndex: start + leading,
    endIndex: Math.max(start + leading, end - trailing),
  };
}

function findSplitEnd(text: string, start: number, maxEnd: number, minEnd: number, config: ChunkConfig): number {
  if (config.maxLinesPerChunk > 0) {
    let breaks = 0;
    for (let index = start; index < maxEnd; index += 1) {
      if (text[index] === "\n") {
        breaks += 1;
        if (breaks >= config.maxLinesPerChunk) {
          return Math.max(index + 1, minEnd);
        }
      }
    }
  }

  if (config.semanticSplit) {
    for (let index = maxEnd - 1; index >= minEnd; index -= 1) {
      if (SENTENCE_ENDING.test(text[index])) {
        let next = index + 1;
        while (next < maxEnd && /\s/.test(text[next])) {
          next += 1;
        }
        return next;
      }
    }

    for (let index = maxEnd - 1; index >= minEnd; index -= 1) {
      if (text[index] === "\n") {
        return index + 1;
      }
    }
  }

  for (let index = maxEnd - 1; index >= minEnd; index -= 1) {
    if (/\s/.test(text[index])) {
      return index;
    }
  }

  return maxEnd;
}
