/** Input the LLM passes to the chart tool */
export type ChartToolInput = {
  title?: string;
  labels?: string[];
  seriesLabel?: string;
};

/** The artifact returned by the chart tool */
export type ChartArtifact = {
  kind: "chartjs";
  chartId: string;
  summary: string;
  config: {
    type: "bar";
    data: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
      }>;
    };
    options: {
      responsive: boolean;
      plugins: {
        legend: { display: boolean };
        title: { display: boolean; text: string };
      };
    };
  };
};
