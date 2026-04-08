import { chatModel } from "../../infra/openai/chat-model.js";
import { ROUTER_SYSTEM_PROMPT } from "../../prompts/router.prompt.js";
import { logger } from "../../utils/logger.js";
import type { RouteDecision } from "../../types/response.types.js";
import type { AppStateType } from "../state.js";

const RAG_KEYWORDS = [
  "document", "file", "database", "knowledge base", "lookup",
  "find", "search", "retrieve", "what does", "according to",
  "from the", "policy", "handbook", "guide",
];

const CHART_KEYWORDS = [
  "chart", "graph", "plot", "visualization", "bar chart",
  "line chart", "pie chart", "visualize", "diagram",
];

function heuristicRoute(query: string): RouteDecision | null {
  const lower = query.toLowerCase();
  const wantsRag = RAG_KEYWORDS.some((kw) => lower.includes(kw));
  const wantsChart = CHART_KEYWORDS.some((kw) => lower.includes(kw));

  if (wantsRag && wantsChart) {
    const ragIdx = RAG_KEYWORDS.reduce((min, kw) => {
      const idx = lower.indexOf(kw);
      return idx >= 0 && idx < min ? idx : min;
    }, Infinity);
    const chartIdx = CHART_KEYWORDS.reduce((min, kw) => {
      const idx = lower.indexOf(kw);
      return idx >= 0 && idx < min ? idx : min;
    }, Infinity);

    const execution = chartIdx > ragIdx ? "sequential" : "parallel";
    return { useRag: true, useChart: true, execution, reason: "heuristic: both keywords detected" };
  }
  if (wantsRag) return { useRag: true, useChart: false, execution: "direct", reason: "heuristic: rag keywords" };
  if (wantsChart) return { useRag: false, useChart: true, execution: "direct", reason: "heuristic: chart keywords" };

  return null;
}

/**
 * Route node. Tries fast heuristics first, falls back to LLM structured output.
 * LangGraph auto-traces this node in LangSmith. The inner chatModel.invoke()
 * call is also traced as a child LLM span.
 */
export async function routeNode(state: AppStateType): Promise<Partial<AppStateType>> {
  const { query } = state;

  const heuristic = heuristicRoute(query);
  if (heuristic) {
    logger.info("Route decided by heuristic", { route: heuristic });
    return { route: heuristic };
  }

  logger.info("Route falling back to LLM");
  try {
    const response = await chatModel.invoke([
      { role: "system", content: ROUTER_SYSTEM_PROMPT },
      { role: "user", content: query },
    ]);

    const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    const cleaned = text.replace(/```json\s*|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as RouteDecision;

    logger.info("Route decided by LLM", { route: parsed });
    return { route: parsed };
  } catch (err) {
    logger.warn("LLM routing failed, defaulting to direct", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      route: { useRag: false, useChart: false, execution: "direct", reason: "LLM routing failed, default direct" },
    };
  }
}
