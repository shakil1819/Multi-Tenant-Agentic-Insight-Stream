import type { ServerResponse } from "node:http";
import type { StreamPayload } from "../types/response.types.js";

/** Set SSE headers on a Node.js response stream */
export function initSSE(res: ServerResponse): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // nginx
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
}

/** Write a single SSE data frame */
export function writeSSE(res: ServerResponse, payload: StreamPayload): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/** Write an SSE error event and end the stream */
export function writeSSEError(res: ServerResponse, message: string): void {
  res.write(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`);
  res.end();
}
