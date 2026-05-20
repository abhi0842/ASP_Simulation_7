import { useContext } from "react";
import styles from "./leftPanel.module.css";
import { EcgUnfilter } from "../graph/EcgUnfilter.jsx";
import { EcgNoisy } from "../graph/EcgNoisy.jsx";
import { EcgFilter } from "../graph/EcgFilter.jsx";
import { Exp3aGraph } from "../graph/Exp3aGraph.jsx";
import { EcgUnfilteredPSD } from "../graph/EcgUnfilteredPSD.jsx";
import { EcgFilteredPSD } from "../graph/EcgFilteredPSD.jsx";
import { SimulationContext } from "../../context/SimulationContext.jsx";

export const LeftPanel = () => {
  const { generateECG, applyNoiseTrigger, filteredECG, applypsdTrigger } =
    useContext(SimulationContext);
  return (
    <div className={styles.leftPanelContainer}>
      <div className={styles.mainStack}>
        {applypsdTrigger && (
          <div className={styles.contentGrid}>
            <EcgUnfilteredPSD />
            <EcgFilteredPSD />
          </div>
        )}
        {generateECG && (
          <div className={styles.chartSection}>
            <EcgUnfilter />
          </div>
        )}
        <div className={styles.noisyFilteredRow}>
          {applyNoiseTrigger && <EcgNoisy />}
          {filteredECG && <EcgFilter />}
        </div>
        <div className={styles.chartSection}>
          <Exp3aGraph />
        </div>
      </div>
    </div>
  );
};
