import { useContext, useMemo } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { computePSD } from "../../utils/psd";
import { Line } from "react-chartjs-2";
import { LearningGuide } from "../learningGuide/LearningGuide.jsx";
import styles from "./ecgUnfilteredPSD.module.css";

export const EcgUnfilteredPSD = () => {
  const {
    rawSamples,
    noisySamples,
    generateECG,
    originalFs,
    time,
    colors,
    selectedChannels,
  } = useContext(SimulationContext);

  const psdData = useMemo(() => {
    if (!generateECG || rawSamples.length === 0) return null;

    const channel = selectedChannels[0];
    if (!channel) return null;

    const source =
      noisySamples && noisySamples.length > 0 ? noisySamples : rawSamples;
    const windowed = source.filter((p) => p.x <= time);
    if (windowed.length < 2) return null;

    const signal = windowed.map((p) => p[channel]);
    const fs = Number(originalFs);
    const data = computePSD(signal, fs);
    return { channel, ...data };
  }, [rawSamples, noisySamples, generateECG, originalFs, time, selectedChannels]);

  if (!psdData) return null;

  const chartData = {
    datasets: [
      {
        label: `Unfiltered ECG PSD (${psdData.channel})`,
        data: psdData.psd.map((p, i) => ({
          x: psdData.freqs[i],
          y: p,
        })),
        borderColor: colors[0] || "#005FA7",
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
        max: Number(originalFs) / 2,
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
      <h3>Power Spectral Density — Unfiltered ECG</h3>
      <LearningGuide title="How to read this plot">
        <p>PSD shows where signal energy sits in frequency (Hz). For ECG:</p>
        <ul>
          <li>Most energy is below ~40 Hz (QRS bandwidth).</li>
          <li>A peak near <b>50 Hz</b> suggests powerline interference.</li>
          <li>Extra low-frequency (&lt; 1 Hz) power indicates baseline wander.</li>
        </ul>
      </LearningGuide>
      <div className="dashboard-chart-shell">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

