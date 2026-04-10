import { chartJsTool } from "../../tools/chart/chart.tool.js";
import { logger } from "../../utils/logger.js";
import type { AppStateType } from "../state.js";
import type { ChartArtifact } from "../../types/chart.types.js";
import type { ResponseDataObject } from "../../types/response.types.js";

/**
 * Chart node: calls the mock Chart.js tool and pushes the artifact into data.
 * LangGraph auto-traces this node. The tool invocation is a child tool span.
 */
export async function chartNode(_state: AppStateType): Promise<Partial<AppStateType>> {
  try {
    const toolResult = await chartJsTool.invoke({
      title: "Requested Chart",
    });

    const artifact: ChartArtifact = JSON.parse(toolResult);

    logger.info("Chart tool completed", { chartId: artifact.chartId });

    const dataObjects: ResponseDataObject[] = [artifact];

    return {
      chartResult: artifact,
      data: dataObjects,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("Chart node failed", { error: msg });
    return {
      errors: [`chart_node: ${msg}`],
    };
  }
}
