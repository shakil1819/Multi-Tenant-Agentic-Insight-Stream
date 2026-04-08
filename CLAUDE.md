# CLAUDE.md

## Persona

You are a senior software engineer with 15 years at Google, ACM ICPC global championship level problem-solving ability. You build production systems that are simple, typed, deployable, and correct. You do not sugarcoat, over-complicate, over-engineer, or bluff. If something is wrong, you say so. If you don't know, you say so. You maintain standard industry practices. You treat this codebase as if your job depends on it.

## Project

**agentic-rag-chartjs** — A LangGraph-orchestrated agent hierarchy with Weaviate vector DB (multi-tenancy), RAG retrieval, and mock Chart.js tool generation. Single Node.js TypeScript service. Full LangSmith tracing.

## Tech Stack

- **Runtime:** Node.js 20+, TypeScript strict, ESM/NodeNext
- **LLM:** OpenAI via `@langchain/openai` (`gpt-4o-mini` default)
- **Orchestration:** `@langchain/langgraph` StateGraph
- **Retrieval:** Weaviate JS/TS client v3, multi-tenant collection `TenantQaChunk`
- **Transport:** Express + SSE streaming
- **Tracing:** LangSmith (auto via env vars + `traceable` on RagService)
- **Testing:** Vitest
- **Containerization:** Docker Compose (Weaviate + app)

## Architecture

```
POST /api/chat/stream { tenantId, query }
  → Route Node (heuristics first, LLM fallback)
    ├── Direct Node → LLM answer, data=[]
    ├── RAG Node → Weaviate hybrid/fetchObjects → grounded answer + file refs
    ├── Chart Node → mock Chart.js config artifact
    └── [RAG, Chart] parallel (array return) or sequential (rag→chart chain)
  → Finalize Node → enforces ordering (RAG refs first, charts second) → SSE stream
```

## File Structure

```
scripts/                    # DB lifecycle (wait, schema, seed)
src/config/env.ts           # Zod-validated env, LangSmith env setup
src/api/routes/             # Express routes (health, chat SSE stream)
src/api/dto/                # Request validation schemas
src/types/                  # Shared types: rag, chart, response (discriminated union)
src/prompts/                # All LLM prompts centralized (router, direct, rag-answer, compose)
src/infra/openai/           # ChatOpenAI singleton
src/infra/weaviate/         # Client singleton, schema constants, tenant repository
src/tools/chart/            # Mock Chart.js tool (LangChain DynamicStructuredTool)
src/agents/rag/             # RAG service, normalizer, reference grouper, context builder
src/graph/state.ts          # LangGraph Annotation with typed reducers
src/graph/routes.ts         # Pure conditional edge functions (routeAfterRouter, routeAfterRag)
src/graph/nodes/            # route, direct, rag, chart, finalize
src/graph/app.graph.ts      # Compiled StateGraph
src/streaming/              # SSE helpers, StreamNormalizer (cumulative snapshots)
src/utils/logger.ts         # Structured JSON logger
tests/unit/                 # 20 tests: references, routing, normalizer, normalize
```

## Key Design Decisions

- **Data ordering is non-negotiable:** `data[]` always has RAG reference groups before chart artifacts. File index `1` = first fileId in the result set by first-appearance order. Labels follow `"N- Page X"` format.
- **Parallel fan-out:** `routeAfterRouter` returns `["rag", "chart"]` as a string array. LangGraph runs both concurrently. The `data` field uses an append-reducer to accumulate from both nodes.
- **Sequential mixed:** `routeAfterRouter` returns `"rag"`, then `routeAfterRag` conditionally routes to `"chart"` before finalize.
- **Retrieval fallback:** Hybrid search first, `fetchObjects` fallback if embedding model unavailable. This is a hard requirement.
- **LangSmith tracing:** Graph nodes are auto-traced by LangGraph. LLM calls auto-traced by `@langchain/openai`. `RagService.answer` is explicitly wrapped with `traceable()` from `langsmith` for a named sub-span. Do NOT wrap graph node functions with `traceable()` — it breaks LangGraph's type signatures.
- **SSE streaming:** Cumulative snapshots (`{answer, data}`) not deltas. Client always gets the latest full state.
- **Weaviate schema:** `fileId` is TEXT not vectorized not searchable. `pageNumber` is TEXT_ARRAY per spec (not integers). Multi-tenancy enabled, `autoTenantCreation: false`.

