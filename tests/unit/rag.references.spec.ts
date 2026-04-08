import { describe, it, expect } from "vitest";
import { groupReferences } from "../../src/agents/rag/rag.references.js";
import type { NormalizedRagHit } from "../../src/types/rag.types.js";

describe("groupReferences", () => {
  it("groups by fileId in first-appearance order", () => {
    const hits: NormalizedRagHit[] = [
      { fileId: "handbook", question: "Q1", answer: "A1", pageNumber: ["3"] },
      { fileId: "handbook", question: "Q2", answer: "A2", pageNumber: ["5"] },
      { fileId: "travel", question: "Q3", answer: "A3", pageNumber: ["11"] },
    ];

    const refs = groupReferences(hits);

    expect(refs).toHaveLength(2);
    expect(refs[0]!.fileId).toBe("handbook");
    expect(refs[0]!.fileIndex).toBe(1);
    expect(refs[0]!.pages).toEqual(["3", "5"]);
    expect(refs[0]!.labels).toEqual(["1- Page 3", "1- Page 5"]);
    expect(refs[0]!.chunksUsed).toHaveLength(2);

    expect(refs[1]!.fileId).toBe("travel");
    expect(refs[1]!.fileIndex).toBe(2);
    expect(refs[1]!.pages).toEqual(["11"]);
    expect(refs[1]!.labels).toEqual(["2- Page 11"]);
  });

  it("deduplicates pages within a group", () => {
    const hits: NormalizedRagHit[] = [
      { fileId: "doc", question: "Q1", answer: "A1", pageNumber: ["3", "5"] },
      { fileId: "doc", question: "Q2", answer: "A2", pageNumber: ["3", "7"] },
    ];

    const refs = groupReferences(hits);

    expect(refs).toHaveLength(1);
    expect(refs[0]!.pages).toEqual(["3", "5", "7"]);
    expect(refs[0]!.labels).toEqual(["1- Page 3", "1- Page 5", "1- Page 7"]);
  });

  it("sorts pages numerically", () => {
    const hits: NormalizedRagHit[] = [
      { fileId: "doc", question: "Q1", answer: "A1", pageNumber: ["12"] },
      { fileId: "doc", question: "Q2", answer: "A2", pageNumber: ["3"] },
      { fileId: "doc", question: "Q3", answer: "A3", pageNumber: ["7"] },
    ];

    const refs = groupReferences(hits);
    expect(refs[0]!.pages).toEqual(["3", "7", "12"]);
  });

  it("returns empty array for empty hits", () => {
    expect(groupReferences([])).toEqual([]);
  });
});
