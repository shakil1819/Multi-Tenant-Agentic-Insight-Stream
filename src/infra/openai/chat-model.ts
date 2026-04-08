import { ChatOpenAI } from "@langchain/openai";
import { env } from "../../config/env.js";

/**
 * Shared ChatOpenAI instance.
 *
 * LangSmith tracing is automatic: when LANGSMITH_TRACING=true and
 * LANGSMITH_API_KEY is set in process.env, every .invoke() / .stream()
 * call is traced and appears in the LangSmith dashboard under the
 * configured project name.
 */
export const chatModel = new ChatOpenAI({
  apiKey: env.OPENAI_API_KEY,
  model: env.OPENAI_MODEL,
  temperature: 0,
});