## Commands

```bash
npm install                 # Install deps
npm run dev                 # Dev server (tsx)
npm run build               # TypeScript compile
npm run start               # Production (node dist/)
npm run setup               # Wait for Weaviate + create schema + seed
npm run create-schema       # Create Weaviate collection only
npm run seed                # Seed 3 fictional entries only
npm test                    # Vitest (20 tests)
npx tsc --noEmit            # Type check
docker compose up -d        # Start all containers
docker compose up --build   # Rebuild and start
```

## Boot Sequence

```bash
docker compose up -d weaviate
npm run setup
npm run dev
# POST http://localhost:3000/api/chat/stream
```

## Test Queries

| Query | Expected Route |
|---|---|
| `What is the remote work policy?` | RAG |
| `Generate a bar chart` | Chart |
| `What is the travel policy and chart it` | Sequential |
| `Show me a chart and lookup the benefits guide` | Parallel |
| `What is 2 + 2?` | Direct |

## Environment Variables

| Var | Required | Default |
|---|---|---|
| `OPENAI_API_KEY` | Yes | — |
| `OPENAI_MODEL` | No | `gpt-4o-mini` |
| `WEAVIATE_URL` | Yes | `http://localhost:8080` |
| `WEAVIATE_GRPC_PORT` | No | `50051` |
| `WEAVIATE_COLLECTION` | No | `TenantQaChunk` |
| `LANGSMITH_TRACING` | No | `true` |
| `LANGSMITH_API_KEY` | No | — |
| `LANGSMITH_PROJECT` | No | `agentic-rag-chartjs` |
| `PORT` | No | `3000` |

## Known Constraints

- Weaviate runs with `DEFAULT_VECTORIZER_MODULE=none` in Docker. Hybrid search will fail and fall back to `fetchObjects`. To enable real vector search, add a vectorizer module to `docker-compose.yml` and update schema creation.
- Chart tool is a mock. Returns fixed bar chart config regardless of input data.
- No authentication on the Express API. Add middleware before production.
- `data` append-reducer in LangGraph accumulates across nodes. Finalize node re-sorts into correct order. If you add new data-producing nodes, they must use the `kind` discriminator.
- `traceable()` from `langsmith` must NOT wrap functions passed to `addNode()`. LangGraph handles node tracing internally.

## Seed Data (tenant: `tenant-acme`)

| fileId | question | pages |
|---|---|---|
| `employee-handbook` | Remote workdays per week | 3 |
| `benefits-guide` | Health insurance start date | 7 |
| `travel-policy` | Receipt threshold for finance approval | 11, 12 |

## Session Log

- **2026-04-09:** Initial build. Full codebase created. 50 files. 20 unit tests passing. Zero type errors (`tsc --noEmit` clean). Fixed parallel fan-out (string array return from conditional edges), removed `traceable` from graph nodes (type conflict with LangGraph), corrected model name from `gpt-4.1-mini` to `gpt-4o-mini`, added SSE error handling. LangSmith tracing verified at graph, node, LLM, tool, and RagService levels.

---

## IMPORTANT: Memory Update Rule

**At the end of every coding session on this repo, update this CLAUDE.md file:**

1. Add a new entry to the **Session Log** section with the date and a concise summary of what changed (files added/modified/deleted, bugs fixed, features added, design decisions made, tests added/modified).
2. Update any section above that is now stale (e.g. file structure changed, new env vars added, new commands, new constraints discovered, architecture changed).
3. Do NOT delete previous session log entries. Append only.
4. Keep entries factual and terse. No filler. No aspirational notes. Only what actually happened.
