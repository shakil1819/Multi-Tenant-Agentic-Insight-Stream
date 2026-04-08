# Agentic RAG + Chart.js System

LangGraph-orchestrated agent hierarchy with Weaviate vector DB (multi-tenancy), RAG retrieval, and mock Chart.js tool. Full LangSmith tracing.

## Architecture

```
POST /api/chat/stream { tenantId, query }
  → Route Node (heuristics + LLM fallback)
    ├── Direct Node → LLM answer, no tools
    ├── RAG Node → Weaviate hybrid/fetchObjects → LLM-grounded answer + file refs
    ├── Chart Node → Mock Chart.js config
    └── [RAG, Chart] parallel or sequential
  → Finalize Node → ordered {answer, data} via SSE
```

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenAI API key (set in `.env`)
- LangSmith API key (optional, for tracing dashboard)

## Quick Start (Single Command)

```bash
docker compose up
```

This single command:
- starts Weaviate
- waits for readiness
- creates schema (if missing)
- seeds tenant data (if missing)
- starts the Fastify backend

Endpoints:
- API docs: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`
- Health: `http://localhost:3000/health`

## Quick Start (Manual Local Dev)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your real OPENAI_API_KEY and LANGSMITH_API_KEY

# 3. Start Weaviate
docker compose up -d weaviate

# 4. Wait for Weaviate + create schema + seed data
npm run setup

# 5. Start dev server
npm run dev
```

## Usage

### SSE Stream (primary endpoint)

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"tenant-acme","query":"What is the remote work policy?"}'
```

### Example queries

| Query | Route |
|-------|-------|
| `What is the remote work policy?` | RAG |
| `Generate a bar chart of quarterly sales` | Chart |
| `What is the travel reimbursement threshold and chart it` | Sequential (RAG → Chart) |
| `Show me a chart and also lookup the benefits guide` | Parallel (RAG + Chart) |
| `What is 2 + 2?` | Direct |

### Health check

```bash
curl http://localhost:3000/health
```

### API docs (Swagger UI)

```bash
# Interactive docs UI
http://localhost:3000/docs

# OpenAPI JSON document
http://localhost:3000/docs/json
```

## Docker Full Deployment

```bash
docker compose up --build
```

This starts both Weaviate and the app. The app container waits for Weaviate readiness, creates the schema, seeds data, then starts the server.

## LangSmith Tracing

When `LANGSMITH_TRACING=true` and `LANGSMITH_API_KEY` is set:

- Every graph execution appears as a LangGraph trace
- Each node (route, rag, chart, direct, finalize) is a child span
- All ChatOpenAI calls are traced as LLM runs
- Chart tool invocations are traced as tool runs
- RAG service operations are traced as chain runs

View traces at: https://smith.langchain.com

## Response Format

Each SSE event:
```json
{
  "answer": "Cumulative answer text so far...",
  "data": [
    {
      "kind": "rag_reference_group",
      "fileIndex": 1,
      "fileId": "employee-handbook",
      "pages": ["3"],
      "labels": ["1- Page 3"],
      "chunksUsed": [...]
    },
    {
      "kind": "chartjs",
      "chartId": "chart-...",
      "summary": "...",
      "config": { "type": "bar", ... }
    }
  ]
}
```

RAG reference groups always come before chart artifacts in `data[]`.

## Tests

```bash
npm test
```

## File Structure

```
├── docker-compose.yml       # Weaviate + app containers
├── Dockerfile               # Multi-stage Node.js build
├── scripts/
│   ├── wait-for-weaviate.ts # Readiness poller
│   ├── create-schema.ts     # Collection + multi-tenancy setup
│   └── seed.ts              # 3 fictional QA entries
├── src/
│   ├── server.ts            # Entry point, LangSmith init
│   ├── app.ts               # Fastify + Swagger setup
│   ├── config/env.ts        # Zod-validated env config
│   ├── api/
│   │   ├── dto/chat.dto.ts  # Request validation
│   │   └── routes/
│   │       ├── health.route.ts
│   │       └── chat.stream.route.ts  # SSE handler
│   ├── types/               # Shared TypeScript types
│   ├── prompts/             # All LLM prompts centralized
│   ├── infra/
│   │   ├── openai/          # ChatOpenAI singleton
│   │   └── weaviate/        # Client, schema, repository
│   ├── tools/chart/         # Mock Chart.js LangChain tool
│   ├── agents/rag/          # RAG service, normalize, references
│   ├── graph/
│   │   ├── state.ts         # LangGraph typed state
│   │   ├── routes.ts        # Conditional edge logic
│   │   ├── app.graph.ts     # Compiled StateGraph
│   │   └── nodes/           # route, direct, rag, chart, finalize
│   ├── streaming/           # SSE + stream normalizer
│   └── utils/logger.ts
└── tests/
    └── unit/                # Reference grouping, routing, normalizer
```
