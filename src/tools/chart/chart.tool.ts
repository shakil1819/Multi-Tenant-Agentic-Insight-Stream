import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { buildMockChartConfig } from "./chart.mock.js";

const ChartToolInputSchema = z.object({
  title: z.string().optional().describe("Title for the chart"),
  labels: z.array(z.string()).optional().describe("X-axis labels"),
  seriesLabel: z.string().optional().describe("Dataset series label"),
});

/**
 * LangChain tool that generates a mock Chart.js configuration.
 * Traced automatically by LangSmith when tracing is enabled.
 */
export const chartJsTool = new DynamicStructuredTool({
  name: "generate_chartjs_config",
  description:
    "Generate a Chart.js bar chart configuration. Use when the user asks for a chart, graph, plot, or visualization.",
  schema: ChartToolInputSchema,
  func: async (input) => {
    const artifact = buildMockChartConfig(input);
    // Return a JSON string so the LLM and graph nodes can parse it
    return JSON.stringify(artifact);
  },
});
