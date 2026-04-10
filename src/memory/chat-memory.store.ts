import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";

export type MemoryTurn = {
  query: string;
  answer: string;
  timestamp: string;
};

const MAX_TURNS_PER_TENANT = 25;
const MAX_QUERY_CHARS = 600;
const MAX_ANSWER_CHARS = 1200;
const DEFAULT_MEMORY_DIR = path.resolve(process.cwd(), ".runtime", "memory");

function trimToLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function sanitizeTenantId(tenantId: string): string {
  return tenantId.replace(/[^A-Za-z0-9._:-]/g, "_");
}

function getMemoryFilePath(tenantId: string): string {
  return path.join(DEFAULT_MEMORY_DIR, `${sanitizeTenantId(tenantId)}.json`);
}

export async function loadTenantMemory(tenantId: string): Promise<MemoryTurn[]> {
  try {
    const filePath = getMemoryFilePath(tenantId);
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as MemoryTurn[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is MemoryTurn =>
        typeof item?.query === "string" &&
        typeof item?.answer === "string" &&
        typeof item?.timestamp === "string",
    );
  } catch {
    return [];
  }
}

export async function appendTenantMemory(
  tenantId: string,
  turn: MemoryTurn,
): Promise<void> {
  try {
    await mkdir(DEFAULT_MEMORY_DIR, { recursive: true });
    const existing = await loadTenantMemory(tenantId);
    existing.push({
      query: trimToLength(turn.query, MAX_QUERY_CHARS),
      answer: trimToLength(turn.answer, MAX_ANSWER_CHARS),
      timestamp: turn.timestamp,
    });

    const trimmed = existing.slice(-MAX_TURNS_PER_TENANT);
    const filePath = getMemoryFilePath(tenantId);
    await writeFile(filePath, JSON.stringify(trimmed, null, 2), "utf8");
  } catch (err) {
    logger.warn("Failed to persist tenant memory", {
      tenantId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
