import type { RagReferenceGroup } from "./rag.types.js";
import type { ChartArtifact } from "./chart.types.js";

/** Discriminated union for every object in the `data` array */
export type ResponseDataObject = RagReferenceGroup | ChartArtifact;

/** The shape of every SSE chunk sent to the client */
export type StreamPayload = {
  answer: string;
  data: ResponseDataObject[];
};

/** Route decision made by the router node */
export type RouteDecision = {
  useRag: boolean;
  useChart: boolean;
  execution: "direct" | "parallel" | "sequential";
  reason: string;
};
