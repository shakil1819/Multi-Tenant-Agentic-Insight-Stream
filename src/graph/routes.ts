import type { AppStateType } from "./state.js";

/**
 * Conditional edge function from the "route" node.
 * Returns a string (single next node) or string[] (parallel fan-out).
 *
 * LangGraph executes multiple returned nodes in parallel when an array is returned.
 */
export function routeAfterRouter(state: AppStateType): string | string[] {
  const route = state.route;

  if (!route) return "finalize";

  const { useRag, useChart, execution } = route;

  // Direct answer - no tools
  if (!useRag && !useChart) return "direct";

  // Single tool
  if (useRag && !useChart) return "rag";
  if (!useRag && useChart) return "chart";

  // Both tools needed
  if (execution === "parallel") {
    // Fan-out: LangGraph runs both in parallel, finalize waits for both
    return ["rag", "chart"];
  }

  // Sequential: rag first, chart after (handled by rag -> chart edge)
  return "rag";
}

/**
 * Conditional edge after the "rag" node.
 * If this was a sequential mixed request, go to chart next. Otherwise finalize.
 */
export function routeAfterRag(state: AppStateType): string {
  const route = state.route;
  if (route?.useChart && route.execution === "sequential") {
    return "chart";
  }
  return "finalize";
}
