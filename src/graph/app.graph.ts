import { END, START, StateGraph } from "@langchain/langgraph";
import { routeNode } from "./nodes/route.node.js";
import { directNode } from "./nodes/direct.node.js";
import { ragNode } from "./nodes/rag.node.js";
import { chartNode } from "./nodes/chart.node.js";
import { finalizeNode } from "./nodes/finalize.node.js";
import { routeAfterRouter, routeAfterRag } from "./routes.js";
import { AppState } from "./state.js";

/**
 * Builds the LangGraph StateGraph.
 *
 * Graph topology:
 *
 *   START -> router ----+-- direct -------------- finalize -> END
 *                       +-- rag ----+-- finalize -> END      (rag only)
 *                       |           +-- chart -> finalize -> END (sequential: rag then chart)
 *                       +-- chart --+-- finalize -> END      (chart only)
 *                       +-- [rag, chart] ---- finalize -> END (parallel fan-out)
 */
function buildGraph() {
  const builder = new StateGraph(AppState)
    .addNode("router", routeNode)
    .addNode("direct", directNode)
    .addNode("rag", ragNode)
    .addNode("chart", chartNode)
    .addNode("finalize", finalizeNode)
    .addEdge(START, "router")
    .addConditionalEdges("router", routeAfterRouter, {
      direct: "direct",
      rag: "rag",
      chart: "chart",
      finalize: "finalize",
    })
    .addEdge("direct", "finalize")
    .addConditionalEdges("rag", routeAfterRag, {
      chart: "chart",
      finalize: "finalize",
    })
    .addEdge("chart", "finalize")
    .addEdge("finalize", END);

  return builder.compile();
}

/**
 * The compiled application graph.
 * Invoke with: appGraph.stream({ tenantId, query }, { streamMode: "updates" })
 */
export const appGraph = buildGraph();
