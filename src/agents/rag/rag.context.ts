import type { NormalizedRagHit, RagReferenceGroup } from "../../types/rag.types.js";

/**
 * Builds a text context block from hits and their reference groups,
 * suitable for injection into the RAG answer prompt.
 */
export function buildRagContext(
  hits: NormalizedRagHit[],
  references: RagReferenceGroup[],
): string {
  return hits
    .map((hit) => {
      const group = references.find((r) => r.fileId === hit.fileId)!;
      const labels = hit.pageNumber
        .map((page) => `${group.fileIndex}- Page ${page}`)
        .join(", ");

      return [
        `[File: ${hit.fileId} | Ref: ${labels}]`,
        `Q: ${hit.question}`,
        `A: ${hit.answer}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}
