import type { FastifyReply, FastifyRequest } from "fastify";
import { ChatRequestSchema } from "../dto/chat.dto.js";
import { appGraph } from "../../graph/app.graph.js";
import { StreamNormalizer } from "../../streaming/stream-normalizer.js";
import { initSSE, writeSSE, writeSSEError } from "../../streaming/sse.js";
import { logger } from "../../utils/logger.js";

/**
 * POST /api/chat/stream
 *
 * Accepts { tenantId, query, fileIds? }
 * Returns SSE stream of { answer: string, data: object[] } snapshots.
 *
 * The entire graph execution is traced in LangSmith:
 * - The compiled StateGraph is auto-traced as a LangGraph run
 * - Each node (route, rag, chart, direct, finalize) is traced via @traceable
 * - All ChatOpenAI calls inside nodes are traced as LLM runs
 * - The chart tool invocation is traced as a tool run
 */
export async function streamChatHandler(
  req: FastifyRequest<{ Body: unknown }>,
  reply: FastifyReply,
): Promise<void> {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    reply.status(400).send({ error: parsed.error.flatten() });
    return;
  }

  const { tenantId, query } = parsed.data;
  logger.info("Chat stream request", { tenantId, query });

  reply.hijack();
  initSSE(reply.raw);

  const normalizer = new StreamNormalizer();

  try {
    const stream = await appGraph.stream(
      { tenantId, query },
      { streamMode: "updates" },
    );

    for await (const event of stream) {
      const snapshot = normalizer.processUpdate(event as Record<string, unknown>);
      if (snapshot) {
        writeSSE(reply.raw, snapshot);
      }
    }

    reply.raw.write("event: done\ndata: {}\n\n");
    reply.raw.end();
    logger.info("Chat stream completed", { tenantId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Chat stream error", { error: msg });
    writeSSEError(reply.raw, msg);
  }
}
