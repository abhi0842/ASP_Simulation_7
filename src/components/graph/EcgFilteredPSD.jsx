import { useContext, useMemo } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { computePSD } from "../../utils/psd";
import { Line } from "react-chartjs-2";
import { LearningGuide } from "../learningGuide/LearningGuide.jsx";
import styles from "./ecgFilteredPSD.module.css";

export const EcgFilteredPSD = () => {
  const { filteredSamples, generateECG, originalFs } =
    useContext(SimulationContext);

  const psdData = useMemo(() => {
    if (!generateECG || filteredSamples.length === 0) return null;
    const signal = filteredSamples.map((p) => p.y);
    if (signal.length < 2) return null;
    return computePSD(signal, Number(originalFs));
  }, [filteredSamples, generateECG, originalFs]);

  if (!psdData) return null;

  const fs = Number(originalFs);

  const chartData = {
    datasets: [
      {
        label: "Filtered ECG PSD",
        data: psdData.psd.map((p, i) => ({ x: psdData.freqs[i], y: p })),
        borderColor: "green",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: true,
    parsing: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: fs / 2,
        title: {
          display: true,
          text: "Frequency (Hz)",
          font: {
            size: 13,
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: 13,
          },
        },
      },
      y: {
        min: 0,
        title: {
          display: true,
          text: "PSD (V²/Hz)",
          font: {
            size: 13,
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className={styles.signalContainer}>
      <h3>Power Spectral Density — Filtered ECG</h3>
      <LearningGuide title="How to read this plot">
        <p>
          Compare with the unfiltered PSD: successful filtering reduces noise peaks (e.g. 50 Hz) while
          preserving the main 5–40 Hz ECG band.
        </p>
        <ul>
          <li>Lower PSD at 50 Hz → powerline suppression.</li>
          <li>Less energy below 1 Hz → reduced baseline wander.</li>
        </ul>
      </LearningGuide>
      <div className="dashboard-chart-shell">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};
