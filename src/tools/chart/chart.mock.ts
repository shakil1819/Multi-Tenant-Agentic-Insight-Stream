import type { ChartArtifact, ChartToolInput } from "../../types/chart.types.js";

/**
 * Deterministic mock. No LLM, no network.
 * Returns a valid Chart.js bar config.
 */
export function buildMockChartConfig(input: ChartToolInput): ChartArtifact {
  const labels = input.labels ?? ["Jan", "Feb", "Mar", "Apr"];
  const title = input.title ?? "Mock Chart";
  const seriesLabel = input.seriesLabel ?? "Series A";

  return {
    kind: "chartjs",
    chartId: `chart-${Date.now()}`,
    summary: `Mocked Chart.js bar chart titled "${title}".`,
    config: {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: seriesLabel,
            data: [12, 19, 7, 15],
            backgroundColor: ["#4285F4", "#34A853", "#FBBC05", "#EA4335"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: title },
        },
      },
    },
  };
}
