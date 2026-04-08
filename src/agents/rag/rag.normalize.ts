import type { NormalizedRagHit } from "../../types/rag.types.js";

/**
 * Converts raw Weaviate result objects into stable typed hits.
 * Defensive: handles missing/malformed properties gracefully.
 */
export function normalizeRagHits(
  rawObjects: Array<Record<string, any>>,
): NormalizedRagHit[] {
  return rawObjects.map((obj) => {
    const props = obj.properties ?? obj;
    return {
      fileId: String(props.fileId ?? ""),
      question: String(props.question ?? ""),
      answer: String(props.answer ?? ""),
      pageNumber: Array.isArray(props.pageNumber) ? props.pageNumber.map(String) : [],
      score: obj.metadata?.score ?? undefined,
      distance: obj.metadata?.distance ?? undefined,
      explainScore: obj.metadata?.explainScore ?? undefined,
    };
  });
}
