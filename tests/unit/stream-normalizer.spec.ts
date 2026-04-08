import { describe, it, expect } from "vitest";
import { StreamNormalizer } from "../../src/streaming/stream-normalizer.js";

describe("StreamNormalizer", () => {
  it("returns null when event has no answer or data", () => {
    const normalizer = new StreamNormalizer();
    const result = normalizer.processUpdate({ route: { route: {} } });
    expect(result).toBeNull();
  });

  it("accumulates answer across updates", () => {
    const normalizer = new StreamNormalizer();

    const snap1 = normalizer.processUpdate({ rag: { answer: "partial" } });
    expect(snap1).toEqual({ answer: "partial", data: [] });

    const snap2 = normalizer.processUpdate({ finalize: { answer: "final answer" } });
    expect(snap2).toEqual({ answer: "final answer", data: [] });
  });

  it("captures data arrays", () => {
    const normalizer = new StreamNormalizer();

    const ref = { kind: "rag_reference_group", fileIndex: 1, fileId: "f1", pages: ["3"], labels: ["1- Page 3"], chunksUsed: [] };
    const snap = normalizer.processUpdate({ finalize: { answer: "ans", data: [ref] } });

    expect(snap?.data).toHaveLength(1);
    expect(snap?.data[0]).toEqual(ref);
  });

  it("always returns { answer, data } shape", () => {
    const normalizer = new StreamNormalizer();
    const snap = normalizer.processUpdate({ direct: { answer: "hello" } });
    expect(snap).toHaveProperty("answer");
    expect(snap).toHaveProperty("data");
    expect(Array.isArray(snap?.data)).toBe(true);
  });
});
