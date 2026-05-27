import { useContext, useState, useEffect, useRef, useMemo } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "./rightPanel.module.css";
import Swal from "sweetalert2";
import {
  runLMS_Equalization,
  runLMS_Prediction,
  runRLS_Equalization,
  runRLS_Prediction,
  buildDeterministicSeed,
} from "../../utils/algorithms";

export const RightPanel = () => {
  const {
    time,
    setTime,
    setGenerateECG,
    generateECG,
    loadECGFromCsv,
    originalFs,
    csvFilePath,
    setCsvFilePath,
    prevPathRef,
    selectedAlgo,
    selectedMode,
    setAlgoResults,
    setSelectedMode,
    setSelectedAlgo,
    noise,
    setNoise,
    setApplyNoiseTrigger,
    setApplypsdTrigger,
    setNoisySamples,
    setFilteredSamples,
    filteredECG,
    setFilteredECG,
    setConfig,
    signalType,
    setSignalType,
    setUploadedSignalData,
    setUploadedSignalName,
    uploadedSignalName,
    parseUploadedText,
    commitParsedSignal,
    setAlgorithmMeta,
    markAction,
  } = useContext(SimulationContext);

  const [lmsM, setLmsM] = useState(5);
  const [lmsMu, setLmsMu] = useState(0.01);
  const [lmsN, setLmsN] = useState(500);
  const [lmsP, setLmsP] = useState(4);
  const [rlsM, setRlsM] = useState(5);
  const [rlsLambda, setRlsLambda] = useState(0.99);
  const [rlsDelta, setRlsDelta] = useState(0.1);
  const [rlsN, setRlsN] = useState(500);
  const [rlsP, setRlsP] = useState(4);
  const lastRunRef = useRef({ key: "", payload: null });

  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : base + "/";
  const assetPath = (name) => normalizedBase + name;

  const signalOptions = useMemo(
    () => [
      { id: "ecg200", label: "ECG Dataset 1 (ecg200)", path: assetPath("ecg200.csv") },
      { id: "ecg300", label: "ECG Dataset 2 (ecg300)", path: assetPath("ecg300.csv") },
      { id: "ecg100", label: "ECG Dataset 3 (ecg100)", path: assetPath("ecg100.csv") },
      { id: "upload", label: "Upload your own (CSV/TXT)", path: "" },
    ],
    [normalizedBase]
  );

  useEffect(() => {
    if (prevPathRef.current !== csvFilePath) {
      setAlgoResults(null);
      setApplyNoiseTrigger(false);
      setApplypsdTrigger(false);
      setFilteredECG(false);
      setNoisySamples([]);
      setFilteredSamples([]);
      prevPathRef.current = csvFilePath;
    }
  }, [
    csvFilePath,
    prevPathRef,
    setAlgoResults,
    setApplyNoiseTrigger,
    setApplypsdTrigger,
    setFilteredECG,
    setNoisySamples,
    setFilteredSamples,
  ]);

  const onSignalTypeChange = (type) => {
    setSignalType(type);
    if (type !== "upload") {
      const picked = signalOptions.find((item) => item.id === type);
      if (picked?.path) {
        setCsvFilePath(picked.path);
        setUploadedSignalName("");
        setUploadedSignalData(null);
      }
    }
    setGenerateECG(false);
    setApplyNoiseTrigger(false);
    setFilteredECG(false);
    setFilteredSamples([]);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseUploadedText(text);
    if (!parsed) {
      Swal.fire({
        icon: "error",
        title: "Invalid file",
        text: "Upload CSV/TXT with time and signal columns (headers optional).",
      });
      return;
    }
    setUploadedSignalName(file.name);
    setUploadedSignalData(parsed);
    setSignalType("upload");
    if (commitParsedSignal(parsed)) {
      setGenerateECG(true);
    }
  };

  const handleGenerate = () => {
    if (generateECG) {
      loadECGFromCsv();
    } else {
      setGenerateECG(true);
    }
    markAction("GENERATE_SIGNAL");
  };

  const buildFilterConfig = () => ({
    filterType: selectedAlgo,
    filterOrder: selectedAlgo === "LMS" ? lmsM : rlsM,
    stepSize: lmsMu,
    forgettingFactor: rlsLambda,
    regularization: rlsDelta,
  });

  const runPsd = () => {
    if (!generateECG) {
      Swal.fire({ icon: "info", title: "Oops...", text: "Please generate ECG signal first!" });
      return;
    }
    if (!filteredECG) {
      setConfig(buildFilterConfig());
      setFilteredECG(true);
    }
    setApplypsdTrigger(true);
  };

  const noiseTrigger = () => {
    if (!generateECG) {
      Swal.fire({ icon: "info", title: "Oops...", text: "Please generate ECG signal first!" });
      return;
    }
    if (!noise.baseline && !noise.powerline && !noise.emg) {
      Swal.fire({
        icon: "info",
        title: "Oops...",
        text: "Please select at least one noise type!",
      });
      return;
    }
    setApplyNoiseTrigger(true);
  };

  const handleAlgoChange = (e) => {
    setAlgoResults(null);
    setSelectedAlgo(String(e.target.value));
    markAction("SELECT_ALGO");
  };

  const handleModeChange = (e) => {
    setAlgoResults(null);
    setSelectedMode(String(e.target.value));
  };

  const runAlgorithm = () => {
    if (!generateECG) {
      Swal.fire({ icon: "info", title: "Oops...", text: "Please generate ECG signal first!" });
      return;
    }
    const runConfig = {
      selectedAlgo,
      selectedMode,
      lmsM,
      lmsMu,
      lmsN,
      lmsP,
      rlsM,
      rlsLambda,
      rlsDelta,
      rlsN,
      rlsP,
    };
    setAlgorithmMeta(runConfig);
    setConfig(buildFilterConfig());
    setFilteredECG(true);
    const runKey = JSON.stringify(runConfig);
    if (lastRunRef.current.key === runKey && lastRunRef.current.payload) {
      setAlgoResults(lastRunRef.current.payload);
      return;
    }
    const runSeed = buildDeterministicSeed(runConfig);
    let results;
    let payload = null;
    if (selectedAlgo === "LMS" && selectedMode === "Equalization") {
      results = runLMS_Equalization(lmsN, lmsM, lmsMu, runSeed);
      payload = { type: "LMS_EQ", label: "LMS Equalization", data: results };
    } else if (selectedAlgo === "LMS" && selectedMode === "Prediction") {
      results = runLMS_Prediction(lmsN, lmsP, lmsMu, runSeed);
      payload = { type: "LMS_PRED", label: "LMS Prediction", data: results };
    } else if (selectedAlgo === "RLS" && selectedMode === "Equalization") {
      results = runRLS_Equalization(rlsN, rlsM, rlsLambda, rlsDelta, runSeed);
      payload = { type: "RLS_EQ", label: "RLS Equalization", data: results };
    } else if (selectedAlgo === "RLS" && selectedMode === "Prediction") {
      results = runRLS_Prediction(rlsN, rlsP, rlsLambda, rlsDelta, runSeed);
      payload = { type: "RLS_PRED", label: "RLS Prediction", data: results };
    }
    if (payload) {
      lastRunRef.current = { key: runKey, payload };
      setAlgoResults(payload);
      markAction("RUN_ALGORITHM");
    }
  };

  return (
    <div className={styles.sidebarRoot}>
      <div className={styles.right}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span
            style={{
              fontSize: "13px",
              background: "#E1F5EE",
              color: "#0F6E56",
              borderRadius: "6px",
              padding: "2px 10px",
              fontWeight: 500,
            }}
          >
            {selectedAlgo} — {selectedMode}
          </span>
        </div>

        <h2>ECG Signal &amp; Filter Controls</h2>

        <div id="signalSetup" className={styles.box}>
          <h3>Signal Setup</h3>
          <label>Select ECG Dataset</label>
          <select value={signalType} onChange={(e) => onSignalTypeChange(e.target.value)}>
            {signalOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {signalType === "upload" && (
            <div className={styles.uploadSection}>
              <input type="file" accept=".csv,.txt" onChange={handleUpload} />
              {uploadedSignalName && (
                <p className={styles.fileName}>Uploaded: {uploadedSignalName}</p>
              )}
            </div>
          )}
          <label>
            Duration: <span className={styles.rangeValue}>{time} seconds</span>
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={time}
            onChange={(e) => setTime(Number(e.target.value))}
          />
          <label>
            Sampling Rate: <span>{originalFs} Hz</span>
          </label>
          <button type="button" id="generateButton" onClick={handleGenerate}>
            Generate ECG Signal
          </button>
        </div>

        <div id="noisePanel" className={styles.box}>
          <h3>Add Noise</h3>
          <label>
            <input
              type="checkbox"
              checked={noise.baseline}
              onChange={(e) => setNoise({ ...noise, baseline: e.target.checked })}
            />
            Baseline Wander
          </label>
          <label>
            <input
              type="checkbox"
              checked={noise.powerline}
              onChange={(e) => setNoise({ ...noise, powerline: e.target.checked })}
            />
            Powerline (50 Hz)
          </label>
          <label>
            <input
              type="checkbox"
              checked={noise.emg}
              onChange={(e) => setNoise({ ...noise, emg: e.target.checked })}
            />
            EMG Noise
          </label>
          <div className={styles.buttonContainer}>
            <button type="button" onClick={noiseTrigger}>
              Add Noise to Signal
            </button>
          </div>

        </div>

        <div id="algoSetup" className={styles.box}>
          <h3>Algorithm Setup</h3>
          <label>Algorithm</label>
          <select id="algorithmSelector" value={selectedAlgo || ""} onChange={handleAlgoChange}>
            <option value="LMS">LMS</option>
            <option value="RLS">RLS</option>
          </select>
          <label style={{ marginTop: "8px" }}>Task</label>
          <select value={selectedMode || ""} onChange={handleModeChange}>
            <option value="Equalization">Equalization</option>
            <option value="Prediction">Prediction</option>
          </select>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
            {selectedAlgo === "LMS" && selectedMode === "Equalization" && (
              <>
                <label>Filter order (M): {lmsM}</label>
                <input type="range" min="1" max="20" step="1" value={lmsM} onChange={(e) => setLmsM(Number(e.target.value))} />
                <label>Step size (mu): {lmsMu}</label>
                <input type="range" min="0.001" max="0.5" step="0.001" value={lmsMu} onChange={(e) => setLmsMu(Number(e.target.value))} />
                <label>Number of samples (N): {lmsN}</label>
                <input type="range" min="100" max="2000" step="10" value={lmsN} onChange={(e) => setLmsN(Number(e.target.value))} />
              </>
            )}
            {selectedAlgo === "LMS" && selectedMode === "Prediction" && (
              <>
                <label>Predictor order (P): {lmsP}</label>
                <input type="range" min="1" max="20" step="1" value={lmsP} onChange={(e) => setLmsP(Number(e.target.value))} />
                <label>Step size (mu): {lmsMu}</label>
                <input type="range" min="0.001" max="0.2" step="0.001" value={lmsMu} onChange={(e) => setLmsMu(Number(e.target.value))} />
                <label>Number of samples (N): {lmsN}</label>
                <input type="range" min="100" max="2000" step="10" value={lmsN} onChange={(e) => setLmsN(Number(e.target.value))} />
              </>
            )}
            {selectedAlgo === "RLS" && selectedMode === "Equalization" && (
              <>
                <label>Filter order (M): {rlsM}</label>
                <input type="range" min="1" max="20" step="1" value={rlsM} onChange={(e) => setRlsM(Number(e.target.value))} />
                <label>Forgetting factor (lambda): {rlsLambda}</label>
                <input type="range" min="0.9" max="1" step="0.001" value={rlsLambda} onChange={(e) => setRlsLambda(Number(e.target.value))} />
                <label>Initialization (delta): {rlsDelta}</label>
                <input type="range" min="0.001" max="10" step="0.001" value={rlsDelta} onChange={(e) => setRlsDelta(Number(e.target.value))} />
                <label>Number of samples (N): {rlsN}</label>
                <input type="range" min="100" max="2000" step="10" value={rlsN} onChange={(e) => setRlsN(Number(e.target.value))} />
              </>
            )}
            {selectedAlgo === "RLS" && selectedMode === "Prediction" && (
              <>
                <label>Predictor order (P): {rlsP}</label>
                <input type="range" min="1" max="20" step="1" value={rlsP} onChange={(e) => setRlsP(Number(e.target.value))} />
                <label>Forgetting factor (lambda): {rlsLambda}</label>
                <input type="range" min="0.9" max="1" step="0.001" value={rlsLambda} onChange={(e) => setRlsLambda(Number(e.target.value))} />
                <label>Initialization (delta): {rlsDelta}</label>
                <input type="range" min="0.001" max="10" step="0.001" value={rlsDelta} onChange={(e) => setRlsDelta(Number(e.target.value))} />
                <label>Number of samples (N): {rlsN}</label>
                <input type="range" min="100" max="2000" step="10" value={rlsN} onChange={(e) => setRlsN(Number(e.target.value))} />
              </>
            )}
          </div>

          <div id="algoRunActions" className={`${styles.psdContainer} ${styles.actionRow}`}>
            <button type="button" id="applyAlgoBtn" onClick={runAlgorithm}>
              Apply Algorithm
            </button>
            <button type="button" onClick={runPsd}>
              Compute PSD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
