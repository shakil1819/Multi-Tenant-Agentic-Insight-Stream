import { RagService } from "../../agents/rag/rag.service.js";
import { chatModel } from "../../infra/openai/chat-model.js";
import { logger } from "../../utils/logger.js";
import type { AppStateType } from "../state.js";
import type { ResponseDataObject } from "../../types/response.types.js";

const ragService = new RagService(chatModel);

/**
 * RAG node: queries Weaviate, synthesizes answer, pushes reference groups.
 * LangGraph auto-traces this node. RagService.answer has its own @traceable span.
 */
export async function ragNode(state: AppStateType): Promise<Partial<AppStateType>> {
  try {
    const result = await ragService.answer({
      tenantId: state.tenantId,
      query: state.query,
    });

    logger.info("RAG completed", {
      hitCount: result.hits.length,
      refGroupCount: result.references.length,
      usedFallback: result.usedFallbackFetch,
    });

    const dataObjects: ResponseDataObject[] = result.references;

    return {
      ragResult: result,
      answer: result.answer,
      data: dataObjects,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("RAG node failed", { error: msg });
    return {
      answer: "I encountered an error retrieving data from the knowledge base.",
      errors: [`rag_node: ${msg}`],
    };
  }
}
