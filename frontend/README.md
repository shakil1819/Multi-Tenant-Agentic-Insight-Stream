# Frontend

React + TypeScript client for the backend SSE endpoint.

## Run

```bash
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Backend target

- Default in dev: Vite proxy to `http://localhost:3000`
- Optional direct base URL via `.env`:

```bash
cp .env.example .env
```

Set:

```bash
VITE_API_BASE=http://localhost:3000
```
