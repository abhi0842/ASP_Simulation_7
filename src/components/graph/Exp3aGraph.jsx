import React, { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { LearningGuide } from "../learningGuide/LearningGuide.jsx";
import { InteractiveTutorChart } from "./InteractiveTutorChart.jsx";
import graphStyles from "./exp3aGraph.module.css";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const lineOpts = (titleText) => ({
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { display: true },
    title: { display: true, text: titleText, font: { size: 13 } }
  },
  scales: {
    x: { title: { display: true, text: "Iterations" } },
    y: { title: { display: true, text: "Value" } }
  }
});

export const Exp3aGraph = () => {
  const { algoResults, algorithmMeta } = useContext(SimulationContext);
  if (!algoResults) return null;

  const { type, label, data } = algoResults;
  const iters = data.iterations;

  // MSE chart - common to all
  const mseChart = {
    labels: iters,
    datasets: [{
      label: "MSE",
      data: data.mse,
      borderColor: "red",
      borderWidth: 1,
      pointRadius: 0
    }]
  };

  // Weight convergence
  const colors = ["blue", "purple", "green", "orange", "teal"];
  const weightLabel = (type === "LMS_EQ" || type === "RLS_EQ") ? "w" : "w";
  const weightCharts = data.weights.slice(0, Math.min(data.weights.length, 3)).map((wArr, i) => ({
    labels: iters,
    datasets: [{
      label: `${weightLabel}${i + 1} (estimated)`,
      data: wArr,
      borderColor: colors[i % colors.length],
      borderWidth: 1,
      pointRadius: 0
    }]
  }));

  // Signal for prediction modes
  const showSignal = type === "LMS_PRED" || type === "RLS_PRED";
  const params = {
    algorithm: type.startsWith("RLS") ? "RLS" : "LMS",
    mode: algorithmMeta?.selectedMode,
    mu: Number.isFinite(algorithmMeta?.lmsMu) ? algorithmMeta.lmsMu : undefined,
    order: Number.isFinite(algorithmMeta?.lmsM)
      ? algorithmMeta.lmsM
      : Number.isFinite(algorithmMeta?.rlsM)
        ? algorithmMeta.rlsM
        : undefined,
    lambda: Number.isFinite(algorithmMeta?.rlsLambda) ? algorithmMeta.rlsLambda : undefined,
  };

  return (
    <div className={graphStyles.panel}>
      <h3 className={graphStyles.panelTitle}>Algorithm Output — {label}</h3>

      <LearningGuide title="How to read these plots">
        <p>
          <b>MSE vs iterations</b> — should decrease and plateau when the adaptive algorithm converges.
          A flat or rising MSE means μ is too large or order is mismatched.
        </p>
        <ul>
          <li><b>Equalization</b> — weights estimate the inverse channel; watch smooth convergence.</li>
          <li><b>Prediction</b> — weights model the AR process; compare with the generated signal plot.</li>
          <li>Try smaller μ if MSE oscillates; try larger order if error stays high.</li>
        </ul>
      </LearningGuide>

      {showSignal && data.signal && (
        <InteractiveTutorChart
          title="Generated AR Process Signal"
          graphKind="signal"
          params={params}
          height={250}
          chartData={{
            labels: Array.from({ length: data.signal.length }, (_, i) => i),
            datasets: [
              {
                label: "AR Process Signal",
                data: data.signal,
                borderColor: "#1D7480",
                borderWidth: 1,
                pointRadius: 0,
              },
            ],
          }}
          options={{
            ...lineOpts("Generated AR Process Signal"),
            scales: {
              x: { title: { display: true, text: "Sample" } },
              y: { title: { display: true, text: "Amplitude" } },
            },
          }}
        />
      )}

      <InteractiveTutorChart
        title="Mean Square Error vs Iterations"
        graphKind="mse"
        params={params}
        height={280}
        chartData={mseChart}
        options={lineOpts("Mean Square Error vs Iterations")}
      />

      {weightCharts.map((wc, i) => (
        <InteractiveTutorChart
          key={i}
          title={`Weight w${i + 1} Convergence`}
          graphKind="weights"
          params={params}
          height={260}
          chartData={wc}
          options={lineOpts(`Weight w${i + 1} Convergence`)}
        />
      ))}
    </div>
  );
};
