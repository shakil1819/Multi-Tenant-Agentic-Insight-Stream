import weaviate, { type WeaviateClient } from "weaviate-client";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

let clientInstance: WeaviateClient | null = null;

export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (clientInstance) return clientInstance;

  const url = new URL(env.WEAVIATE_URL);
  const host = url.hostname;
  const port = Number(url.port || 8080);

  logger.info("Connecting to Weaviate", { host, port, grpcPort: env.WEAVIATE_GRPC_PORT });

  clientInstance = await weaviate.connectToLocal({
    host,
    port,
    grpcPort: env.WEAVIATE_GRPC_PORT,
  });

  return clientInstance;
}

export async function closeWeaviateClient(): Promise<void> {
  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
    logger.info("Weaviate client closed");
  }
}
