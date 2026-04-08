import { chatModel } from "../../infra/openai/chat-model.js";
import { DIRECT_ANSWER_SYSTEM_PROMPT } from "../../prompts/direct.prompt.js";
import type { AppStateType } from "../state.js";

/**
 * Answers the user directly without RAG or chart tools.
 * LangGraph auto-traces this node. The chatModel.invoke() is a child LLM span.
 */
export async function directNode(state: AppStateType): Promise<Partial<AppStateType>> {
  const response = await chatModel.invoke([
    { role: "system", content: DIRECT_ANSWER_SYSTEM_PROMPT },
    { role: "user", content: state.query },
  ]);

  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return { answer };
}
