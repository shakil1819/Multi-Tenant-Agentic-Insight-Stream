import { describe, it, expect } from "vitest";
import { routeAfterRouter, routeAfterRag } from "../../src/graph/routes.js";
import type { AppStateType } from "../../src/graph/state.js";

function makeState(overrides: Partial<AppStateType>): AppStateType {
  return {
    tenantId: "t1",
    query: "test",
    memoryContext: "",
    route: null,
    ragResult: null,
    chartResult: null,
    answer: "",
    data: [],
    errors: [],
    ...overrides,
  } as AppStateType;
}

describe("routeAfterRouter", () => {
  it("returns 'finalize' when route is null", () => {
    expect(routeAfterRouter(makeState({}))).toBe("finalize");
  });

  it("returns 'direct' for direct execution", () => {
    const state = makeState({
      route: { useRag: false, useChart: false, execution: "direct", reason: "test" },
    });
    expect(routeAfterRouter(state)).toBe("direct");
  });

  it("returns 'rag' for rag-only", () => {
    const state = makeState({
      route: { useRag: true, useChart: false, execution: "direct", reason: "test" },
    });
    expect(routeAfterRouter(state)).toBe("rag");
  });

  it("returns 'chart' for chart-only", () => {
    const state = makeState({
      route: { useRag: false, useChart: true, execution: "direct", reason: "test" },
    });
    expect(routeAfterRouter(state)).toBe("chart");
  });

  it("returns ['rag', 'chart'] for parallel mixed", () => {
    const state = makeState({
      route: { useRag: true, useChart: true, execution: "parallel", reason: "test" },
    });
    expect(routeAfterRouter(state)).toEqual(["rag", "chart"]);
  });

  it("returns 'rag' for sequential mixed (rag goes first)", () => {
    const state = makeState({
      route: { useRag: true, useChart: true, execution: "sequential", reason: "test" },
    });
    expect(routeAfterRouter(state)).toBe("rag");
  });
});

describe("routeAfterRag", () => {
  it("returns 'finalize' when chart not needed", () => {
    const state = makeState({
      route: { useRag: true, useChart: false, execution: "direct", reason: "test" },
    });
    expect(routeAfterRag(state)).toBe("finalize");
  });

  it("returns 'chart' for sequential mixed", () => {
    const state = makeState({
      route: { useRag: true, useChart: true, execution: "sequential", reason: "test" },
    });
    expect(routeAfterRag(state)).toBe("chart");
  });

  it("returns 'finalize' for parallel mixed (chart runs independently)", () => {
    const state = makeState({
      route: { useRag: true, useChart: true, execution: "parallel", reason: "test" },
    });
    expect(routeAfterRag(state)).toBe("finalize");
  });
});
