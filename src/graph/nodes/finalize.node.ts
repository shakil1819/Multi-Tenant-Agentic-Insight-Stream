import { chatModel } from "../../infra/openai/chat-model.js";
import { buildComposePrompt } from "../../prompts/compose.prompt.js";
import { logger } from "../../utils/logger.js";
import type { AppStateType } from "../state.js";
import type { ResponseDataObject } from "../../types/response.types.js";

/**
 * Finalize node:
 * 1. Enforces data ordering: RAG reference groups first, chart artifacts second.
 * 2. If both RAG and chart were used, composes a unified answer via LLM.
 * 3. Writes the final `answer` and `data` to state.
 *
 * LangGraph auto-traces this node. The optional chatModel.invoke() is a child LLM span.
 */
export async function finalizeNode(state: AppStateType): Promise<Partial<AppStateType>> {
  // ── Enforce ordering: rag refs first, charts second ──
  const ragRefs: ResponseDataObject[] = [];
  const chartArtifacts: ResponseDataObject[] = [];

  for (const obj of state.data) {
    if (obj.kind === "rag_reference_group") {
      ragRefs.push(obj);
    } else if (obj.kind === "chartjs") {
      chartArtifacts.push(obj);
    }
  }

  const orderedData: ResponseDataObject[] = [...ragRefs, ...chartArtifacts];

  // ── Compose answer if mixed tools were used ──
  const usedRag = state.ragResult !== null;
  const usedChart = state.chartResult !== null;
  let finalAnswer = state.answer;

  if (usedRag && usedChart) {
    logger.info("Composing mixed answer from RAG + chart");
    try {
      const prompt = buildComposePrompt({
        query: state.query,
        ragAnswer: state.ragResult?.answer,
        chartSummary: state.chartResult?.summary,
      });

      const response = await chatModel.invoke(prompt);
      finalAnswer =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
    } catch (err) {
      logger.warn("Compose failed, using RAG answer as-is", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ── Append error notes if any ──
  if (state.errors.length > 0) {
    finalAnswer += `\n\n[Note: Some operations encountered errors: ${state.errors.join("; ")}]`;
  }

  logger.info("Finalize complete", {
    ragRefCount: ragRefs.length,
    chartCount: chartArtifacts.length,
    hasErrors: state.errors.length > 0,
  });

  return {
    answer: finalAnswer,
    data: orderedData,
  };
}
