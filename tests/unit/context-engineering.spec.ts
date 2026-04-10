import { describe, expect, it } from "vitest";
import { engineerContext } from "../../src/context/context-engineering.js";

describe("engineerContext", () => {
  it("returns query unchanged when no memory exists", () => {
    const result = engineerContext("What is our travel policy?", []);

    expect(result.queryForModel).toBe("What is our travel policy?");
    expect(result.memoryContext).toBe("");
    expect(result.selectedMemoryTurns).toBe(0);
  });

  it("injects recent memory turns under budget", () => {
    const memory = [
      {
        query: "How many remote days?",
        answer: "Up to three days.",
        timestamp: "2026-01-01T00:00:00.000Z",
      },
      {
        query: "What is reimbursement cap?",
        answer: "Items above 250 need approval.",
        timestamp: "2026-01-02T00:00:00.000Z",
      },
    ];

    const result = engineerContext("Summarize both answers.", memory);

    expect(result.memoryContext).toContain("Recent memory:");
    expect(result.memoryContext).toContain("How many remote days?");
    expect(result.memoryContext).toContain("What is reimbursement cap?");
    expect(result.selectedMemoryTurns).toBe(2);
    expect(result.estimatedTokens).toBeGreaterThan(0);
  });
});
