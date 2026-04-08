import type { FastifyReply, FastifyRequest } from "fastify";
import { getWeaviateClient } from "../../infra/weaviate/client.js";

export async function healthHandler(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const client = await getWeaviateClient();
    const ready = await client.isReady();
    reply.send({ ok: true, weaviate: ready ? "ready" : "not_ready" });
  } catch {
    reply.send({ ok: true, weaviate: "unreachable" });
  }
}
