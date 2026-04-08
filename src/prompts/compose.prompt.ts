export function buildComposePrompt(params: {
  query: string;
  ragAnswer?: string;
  chartSummary?: string;
}): string {
  const parts: string[] = [
    `You are a helpful assistant. Synthesize a final answer for the user.`,
    ``,
    `User question: ${params.query}`,
  ];

  if (params.ragAnswer) {
    parts.push(``, `RAG Answer (from documents):`, params.ragAnswer);
  }

  if (params.chartSummary) {
    parts.push(``, `Chart Tool Result:`, params.chartSummary);
  }

  parts.push(
    ``,
    `Combine the above into a single coherent answer. Preserve all file/page citations in "N- Page X" format.`,
  );

  return parts.join("\n");
}
