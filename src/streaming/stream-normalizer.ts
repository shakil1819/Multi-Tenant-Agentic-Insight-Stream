import type { ResponseDataObject, StreamPayload } from "../types/response.types.js";

/**
 * Maintains a cumulative snapshot of the streamed response.
 * Each LangGraph "updates" event is a partial state update from a single node.
 * We accumulate into a running snapshot and emit it.
 */
export class StreamNormalizer {
  private currentAnswer = "";
  private currentData: ResponseDataObject[] = [];

  /**
   * Process a single LangGraph update event.
   * Returns the current cumulative snapshot, or null if nothing changed.
   */
  processUpdate(event: Record<string, any>): StreamPayload | null {
    // LangGraph "updates" mode: event is { nodeName: partialState }
    const nodeStates = Object.values(event);
    let changed = false;

    for (const nodeState of nodeStates) {
      if (nodeState == null || typeof nodeState !== "object") continue;

      if (typeof nodeState.answer === "string" && nodeState.answer.length > 0) {
        this.currentAnswer = nodeState.answer;
        changed = true;
      }

      if (Array.isArray(nodeState.data) && nodeState.data.length > 0) {
        // The finalize node sends the final ordered data array.
        // Earlier nodes also push via the append-reducer.
        // We always take the latest data snapshot.
        this.currentData = nodeState.data;
        changed = true;
      }
    }

    if (!changed) return null;

    return {
      answer: this.currentAnswer,
      data: this.currentData,
    };
  }
}
