import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext.jsx";
import styles from "./landing.module.css";

export const LandingScreen = () => {
  const { screen, setScreen, selectedAlgo, setSelectedAlgo, setSelectedMode, setAlgoResults, setGenerateECG } =
    useContext(SimulationContext);

  const handleAlgoSelect = (algo) => {
    setSelectedAlgo(algo);
    setSelectedMode(null);
    setAlgoResults(null);
    setGenerateECG(false);
    setScreen("sub");
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setAlgoResults(null);
    setGenerateECG(false);
    setScreen("simulation");
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Adaptive Signal Processing</h2>

      <div className={styles.btnRow}>
        <button
          className={`${styles.algoBtn} ${selectedAlgo === "LMS" ? styles.selected : ""}`}
          onClick={() => handleAlgoSelect("LMS")}
        >
          LMS
        </button>
        <button
          className={`${styles.algoBtn} ${selectedAlgo === "RLS" ? styles.selected : ""}`}
          onClick={() => handleAlgoSelect("RLS")}
        >
          RLS
        </button>
      </div>

      {screen === "sub" && (
        <div className={styles.btnRow}>
          <button className={styles.subBtn} onClick={() => handleModeSelect("Equalization")}>
            Equalization
          </button>
          <button className={styles.subBtn} onClick={() => handleModeSelect("Prediction")}>
            Prediction
          </button>
        </div>
      )}

      {screen === "landing" && (
        <p className={styles.hint}>Select an algorithm</p>
      )}
    </div>
  );
};
