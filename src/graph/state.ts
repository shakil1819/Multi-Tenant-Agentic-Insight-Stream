import { Annotation } from "@langchain/langgraph";
import type { ResponseDataObject, RouteDecision } from "../types/response.types.js";
import type { RagResult } from "../types/rag.types.js";
import type { ChartArtifact } from "../types/chart.types.js";

/**
 * Typed LangGraph state.
 *
 * - `data` uses an append-reducer so rag and chart nodes can independently push objects.
 * - `errors` also accumulates across nodes.
 * - Scalar fields use last-write-wins reducers.
 */
export const AppState = Annotation.Root({
  // ── Input ──
  tenantId: Annotation<string>({
    reducer: (_, right) => right,
    default: () => "",
  }),
  query: Annotation<string>({
    reducer: (_, right) => right,
    default: () => "",
  }),

  // ── Routing ──
  route: Annotation<RouteDecision | null>({
    reducer: (_, right) => right,
    default: () => null,
  }),

  // ── Intermediate results ──
  ragResult: Annotation<RagResult | null>({
    reducer: (_, right) => right,
    default: () => null,
  }),
  chartResult: Annotation<ChartArtifact | null>({
    reducer: (_, right) => right,
    default: () => null,
  }),

  // ── Final output ──
  answer: Annotation<string>({
    reducer: (_, right) => right,
    default: () => "",
  }),
  data: Annotation<ResponseDataObject[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  errors: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
});

export type AppStateType = typeof AppState.State;
