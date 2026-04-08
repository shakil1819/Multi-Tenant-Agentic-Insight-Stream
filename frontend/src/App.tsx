import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Chart } from "react-chartjs-2";
import { streamChat } from "./lib/streamChat";
import type {
  ChartArtifact,
  ChatRequestPayload,
  HealthResponse,
  RagReferenceGroup,
  StreamPayload,
} from "./types";

type StreamState = "idle" | "streaming" | "done" | "error";

function defaultApiBase(): string {
  if (import.meta.env.VITE_API_BASE) {
    return String(import.meta.env.VITE_API_BASE);
  }

  if (import.meta.env.DEV) {
    return "";
  }

  return `${window.location.protocol}//${window.location.host}`;
}

function parseFileIds(raw: string): string[] | undefined {
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return ids.length > 0 ? ids : undefined;
}

function statusLabel(status: StreamState): string {
  if (status === "streaming") return "Streaming";
  if (status === "done") return "Completed";
  if (status === "error") return "Error";
  return "Idle";
}

export default function App() {
  const [apiBase, setApiBase] = useState(defaultApiBase());
  const [tenantId, setTenantId] = useState("tenant-acme");
  const [query, setQuery] = useState("What is the remote work policy?");
  const [fileIdsText, setFileIdsText] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string>("");
  const [streamError, setStreamError] = useState<string>("");
  const [streamState, setStreamState] = useState<StreamState>("idle");
  const [snapshot, setSnapshot] = useState<StreamPayload>({ answer: "", data: [] });
  const abortRef = useRef<AbortController | null>(null);

  const ragReferences = useMemo(
    () =>
      snapshot.data.filter(
        (item): item is RagReferenceGroup => item.kind === "rag_reference_group",
      ),
    [snapshot.data],
  );

  const chartArtifacts = useMemo(
    () =>
      snapshot.data.filter(
        (item): item is ChartArtifact => item.kind === "chartjs",
      ),
    [snapshot.data],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const response = await fetch(`${apiBase}/health`);
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        const data = (await response.json()) as HealthResponse;
        if (!cancelled) {
          setHealth(data);
          setHealthError("");
        }
      } catch (err) {
        if (!cancelled) {
          setHealth(null);
          setHealthError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    void loadHealth();
    const timer = window.setInterval(() => void loadHealth(), 20000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [apiBase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (streamState === "streaming") {
      return;
    }

    setSnapshot({ answer: "", data: [] });
    setStreamError("");
    setStreamState("streaming");

    const payload: ChatRequestPayload = {
      tenantId,
      query,
      fileIds: parseFileIds(fileIdsText),
    };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(apiBase, payload, controller.signal, {
        onSnapshot: (next) => setSnapshot(next),
        onDone: () => {
          setStreamState((current) => (current === "error" ? "error" : "done"));
        },
        onError: (message) => {
          setStreamError(message);
          setStreamState("error");
        },
      });
    } catch (err) {
      if (controller.signal.aborted) {
        setStreamState("idle");
        return;
      }
      setStreamError(err instanceof Error ? err.message : String(err));
      setStreamState("error");
    } finally {
      abortRef.current = null;
    }
  }

  function stopStream() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamState("idle");
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Agentic Interface</p>
          <h1>RAG + Chart Streaming Console</h1>
          <p className="subtitle">
            Live client for the Fastify backend (`/api/chat/stream`).
          </p>
        </div>
        <div className="status-card">
          <p className={`pill pill-${streamState}`}>{statusLabel(streamState)}</p>
          <p className="meta">API Base: {apiBase || "(proxy mode)"}</p>
          <p className="meta">
            Health:{" "}
            {health ? `${health.ok ? "ok" : "down"} / weaviate: ${health.weaviate}` : "unreachable"}
          </p>
          {healthError ? <p className="error-inline">{healthError}</p> : null}
        </div>
      </header>

      <main className="layout">
        <section className="panel panel-input">
          <h2>Request</h2>
          <form onSubmit={onSubmit}>
            <label>
              Backend URL
              <input
                value={apiBase}
                onChange={(event) => setApiBase(event.target.value.trim())}
                placeholder="http://localhost:3000"
              />
            </label>

            <label>
              Tenant ID
              <input
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
                required
              />
            </label>

            <label>
              Query
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={5}
                required
              />
            </label>

            <label>
              File IDs (comma-separated, optional)
              <input
                value={fileIdsText}
                onChange={(event) => setFileIdsText(event.target.value)}
                placeholder="employee-handbook, benefits-guide"
              />
            </label>

            <div className="actions">
              <button type="submit" disabled={streamState === "streaming"}>
                {streamState === "streaming" ? "Streaming..." : "Start Stream"}
              </button>
              <button type="button" className="ghost" onClick={stopStream}>
                Stop
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel-answer">
          <h2>Answer</h2>
          <div className="answer-box">{snapshot.answer || "No streamed answer yet."}</div>
          {streamError ? (
            <div className="error-banner">Stream error: {streamError}</div>
          ) : null}
        </section>

        <section className="panel panel-references">
          <h2>RAG References</h2>
          {ragReferences.length === 0 ? (
            <p className="empty">No reference data returned.</p>
          ) : (
            <div className="reference-grid">
              {ragReferences.map((ref) => (
                <article className="reference-card" key={`${ref.fileId}-${ref.fileIndex}`}>
                  <p className="reference-title">
                    #{ref.fileIndex} {ref.fileId}
                  </p>
                  <p className="reference-labels">{ref.labels.join(", ")}</p>
                  <p className="reference-pages">Pages: {ref.pages.join(", ")}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel panel-charts">
          <h2>Chart Artifacts</h2>
          {chartArtifacts.length === 0 ? (
            <p className="empty">No chart artifacts returned.</p>
          ) : (
            <div className="chart-list">
              {chartArtifacts.map((chart) => (
                <article className="chart-card" key={chart.chartId}>
                  <p className="reference-title">{chart.summary}</p>
                  <Chart
                    type={chart.config.type as any}
                    data={chart.config.data as any}
                    options={chart.config.options as any}
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel panel-json">
          <h2>Latest Snapshot JSON</h2>
          <pre>{JSON.stringify(snapshot, null, 2)}</pre>
        </section>
      </main>
    </div>
  );
}
