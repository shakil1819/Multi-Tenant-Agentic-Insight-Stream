# Agentic RAG ChartJS Backend

Production-oriented Node.js backend that orchestrates a LangGraph agent flow with:
- Weaviate multi-tenant knowledge retrieval (RAG).
- Mock Chart.js artifact generation.
- Server-Sent Events (SSE) streaming response format.
- Fastify + Swagger UI for API documentation.
- Optional LangSmith tracing for graph/tool/LLM observability.

## Overview

The backend exposes one primary endpoint:
- `POST /api/chat/stream`

Input:
- `tenantId`
- `query`
- optional `fileIds`

Output is streamed SSE snapshots with shape:

```json
{
  "answer": "string",
  "data": []
}
```

`data[]` may contain:
- RAG reference objects (`rag_reference_group`).
- Chart artifacts (`chartjs`).

## Architecture

```text
Client
  -> POST /api/chat/stream (SSE)
      -> LangGraph router node
         -> direct node
         -> rag node (Weaviate retrieval + LLM synthesis)
         -> chart node (mock Chart.js tool)
      -> finalize node (orders data, composes final answer)
  -> streamed snapshots: { answer, data[] }
```

Routing supports:
- direct answering
- rag only
- chart only
- rag + chart sequential
- rag + chart parallel

## Tech Stack

- Runtime: Node.js 20+, TypeScript, ESM
- API server: Fastify
- API docs: `@fastify/swagger`, `@fastify/swagger-ui`
- Agent orchestration: `@langchain/langgraph`
- LLM abstraction/tooling: LangChain
- Vector DB: Weaviate (`weaviate-client`)
- Testing: Vitest

## Repository Structure

```text
.
├── docker-compose.yml
├── Dockerfile
├── scripts/
│   ├── wait-for-weaviate.ts
│   ├── create-schema.ts
│   └── seed.ts
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   ├── api/
│   ├── graph/
│   ├── agents/
│   ├── tools/
│   ├── infra/
│   ├── streaming/
│   └── types/
└── tests/
```

## Prerequisites

- Node.js 20+
- Docker Desktop / Docker Engine with Compose v2
- OpenAI API key (current implementation uses OpenAI through LangChain)
- Optional LangSmith API key for tracing

## Environment Configuration

1. Copy environment template:

```bash
cp .env.example .env
```

2. Set required values in `.env`:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `WEAVIATE_URL` (local default is fine for non-docker host mode)
- `LANGSMITH_API_KEY` (optional)

Notes:
- In Docker Compose, app `WEAVIATE_URL` is overridden to `http://weaviate:8080`.
- Do not commit real secrets.

## Quick Start (Recommended)

Single command startup:

```bash
docker compose up
```

What this does:
- starts Weaviate
- waits for readiness
- creates collection schema if missing
- seeds tenant data if missing
- starts Fastify server

Useful URLs:
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`
- Health: `http://localhost:3000/health`

## Local Development (Without App Container)

```bash
npm install
docker compose up -d weaviate
npm run setup
npm run dev
```

## Build, Run, Test

```bash
npm run build
npm run start
npm test
```

## API Documentation

Swagger UI is served at:
- `GET /docs`

OpenAPI JSON:
- `GET /docs/json`

Implementation detail:
- OpenAPI does not hardcode `servers` to keep Swagger "Try it out" same-origin safe across environments.

## Primary API Contract

### `POST /api/chat/stream`

Request:

```json
{
  "tenantId": "tenant-acme",
  "query": "What is the remote work policy?",
  "fileIds": ["optional-file-id"]
}
```

Response:
- `Content-Type: text/event-stream`
- frames shaped as:

```text
data: {"answer":"...","data":[...]}

event: done
data: {}
```

Example cURL:

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"tenant-acme","query":"What is the remote work policy?"}'
```

## Weaviate Schema and Multi-Tenancy

Collection is created by `scripts/create-schema.ts` with:
- `fileId` (TEXT, filterable, not searchable)
- `question` (TEXT, searchable)
- `answer` (TEXT, searchable)
- `pageNumber` (TEXT_ARRAY)

Multi-tenancy is enabled.
Seeding is done by `scripts/seed.ts` with fictional entries under tenant `tenant-acme`.

## RAG and Fallback Behavior

RAG path behavior:
1. Try hybrid search.
2. If unavailable (for example no vectorizer), fallback to `fetchObjects`.
3. Normalize hits and group references by `fileId`.
4. Emit reference labels in format `N- Page X`.

## Observability (LangSmith)

When enabled:
- Graph runs, node spans, tool spans, and model calls are traced.

Required env:
- `LANGSMITH_TRACING=true`
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`

Dashboard:
- `https://smith.langchain.com`

## Operational Commands

```bash
docker compose up -d
docker compose logs -f app
docker compose ps
docker compose down
docker compose down -v
```

## Troubleshooting

### Swagger "Failed to fetch" / CORS-style error

- Ensure you are opening and calling from the same host/origin where docs are served.
- Hard refresh the docs page after deployments (`Ctrl+F5`).
- Confirm backend is reachable at `/health`.

### `401 Incorrect API key provided`

- Your `OPENAI_API_KEY` is invalid, expired, or not loaded by the running process.
- After editing `.env` in docker mode, recreate app container:

```bash
docker compose up -d --force-recreate app
```

### Weaviate not ready

- Check container status and logs:

```bash
docker compose ps
docker compose logs weaviate --tail 200
```

### No streaming in API client

- Use an SSE-capable client (`curl -N`, browser EventSource, or frontend SSE handling).

## Security Practices

- Never commit real API keys.
- Rotate keys immediately if exposed.
- Keep `.env` local/private.
- Prefer least-privilege API tokens where supported.
- Validate and sanitize all external inputs at API boundaries (already enforced with DTO schema validation).

## Production Hardening Checklist

- Replace mock/demo keys with managed secrets provider.
- Add request rate limiting and authN/authZ.
- Add structured log shipping and metrics.
- Pin and regularly patch Docker base images and npm dependencies.
- Add CI gates for tests and type checks.

