import { chatModel } from "../../infra/openai/chat-model.js";
import { DIRECT_ANSWER_SYSTEM_PROMPT } from "../../prompts/direct.prompt.js";
import type { AppStateType } from "../state.js";

/**
 * Answers the user directly without RAG or chart tools.
 * LangGraph auto-traces this node. The chatModel.invoke() is a child LLM span.
 */
export async function directNode(state: AppStateType): Promise<Partial<AppStateType>> {
  const userPrompt = state.memoryContext
    ? `${state.memoryContext}\n\nCurrent user question:\n${state.query}`
    : state.query;

  const response = await chatModel.invoke([
    { role: "system", content: DIRECT_ANSWER_SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return { answer };
}
