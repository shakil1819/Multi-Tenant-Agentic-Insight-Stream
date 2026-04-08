import { getWeaviateClient } from "./client.js";
import { COLLECTION_NAME } from "./schema.js";

/**
 * Returns a tenant-scoped collection handle.
 * All reads/writes through this handle are isolated to the given tenant.
 */
export async function getTenantCollection(tenantId: string) {
  const client = await getWeaviateClient();
  const collection = client.collections.use(COLLECTION_NAME);
  return collection.withTenant(tenantId);
}
