/**
 * Polls Weaviate's readiness endpoint until it responds or timeout is reached.
 * Used before schema creation and seeding.
 */

const WEAVIATE_URL = process.env["WEAVIATE_URL"] ?? "http://localhost:8080";
const MAX_RETRIES = 30;
const INTERVAL_MS = 2000;

async function waitForWeaviate(): Promise<void> {
  const url = `${WEAVIATE_URL}/v1/.well-known/ready`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`Weaviate ready after ${attempt} attempt(s)`);
        return;
      }
    } catch {
      // not ready yet
    }

    console.log(`Waiting for Weaviate... attempt ${attempt}/${MAX_RETRIES}`);
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }

  throw new Error(`Weaviate not ready after ${MAX_RETRIES * INTERVAL_MS / 1000}s`);
}

waitForWeaviate().catch((err) => {
  console.error(err);
  process.exit(1);
});
