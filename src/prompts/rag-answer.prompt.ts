export function buildRagAnswerPrompt(
  query: string,
  context: string,
  memoryContext?: string,
): string {
  const memoryBlock = memoryContext ? `${memoryContext}\n\n` : "";

  return `You are a helpful assistant that answers questions using ONLY the provided context.

RULES:
- Always cite references in the format "N- Page X" where N is the file index number.
- If the context does not contain enough information, say so honestly.
- Do not make up information not present in the context.

${memoryBlock}User question: ${query}

Context:
${context}`;
}
