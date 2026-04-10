# Agentic RAG + ChartJS (Full Stack)

Production-oriented agentic system with:
- Node.js Fastify backend
- Weaviate multi-tenant vector database
- LangGraph routing/orchestration
- LangChain-based LLM + tool integration
- React + TypeScript frontend
- SSE streaming response contract

## Services

`docker compose up` starts all services together:
- `weaviate` on `:8080`
- `backend` on `:3000` (Fastify + Swagger)
- `frontend` on `:5173` (Vite dev server)

## Hot Reload Behavior

- Backend uses `tsx watch src/server.ts`.
- Frontend uses Vite HMR.
- Source directories are bind-mounted into containers.
- Code changes are reflected without rebuilding images.

## Agentic Runtime Controls (This Phase)

### Guardrails
- Request guardrails block unsafe input patterns before graph execution.
- Validation covers tenant/file identifier safety, oversized payloads, and prompt-injection/exfiltration patterns.

### Memory
- Tenant-scoped persistent memory is stored under `.runtime/memory/`.
- Recent successful turns are appended and reused as conversational memory context.

### Context Engineering
- Query + memory are token-budgeted before model calls.
- Recent memory is injected under a bounded budget to avoid context bloat.

## Architecture

```text
Frontend (React)
  -> POST /api/chat/stream
      -> Backend (Fastify)
          -> LangGraph router
             -> Direct node (LLM)
             -> RAG node (Weaviate + LLM)
             -> Chart node (mock Chart.js tool)
          -> Finalize node
  <- SSE snapshots: { answer, data[] }
```

## Prerequisites

- Docker Desktop / Docker Engine + Compose v2
- `.env` configured at repository root
- valid `OPENAI_API_KEY`

## Environment

Create root `.env` from `.env.example` and set:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `LANGSMITH_*` (optional but recommended)

Compose overrides:
- backend `WEAVIATE_URL=http://weaviate:8080`
- frontend `VITE_PROXY_TARGET=http://backend:3000`

## One-Command Startup

```bash
docker compose up
```

What happens:
1. Weaviate starts and becomes healthy.
2. Backend installs deps, runs schema+seed (`npm run setup`), then starts in watch mode.
3. Frontend starts in Vite dev mode with proxy to backend.

## Endpoints

- Frontend UI: `http://localhost:5173`
- Backend health: `http://localhost:3000/health`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`

## API Contract

### `POST /api/chat/stream`

Request:

```json
{
  "tenantId": "tenant-acme",
  "query": "What is the remote work policy?",
  "fileIds": ["optional-file-id"]
}
```

Response (SSE):

```text
data: {"answer":"...","data":[...]}

event: done
data: {}
```

`data[]` may include:
- `rag_reference_group`
- `chartjs`

## Weaviate Setup

Schema is managed by:
- `scripts/create-schema.ts`
- `scripts/seed.ts`

Multi-tenant collection includes:
- `fileId` (TEXT, filterable, not searchable)
- `question` (TEXT, searchable)
- `answer` (TEXT, searchable)
- `pageNumber` (TEXT_ARRAY)

RAG behavior:
1. Hybrid query attempt
2. Fallback to `fetchObjects` if embedding/vectorizer route is unavailable
3. Reference grouping labels like `N- Page X`

## Observability

LangSmith tracing is supported through:
- `LANGSMITH_TRACING`
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`
- `LANGSMITH_ENDPOINT`

## Development Commands

```bash
docker compose up -d
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f weaviate
docker compose down
docker compose down -v
```

Recreate backend after `.env` change:

```bash
docker compose up -d --force-recreate backend
```

## Local (Non-Docker) Optional

Backend:

```bash
npm install
npm run setup
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### Swagger "Failed to fetch"

- hard refresh docs (`Ctrl+F5`)
- check backend health endpoint
- ensure browser is calling same host where docs are served

### 401 from OpenAI

- invalid/expired key in `.env`
- recreate backend container after changing `.env`

### Weaviate unavailable

```bash
docker compose ps
docker compose logs weaviate --tail 200
```
