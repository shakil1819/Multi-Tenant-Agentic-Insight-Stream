import type { NormalizedRagHit, RagReferenceGroup } from "../../types/rag.types.js";

/**
 * Groups hits by fileId in first-appearance order.
 *
 * - fileIndex is 1-based, assigned by order of first appearance
 * - Pages are deduped and sorted numerically within each group
 * - Labels follow the "N- Page X" format required by the spec
 */
export function groupReferences(hits: NormalizedRagHit[]): RagReferenceGroup[] {
  const order: string[] = [];
  const grouped = new Map<string, RagReferenceGroup>();

  for (const hit of hits) {
    if (!grouped.has(hit.fileId)) {
      order.push(hit.fileId);
      const fileIndex = order.length;
      grouped.set(hit.fileId, {
        kind: "rag_reference_group",
        fileIndex,
        fileId: hit.fileId,
        pages: [],
        labels: [],
        chunksUsed: [],
      });
    }

    const group = grouped.get(hit.fileId)!;

    group.chunksUsed.push({
      question: hit.question,
      answer: hit.answer,
      pageNumber: hit.pageNumber,
      score: hit.score,
      distance: hit.distance,
    });

    for (const page of hit.pageNumber) {
      if (!group.pages.includes(page)) {
        group.pages.push(page);
      }
    }
  }

  // Sort pages numerically within each group, then build labels
  for (const group of grouped.values()) {
    group.pages.sort((a, b) => Number(a) - Number(b));
    group.labels = group.pages.map((page) => `${group.fileIndex}- Page ${page}`);
  }

  return order.map((fileId) => grouped.get(fileId)!);
}
