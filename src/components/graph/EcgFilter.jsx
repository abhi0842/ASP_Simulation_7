import { useMemo, useContext, useEffect } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "./ecgFilter.module.css";
import { Line } from "react-chartjs-2";
import {
  filterSignalLMS,
  filterSignalRLS,
  filterSignalNLMS,
} from "../../utils/adaptiveFilters";
import { LearningGuide } from "../learningGuide/LearningGuide.jsx";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export const EcgFilter = () => {
  const {
    time,
    config,
    filteredECG,
    cleanSignal,
    rawSamples,
    noisySamples,
    selectedChannels,
    setFilteredSamples,
  } = useContext(SimulationContext);

  const filteredData = useMemo(() => {
    const inputSamples =
      noisySamples && noisySamples.length > 0 ? noisySamples : rawSamples;
    if (!inputSamples.length || !cleanSignal.length || !filteredECG) return [];

    const channel = selectedChannels[0];
    if (!channel) return [];

    const windowed = inputSamples.filter((p) => p.x <= time);
    if (windowed.length < 2) return [];

    const noisyECG = windowed.map((p) => p[channel]);
    const cleanGroundTruth = windowed.map((p) => {
      const idx = rawSamples.findIndex((r) => r.x === p.x);
      return cleanSignal[idx >= 0 ? idx : 0] ?? 0;
    });

    const noiseReference = noisyECG.map(
      (v, i) => v - (cleanGroundTruth[i] || 0)
    );

    let cleanedSignal = [];
    if (config.filterType === "NLMS") {
      cleanedSignal = filterSignalNLMS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        stepSize: config.stepSize,
      });
    } else if (config.filterType === "LMS") {
      cleanedSignal = filterSignalLMS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        stepSize: config.stepSize,
      });
    } else {
      cleanedSignal = filterSignalRLS(noiseReference, noisyECG, {
        filterOrder: config.filterOrder,
        forgettingFactor: config.forgettingFactor,
        regularization: config.regularization,
      });
    }

    return windowed.map((p, i) => ({
      x: p.x,
      y: cleanedSignal[i] ?? 0,
    }));
  }, [
    time,
    config,
    cleanSignal,
    rawSamples,
    noisySamples,
    filteredECG,
    selectedChannels,
  ]);

  useEffect(() => {
    setFilteredSamples(filteredData);
  }, [filteredData, setFilteredSamples]);

  if (!filteredECG || !filteredData.length) return null;

  const chartData = {
    datasets: [
      {
        label: "Filtered ECG",
        data: filteredData,
        borderColor: "#2ecc71",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { type: "linear", title: { display: true, text: "Time (s)" } },
      y: { title: { display: true, text: "Amplitude (mV)" } },
    },
  };

  const algoLabel =
    config.filterType === "NLMS"
      ? `NLMS — μ=${config.stepSize} — M=${config.filterOrder}`
      : config.filterType === "LMS"
        ? `LMS — μ=${config.stepSize} — M=${config.filterOrder}`
        : `RLS — λ=${config.forgettingFactor} — M=${config.filterOrder}`;

  return (
    <div className={styles.signalContainer}>
      <h3>
        ECG Signal (Filtered) <span>Algorithm: </span>
        <span>{algoLabel}</span>
      </h3>
      <LearningGuide title="How to read this plot">
        <p>
          The green trace is the adaptive filter output. It should follow the clean reference more closely
          than the noisy input when step size (μ) and order (M) are tuned well.
        </p>
        <ul>
          <li>If the output lags or oscillates, reduce μ or filter order.</li>
          <li>RLS often converges faster than LMS but is more sensitive to λ and δ.</li>
        </ul>
      </LearningGuide>
      <div className="dashboard-chart-shell">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
