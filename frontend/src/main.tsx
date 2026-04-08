import React from "react";
import ReactDOM from "react-dom/client";
import { Chart as ChartJS, registerables } from "chart.js";
import App from "./App";
import "./styles.css";

ChartJS.register(...registerables);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
