/** A single normalized hit from Weaviate */
export type NormalizedRagHit = {
  fileId: string;
  question: string;
  answer: string;
  pageNumber: string[];
  score?: number;
  distance?: number;
  explainScore?: string;
};

/** A group of references sharing the same fileId */
export type RagReferenceGroup = {
  kind: "rag_reference_group";
  fileIndex: number; // 1-based, first-appearance order
  fileId: string;
  pages: string[];
  labels: string[]; // e.g. ["1- Page 3", "1- Page 5"]
  chunksUsed: Array<{
    question: string;
    answer: string;
    pageNumber: string[];
    score?: number;
    distance?: number;
  }>;
};

/** Full result returned by the RAG service */
export type RagResult = {
  answer: string;
  hits: NormalizedRagHit[];
  references: RagReferenceGroup[];
  usedFallbackFetch: boolean;
};
