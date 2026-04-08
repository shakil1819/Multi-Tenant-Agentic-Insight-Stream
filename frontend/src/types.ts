export type RagChunkUsed = {
  question: string;
  answer: string;
  pageNumber: string[];
  score?: number;
  distance?: number;
};

export type RagReferenceGroup = {
  kind: "rag_reference_group";
  fileIndex: number;
  fileId: string;
  pages: string[];
  labels: string[];
  chunksUsed: RagChunkUsed[];
};

export type ChartArtifact = {
  kind: "chartjs";
  chartId: string;
  summary: string;
  config: {
    type: string;
    data: Record<string, unknown>;
    options?: Record<string, unknown>;
  };
};

export type ResponseDataObject = RagReferenceGroup | ChartArtifact;

export type StreamPayload = {
  answer: string;
  data: ResponseDataObject[];
};

export type HealthResponse = {
  ok: boolean;
  weaviate: "ready" | "not_ready" | "unreachable";
};

export type ChatRequestPayload = {
  tenantId: string;
  query: string;
  fileIds?: string[];
};
