import weaviate from "weaviate-client";

const WEAVIATE_URL = process.env["WEAVIATE_URL"] ?? "http://localhost:8080";
const WEAVIATE_GRPC_PORT = Number(process.env["WEAVIATE_GRPC_PORT"] ?? 50051);
const COLLECTION_NAME = process.env["WEAVIATE_COLLECTION"] ?? "TenantQaChunk";
const TENANT_ID = "tenant-acme";

const SEED_DATA = [
  {
    fileId: "employee-handbook",
    question: "How many remote workdays are allowed each week?",
    answer:
      "Employees may work remotely up to three days per week with prior manager approval. The remaining two days must be spent in the office.",
    pageNumber: ["3"],
  },
  {
    fileId: "benefits-guide",
    question: "When does health insurance coverage begin for new hires?",
    answer:
      "Health insurance coverage begins on the first day of the month following the employee's start date. Dental and vision are included.",
    pageNumber: ["7"],
  },
  {
    fileId: "travel-policy",
    question: "What receipt threshold requires finance department approval?",
    answer:
      "Any single travel reimbursement item exceeding $250 USD requires prior finance department approval and an attached itemized receipt.",
    pageNumber: ["11", "12"],
  },
];

async function seed(): Promise<void> {
  const url = new URL(WEAVIATE_URL);

  const client = await weaviate.connectToLocal({
    host: url.hostname,
    port: Number(url.port || 8080),
    grpcPort: WEAVIATE_GRPC_PORT,
  });

  try {
    const collection = client.collections.use(COLLECTION_NAME);

    // Create tenant (ignore if already exists)
    try {
      await collection.tenants.create([{ name: TENANT_ID }]);
      console.log(`Created tenant: ${TENANT_ID}`);
    } catch {
      console.log(`Tenant "${TENANT_ID}" likely already exists, continuing.`);
    }

    const tenantCollection = collection.withTenant(TENANT_ID);

    // Check if data already seeded by trying a fetch
    const existing = await tenantCollection.query.fetchObjects({ limit: 1 });
    if (existing.objects && existing.objects.length > 0) {
      console.log("Data already seeded, skipping.");
      return;
    }

    // Insert seed data
    await tenantCollection.data.insertMany(SEED_DATA);
    console.log(`Seeded ${SEED_DATA.length} records into tenant "${TENANT_ID}".`);
  } finally {
    client.close();
  }
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
