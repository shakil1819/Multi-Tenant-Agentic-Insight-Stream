import type { MemoryTurn } from "../memory/chat-memory.store.js";

const CHARS_PER_TOKEN_ESTIMATE = 4;
const MAX_QUERY_TOKENS = 1200;
const MAX_MEMORY_TOKENS = 600;
const MAX_TOTAL_TOKENS = 1800;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

function trimToTokenBudget(text: string, tokenBudget: number): string {
  const maxChars = tokenBudget * CHARS_PER_TOKEN_ESTIMATE;
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}

export type EngineeredContext = {
  queryForModel: string;
  memoryContext: string;
  selectedMemoryTurns: number;
  estimatedTokens: number;
};

export function engineerContext(
  query: string,
  memoryTurns: MemoryTurn[],
): EngineeredContext {
  const queryForModel = trimToTokenBudget(query.trim(), MAX_QUERY_TOKENS);

  const selectedBlocks: string[] = [];
  let usedMemoryTokens = 0;

  for (const turn of [...memoryTurns].reverse()) {
    const block = `Q: ${turn.query}\nA: ${turn.answer}`;
    const blockTokens = estimateTokens(block);

    if (usedMemoryTokens + blockTokens > MAX_MEMORY_TOKENS) {
      break;
    }

    usedMemoryTokens += blockTokens;
    selectedBlocks.push(block);
  }

  selectedBlocks.reverse();

  let memoryContext =
    selectedBlocks.length > 0
      ? `Recent memory:\n${selectedBlocks.map((block, index) => `${index + 1}) ${block}`).join("\n\n")}`
      : "";

  const totalTokens = estimateTokens(queryForModel) + estimateTokens(memoryContext);

  if (totalTokens > MAX_TOTAL_TOKENS && memoryContext.length > 0) {
    memoryContext = trimToTokenBudget(
      memoryContext,
      Math.max(0, MAX_TOTAL_TOKENS - estimateTokens(queryForModel)),
    );
  }

  return {
    queryForModel,
    memoryContext,
    selectedMemoryTurns: selectedBlocks.length,
    estimatedTokens: estimateTokens(queryForModel) + estimateTokens(memoryContext),
  };
}
