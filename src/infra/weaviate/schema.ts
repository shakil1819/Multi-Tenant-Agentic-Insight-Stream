import { env } from "../../config/env.js";

/** Centralized collection name */
export const COLLECTION_NAME = env.WEAVIATE_COLLECTION;

/**
 * Property definitions for the TenantQaChunk collection.
 * Kept here so create-schema script and retrieval code stay aligned.
 */
export const COLLECTION_PROPERTIES = [
  { name: "fileId", dataType: "text" as const, indexSearchable: false },
  { name: "question", dataType: "text" as const, indexSearchable: true },
  { name: "answer", dataType: "text" as const, indexSearchable: true },
  { name: "pageNumber", dataType: "text[]" as const, indexSearchable: false },
] as const;

/** Fields we return from every query */
export const RETURN_PROPERTIES = ["fileId", "question", "answer", "pageNumber"] as const;
