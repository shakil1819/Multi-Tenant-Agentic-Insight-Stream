import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import { env } from "./config/env.js";
import { healthHandler } from "./api/routes/health.route.js";
import { streamChatHandler } from "./api/routes/chat.stream.route.js";

const healthRouteSchema = {
  tags: ["System"],
  summary: "Service health check",
  response: {
    200: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        weaviate: { type: "string", enum: ["ready", "not_ready", "unreachable"] },
      },
      required: ["ok", "weaviate"],
    },
  },
} as const;

const chatStreamRouteSchema = {
  tags: ["Chat"],
  summary: "Stream agentic chat output over SSE",
  body: {
    type: "object",
    properties: {
      tenantId: { type: "string", minLength: 1 },
      query: { type: "string", minLength: 1 },
      fileIds: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["tenantId", "query"],
  },
  response: {
    200: {
      description: "Server-Sent Event stream with incremental agent output snapshots.",
      content: {
        "text/event-stream": {
          schema: {
            type: "string",
            example: 'data: {"answer":"partial response","data":[]}\n\n',
          },
        },
      },
    },
    400: {
      type: "object",
      properties: {
        error: { type: "object" },
      },
      required: ["error"],
    },
  },
} as const;

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: true,
  });

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Agentic RAG ChartJS API",
        version: "1.0.0",
        description: "Fastify backend for agentic RAG + Chart orchestration with SSE streaming.",
      },
      servers: [{ url: `http://localhost:${env.PORT}` }],
      tags: [
        { name: "System", description: "System level endpoints" },
        { name: "Chat", description: "Agentic chat endpoints" },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  });

  app.get("/health", { schema: healthRouteSchema }, healthHandler);
  app.post("/api/chat/stream", { schema: chatStreamRouteSchema }, streamChatHandler);

  return app;
}
