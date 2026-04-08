import { describe, it, expect } from "vitest";
import { normalizeRagHits } from "../../src/agents/rag/rag.normalize.js";

describe("normalizeRagHits", () => {
  it("extracts properties from Weaviate object shape", () => {
    const raw = [
      {
        properties: {
          fileId: "handbook",
          question: "Q1",
          answer: "A1",
          pageNumber: ["3", "5"],
        },
        metadata: { score: 0.95 },
      },
    ];

    const hits = normalizeRagHits(raw);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toEqual({
      fileId: "handbook",
      question: "Q1",
      answer: "A1",
      pageNumber: ["3", "5"],
      score: 0.95,
      distance: undefined,
      explainScore: undefined,
    });
  });

  it("handles missing properties gracefully", () => {
    const raw = [{ properties: {} }];
    const hits = normalizeRagHits(raw);
    expect(hits[0]!.fileId).toBe("");
    expect(hits[0]!.pageNumber).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(normalizeRagHits([])).toEqual([]);
  });
});
