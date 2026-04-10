import { ChatOpenAI } from "@langchain/openai";
import { traceable } from "langsmith/traceable";
import { getTenantCollection } from "../../infra/weaviate/repository.js";
import { normalizeRagHits } from "./rag.normalize.js";
import { groupReferences } from "./rag.references.js";
import { buildRagContext } from "./rag.context.js";
import { buildRagAnswerPrompt } from "../../prompts/rag-answer.prompt.js";
import { logger } from "../../utils/logger.js";
import type { RagResult } from "../../types/rag.types.js";

export class RagService {
  constructor(private readonly model: ChatOpenAI) {}

  /**
   * End-to-end RAG: query Weaviate → normalize → group refs → LLM answer.
   * Wrapped with @traceable so the entire flow appears in LangSmith.
   */
  answer = traceable(
    async (params: {
      tenantId: string;
      query: string;
      fileIds?: string[];
      memoryContext?: string;
    }): Promise<RagResult> => {
      const tenantCollection = await getTenantCollection(params.tenantId);

      let rawObjects: Array<Record<string, any>> = [];
      let usedFallbackFetch = false;

      // ── Try hybrid search first ──
      try {
        logger.debug("Attempting hybrid search", { query: params.query });
        const result = await tenantCollection.query.hybrid(params.query, {
          limit: 5,
          returnProperties: ["fileId", "question", "answer", "pageNumber"],
          returnMetadata: ["score", "explainScore"],
        });
        rawObjects = (result.objects ?? []) as Array<Record<string, any>>;
        logger.info("Hybrid search succeeded", { hitCount: rawObjects.length });
      } catch (err: unknown) {
        // ── Fallback to fetchObjects ──
        logger.warn("Hybrid search failed, falling back to fetchObjects", {
          error: err instanceof Error ? err.message : String(err),
        });
        usedFallbackFetch = true;

        try {
          const result = await tenantCollection.query.fetchObjects({
            limit: 25,
            returnProperties: ["fileId", "question", "answer", "pageNumber"],
          });
          rawObjects = (result.objects ?? []) as Array<Record<string, any>>;
          logger.info("fetchObjects fallback succeeded", { hitCount: rawObjects.length });
        } catch (fallbackErr: unknown) {
          logger.error("fetchObjects also failed", {
            error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
          });
          return {
            answer: "I was unable to retrieve data from the knowledge base.",
            hits: [],
            references: [],
            usedFallbackFetch: true,
          };
        }
      }

      // ── Normalize + group ──
      const hits = normalizeRagHits(rawObjects);
      const references = groupReferences(hits);

      if (hits.length === 0) {
        return {
          answer: "No relevant documents were found for your query.",
          hits: [],
          references: [],
          usedFallbackFetch,
        };
      }

      // ── Build context and ask LLM ──
      const context = buildRagContext(hits, references);
      const prompt = buildRagAnswerPrompt(params.query, context, params.memoryContext);

      const llmResponse = await this.model.invoke(prompt);
      const answerText =
        typeof llmResponse.content === "string"
          ? llmResponse.content
          : JSON.stringify(llmResponse.content);

      return {
        answer: answerText,
        hits,
        references,
        usedFallbackFetch,
      };
    },
    { name: "RagService.answer", run_type: "chain" },
  );
}
