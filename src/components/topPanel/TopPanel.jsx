import { useContext } from "react";
import styles from "./topPanel.module.css";
import { SimulationContext } from "../../context/SimulationContext.jsx";

export const TopPanel = () => {
  const { showInstruction, setShowInstruction, buttonRef, screen } = useContext(SimulationContext);

  const toggleInstruction = () => setShowInstruction(!showInstruction);

  return (
    <div className={styles.Container}>
      <div className={styles.panelShell}>
        <div className={styles.panelContainer}>
        <h1>Adaptive Prediction and Equalization with LMS and RLS Algorithm</h1>
        <div className={styles.buttonContainer}>
          {screen === "simulation" && (
            <>
              <button ref={buttonRef} className={styles.panelButton} onClick={toggleInstruction}>
                <span className={styles.buttonIcon}>ℹ️</span>
                Instructions
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
