import type { ChatRequestPayload, StreamPayload } from "../types";

type StreamHandlers = {
  onSnapshot: (payload: StreamPayload) => void;
  onDone: () => void;
  onError: (message: string) => void;
};

type SseEvent = {
  event: string;
  data: string;
};

function trimApiBase(base: string): string {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function processSseChunk(
  buffer: string,
  onEvent: (event: SseEvent) => void,
): string {
  let cursor = 0;
  let eventName = "message";
  let dataLines: string[] = [];

  function dispatch(): void {
    if (dataLines.length === 0) {
      eventName = "message";
      return;
    }
    onEvent({ event: eventName, data: dataLines.join("\n") });
    eventName = "message";
    dataLines = [];
  }

  while (cursor < buffer.length) {
    const nextNewline = buffer.indexOf("\n", cursor);
    if (nextNewline === -1) {
      return buffer.slice(cursor);
    }

    const rawLine = buffer.slice(cursor, nextNewline);
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    cursor = nextNewline + 1;

    if (line === "") {
      dispatch();
      continue;
    }

    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return "";
}

export async function streamChat(
  apiBase: string,
  payload: ChatRequestPayload,
  signal: AbortSignal,
  handlers: StreamHandlers,
): Promise<void> {
  const response = await fetch(`${trimApiBase(apiBase)}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Request failed with ${response.status}: ${body || "empty body"}`);
  }

  if (!response.body) {
    throw new Error("Streaming body is not available in this browser.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = processSseChunk(buffer, ({ event, data }) => {
      if (event === "done") {
        handlers.onDone();
        return;
      }

      if (event === "error") {
        try {
          const parsed = JSON.parse(data) as { error?: string };
          handlers.onError(parsed.error ?? "Unknown stream error");
        } catch {
          handlers.onError(data || "Unknown stream error");
        }
        return;
      }

      try {
        handlers.onSnapshot(JSON.parse(data) as StreamPayload);
      } catch {
        handlers.onError("Received malformed stream payload.");
      }
    });
  }
}
