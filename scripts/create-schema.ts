import weaviate from "weaviate-client";

const WEAVIATE_URL = process.env["WEAVIATE_URL"] ?? "http://localhost:8080";
const WEAVIATE_GRPC_PORT = Number(process.env["WEAVIATE_GRPC_PORT"] ?? 50051);
const COLLECTION_NAME = process.env["WEAVIATE_COLLECTION"] ?? "TenantQaChunk";

async function createSchema(): Promise<void> {
  const url = new URL(WEAVIATE_URL);

  const client = await weaviate.connectToLocal({
    host: url.hostname,
    port: Number(url.port || 8080),
    grpcPort: WEAVIATE_GRPC_PORT,
  });

  try {
    const exists = await client.collections.exists(COLLECTION_NAME);
    if (exists) {
      console.log(`Collection "${COLLECTION_NAME}" already exists, skipping creation.`);
      return;
    }

    await client.collections.create({
      name: COLLECTION_NAME,
      multiTenancy: weaviate.configure.multiTenancy({
        enabled: true,
        autoTenantCreation: false,
        autoTenantActivation: true,
      }),
      // No vectorizer module — we use fetchObjects fallback.
      // If you add a vectorizer later, configure fileId to skip vectorization.
      properties: [
        {
          name: "fileId",
          dataType: weaviate.configure.dataType.TEXT,
          indexSearchable: false,
          indexFilterable: true,
        },
        {
          name: "question",
          dataType: weaviate.configure.dataType.TEXT,
          indexSearchable: true,
        },
        {
          name: "answer",
          dataType: weaviate.configure.dataType.TEXT,
          indexSearchable: true,
        },
        {
          name: "pageNumber",
          dataType: weaviate.configure.dataType.TEXT_ARRAY,
          indexSearchable: false,
        },
      ],
    });

    console.log(`Created collection: ${COLLECTION_NAME} (multi-tenancy enabled)`);
  } finally {
    client.close();
  }
}

createSchema().catch((err) => {
  console.error("Schema creation failed:", err);
  process.exit(1);
});
