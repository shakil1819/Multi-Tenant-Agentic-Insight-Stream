import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  // Weaviate
  WEAVIATE_URL: z.string().url(),
  WEAVIATE_GRPC_PORT: z.coerce.number().default(50051),
  WEAVIATE_COLLECTION: z.string().default("TenantQaChunk"),

  // LangSmith tracing
  LANGSMITH_TRACING: z.string().default("true"),
  LANGSMITH_API_KEY: z.string().default(""),
  LANGSMITH_PROJECT: z.string().default("agentic-rag-chartjs"),
  LANGSMITH_ENDPOINT: z.string().default("https://api.smith.langchain.com"),
});

export const env = EnvSchema.parse(process.env);

/**
 * LangSmith picks up tracing config from process.env automatically.
 * We just ensure these are set so @langchain/core's tracers activate.
 * Every LangChain/LangGraph call (LLM, tool, chain, graph node)
 * will be traced to the LangSmith dashboard when LANGSMITH_TRACING=true.
 */
export function ensureLangSmithEnv(): void {
  process.env["LANGSMITH_TRACING"] = env.LANGSMITH_TRACING;
  process.env["LANGCHAIN_TRACING_V2"] = env.LANGSMITH_TRACING; // legacy alias
  process.env["LANGSMITH_API_KEY"] = env.LANGSMITH_API_KEY;
  process.env["LANGCHAIN_API_KEY"] = env.LANGSMITH_API_KEY; // legacy alias
  process.env["LANGSMITH_PROJECT"] = env.LANGSMITH_PROJECT;
  process.env["LANGCHAIN_PROJECT"] = env.LANGSMITH_PROJECT; // legacy alias
  process.env["LANGSMITH_ENDPOINT"] = env.LANGSMITH_ENDPOINT;
  process.env["LANGCHAIN_ENDPOINT"] = env.LANGSMITH_ENDPOINT; // legacy alias
}
