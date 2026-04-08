import type { FastifyInstance } from "fastify";
import { ensureLangSmithEnv, env } from "./config/env.js";
import { logger } from "./utils/logger.js";

// Must run before importing modules that may initialize LangChain tracing.
ensureLangSmithEnv();

let app: FastifyInstance | null = null;

async function bootstrap(): Promise<void> {
  const { createApp } = await import("./app.js");
  app = await createApp();

  await app.listen({
    host: "0.0.0.0",
    port: env.PORT,
  });

  logger.info("Server started", {
    port: env.PORT,
    env: env.NODE_ENV,
    model: env.OPENAI_MODEL,
    langsmith: env.LANGSMITH_TRACING === "true" ? "enabled" : "disabled",
    langsmithProject: env.LANGSMITH_PROJECT,
    docs: `http://localhost:${env.PORT}/docs`,
  });
}

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down`);

  if (app) {
    await app.close();
  }

  const { closeWeaviateClient } = await import("./infra/weaviate/client.js");
  await closeWeaviateClient();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

bootstrap().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  logger.error("Server startup failed", { error: msg });
  process.exit(1);
});
