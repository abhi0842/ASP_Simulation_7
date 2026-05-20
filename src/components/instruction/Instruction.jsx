import React, { useContext } from "react";
import styles from "./instruction.module.css";
import { SimulationContext } from "../../context/SimulationContext.jsx";

export const Instruction = () => {
  const { selectedAlgo, selectedMode } = useContext(SimulationContext);

  const isEqualization = selectedMode === "Equalization";
  const isLMS = selectedAlgo === "LMS";

  return (
    <div className={styles.box}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>INSTRUCTIONS</h1>
          <p style={{ fontSize: "13px", color: "#555" }}>
            Mode: <strong>{selectedAlgo} — {selectedMode}</strong>
          </p>
        </div>
        <div className={styles.card}>
          <p><span>STEP 1: Signal Setup</span><br />
            Select an <b>ECG Dataset</b> from the dropdown menu to serve as the input signal. Use the <b>Duration</b> slider to limit the length of the data being analyzed, then click <b>&quot;Generate ECG Signal&quot;</b> to plot the raw signal.
          </p>
        </div>
        <div className={styles.card}>
          <p><span>STEP 2: Add Noise (optional)</span><br />
            In the <b>Add Noise</b> section, select <b>Baseline Wander</b>, <b>Powerline (50 Hz)</b>, and/or <b>EMG Noise</b>. You must generate the ECG first. Click <b>&quot;Add Noise to Signal&quot;</b> to plot the contaminated ECG in <b>red</b> below the clean trace. Unchecking all noise types removes the noisy plot. Changing the dataset clears the noise view; generate the signal again before re-applying noise.
          </p>
        </div>
        <div className={styles.card}>
          <p><span>STEP 3: Select Task</span><br />
            Under <b>Algorithm Setup</b>, choose your desired <b>Algorithm</b> (LMS or RLS) and the specific <b>Task</b> (Equalization or Prediction).
          </p>
        </div>
        <div className={styles.card}>
          <p><span>STEP 4: Configure Filter Parameters</span><br />
            {isEqualization
              ? <>Adjust the <b>Filter Order (M)</b> (the number of filter taps) and the <b>Step Size (mu)</b> or Forgetting Factor to control the convergence speed and stability of the filter.</>
              : <>Adjust the <b>Predictor Order (P)</b> (the number of past samples used to estimate the current one) and the <b>Step Size (mu)</b> or Forgetting Factor.</>
            }
            {!isLMS && <> Pay special attention to the <b>Forgetting Factor (lambda)</b> and <b>Initialization (delta)</b> as they critically affect RLS performance.</>}
          </p>
        </div>
        <div className={styles.card}>
          <p><span>STEP 5: Set Simulation Length</span><br />
            Adjust the <b>Number of Samples (N)</b> to control how many data points are processed. A larger number of samples typically provides a clearer view of the algorithm&apos;s convergence behaviour.
          </p>
        </div>
        <div className={styles.card}>
          <p><span>STEP 6: Run and Observe</span><br />
            Click <b>&quot;Apply Algorithm&quot;</b> to execute the simulation.
            {isEqualization
              ? <> Observe the <b>MSE vs Iterations</b> plot to evaluate error convergence over time, and the <b>Weight Convergence</b> plots to see how individual filter taps adapt.</>
              : <> Observe the <b>AR Process Signal</b>, the <b>MSE vs Iterations</b> plot for prediction error, and the <b>Weight Convergence</b> plots to see the adaptive weights stabilizing.</>
            }
            {" "}The selected adaptive algorithm itself acts as the filter, and <b>&quot;Compute PSD&quot;</b> compares power spectra of the unfiltered and filtered signals.
          </p>
        </div>
      </div>
    </div>
  );
};
