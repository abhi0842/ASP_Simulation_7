/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { guideSteps } from "../guideSteps";

export const SimulationContext = createContext();

const CHANNEL = "ECG_I";
const COLORS = ["#4da6ff", "#ff4d4d", "#66ff66", "#ffcc00", "#cc66ff", "#00cccc"];

const baseUrl = () => {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : base + "/";
};

export const SimulationProvider = ({ children }) => {
  const [showInstruction, setShowInstruction] = useState(false);
  const buttonRef = useRef(null);
  const instructionPanelRef = useRef(null);

  const [screen] = useState("simulation");
  const [selectedAlgo, setSelectedAlgo] = useState("LMS");
  const [selectedMode, setSelectedMode] = useState("Equalization");

  const [csvFilePath, setCsvFilePath] = useState(() => baseUrl() + "ecg200.csv");
  const prevPathRef = useRef(csvFilePath);
  const [signalType, setSignalType] = useState("ecg200");
  const [uploadedSignalName, setUploadedSignalName] = useState("");
  const [uploadedSignalData, setUploadedSignalData] = useState(null);

  const [time, setTime] = useState(5);
  const [generateECG, setGenerateECG] = useState(false);
  const [filteredECG, setFilteredECG] = useState(false);
  const [algoResults, setAlgoResults] = useState(null);
  const [algorithmMeta, setAlgorithmMeta] = useState(null);
  const [config, setConfig] = useState({
    filterType: "LMS",
    filterOrder: 5,
    stepSize: 0.01,
    forgettingFactor: 0.99,
    regularization: 0.1,
  });

  const [applyNoiseTrigger, setApplyNoiseTrigger] = useState(false);
  const [applypsdTrigger, setApplypsdTrigger] = useState(false);
  const [noise, setNoise] = useState({
    baseline: false,
    powerline: false,
    emg: false,
  });

  const [rawSamples, setRawSamples] = useState([]);
  const [cleanSignal, setCleanSignal] = useState([]);
  const [noisySamples, setNoisySamples] = useState([]);
  const [filteredSamples, setFilteredSamples] = useState([]);
  const [originalFs, setOriginalFs] = useState(500);
  const [selectedChannels, setSelectedChannels] = useState([CHANNEL]);
  const [colors, setColors] = useState(COLORS);

  // --- Guided Mode State ---
  const [guideActive, setGuideActive] = useState(false);
  const [step, setStep] = useState(0);
  const [actions, setActions] = useState({});

  const markAction = (action) => {
    setActions((prev) => ({ ...prev, [action]: true }));
  };

  const steps = guideSteps;
  const currentStep = steps[step];
  const canProceed = !currentStep?.requiredAction || actions[currentStep.requiredAction];

  useEffect(() => {
    if (currentStep?.requiredAction && actions[currentStep.requiredAction]) {
      setStep((prev) => Math.min(steps.length - 1, prev + 1));
    }
  }, [actions, currentStep, steps.length]);

  const parseCsvECG = useCallback((text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return null;

    const header = lines[0].split(",").map((h) => h.trim());
    const timeIdx = header.findIndex(
      (h) => h === "time_sec" || h.startsWith("time_sec") || h === "Time"
    );
    const rawIdx = header.findIndex((h) => h === "ECG_I" || h.includes("ECG_I"));
    const cleanIdx = header.findIndex(
      (h) => h === "ECG_I_filtered" || h.includes("ECG_I_filtered")
    );

    const resolvedTimeIdx = timeIdx >= 0 ? timeIdx : 0;
    const resolvedRawIdx = rawIdx >= 0 ? rawIdx : 1;
    const resolvedCleanIdx = cleanIdx >= 0 ? cleanIdx : 2;

    const points = [];
    const clean = [];
    const times = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const t = Number.parseFloat(cols[resolvedTimeIdx]);
      const raw = Number.parseFloat(cols[resolvedRawIdx]);
      const ref = Number.parseFloat(cols[resolvedCleanIdx]);
      if (!Number.isFinite(t) || !Number.isFinite(raw)) continue;
      const t0 = times.length === 0 ? t : times[0];
      const x = t - t0;
      points.push({ x, [CHANNEL]: raw });
      clean.push(Number.isFinite(ref) ? ref : raw);
      times.push(t);
    }

    if (points.length < 2) return null;

    let dtSum = 0;
    let dtCount = 0;
    for (let i = 1; i < Math.min(points.length, 200); i++) {
      const dt = points[i].x - points[i - 1].x;
      if (dt > 0 && Number.isFinite(dt)) {
        dtSum += dt;
        dtCount++;
      }
    }
    const fs = dtCount > 0 ? 1 / (dtSum / dtCount) : 500;

    return { points, clean, fs };
  }, []);

  const parseUploadedText = useCallback(
    (text) => {
      const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (rows.length < 2) return null;

      const header = rows[0].split(/[,\t;]+/).map((h) => h.trim());
      const lower = header.map((h) => h.toLowerCase());
      const hasHeader =
        lower.some((h) => h.includes("time")) || lower.some((h) => h.includes("ecg"));
      const start = hasHeader ? 1 : 0;

      let timeCol = lower.findIndex((h) => h.includes("time"));
      let signalCol = lower.findIndex(
        (h) => h.includes("ecg") || h.includes("signal") || h.includes("value")
      );
      let refCol = lower.findIndex((h) => h.includes("filtered") || h.includes("clean"));

      if (timeCol < 0) timeCol = 0;
      if (signalCol < 0) signalCol = hasHeader ? 1 : 0;
      if (refCol < 0) refCol = signalCol + 1 < header.length ? signalCol + 1 : -1;

      const points = [];
      const clean = [];
      const times = [];

      for (let i = start; i < rows.length; i++) {
        const cols = rows[i].split(/[,\t;]+/).map((c) => c.trim());
        if (cols.length < 2) continue;
        const t = Number.parseFloat(cols[timeCol]);
        const raw = Number.parseFloat(cols[signalCol]);
        const ref =
          refCol >= 0 && refCol < cols.length
            ? Number.parseFloat(cols[refCol])
            : raw;
        if (!Number.isFinite(t) || !Number.isFinite(raw)) continue;
        const t0 = times.length === 0 ? t : times[0];
        points.push({ x: t - t0, [CHANNEL]: raw });
        clean.push(Number.isFinite(ref) ? ref : raw);
        times.push(t);
      }

      if (points.length < 4) return null;

      const dt = points[1].x - points[0].x;
      const fs = dt > 0 ? 1 / dt : 500;
      return { points, clean, fs };
    },
    []
  );

  const applyDurationWindow = useCallback(
    (parsed) => {
      if (!parsed?.points?.length) return parsed;
      const windowed = parsed.points.filter((p) => p.x <= time);
      const n = windowed.length;
      return {
        points: windowed,
        clean: parsed.clean.slice(0, n),
        fs: parsed.fs,
      };
    },
    [time]
  );

  const commitParsedSignal = useCallback((parsed) => {
    const sliced = applyDurationWindow(parsed);
    if (!sliced?.points?.length) return false;
    setRawSamples(sliced.points);
    setCleanSignal(sliced.clean);
    setOriginalFs(Number(sliced.fs.toFixed(2)));
    setSelectedChannels([CHANNEL]);
    setColors(COLORS);
    setFilteredECG(false);
    setFilteredSamples([]);
    setNoisySamples([]);
    setAlgoResults(null);
    setAlgorithmMeta(null);
    setApplyNoiseTrigger(false);
    setApplypsdTrigger(false);
    setNoise({ baseline: false, powerline: false, emg: false });
    return true;
  }, [applyDurationWindow]);

  const loadECGFromCsv = useCallback(async () => {
    try {
      let parsed = null;
      if (uploadedSignalData && signalType === "upload") {
        parsed = uploadedSignalData;
      } else {
        const res = await fetch(csvFilePath);
        if (!res.ok) throw new Error(`Failed to load ECG CSV: ${res.status}`);
        const text = await res.text();
        parsed = parseCsvECG(text);
      }
      if (!parsed) throw new Error("CSV parse failed (no usable rows).");
      if (!commitParsedSignal(parsed)) throw new Error("No samples in selected duration window.");
    } catch (e) {
      console.error(e);
    }
  }, [
    csvFilePath,
    parseCsvECG,
    signalType,
    uploadedSignalData,
    commitParsedSignal,
  ]);

  useEffect(() => {
    if (!generateECG) return;
    loadECGFromCsv();
  }, [generateECG, loadECGFromCsv]);

  useEffect(() => {
    if (prevPathRef.current !== csvFilePath) {
      setGenerateECG(false);
      setApplyNoiseTrigger(false);
      setFilteredECG(false);
      setApplypsdTrigger(false);
      setFilteredSamples([]);
      setNoisySamples([]);
      setAlgoResults(null);
      setAlgorithmMeta(null);
      setRawSamples([]);
      setCleanSignal([]);
      prevPathRef.current = csvFilePath;
    }
  }, [csvFilePath]);

  return (
    <SimulationContext.Provider
      value={{
        showInstruction,
        setShowInstruction,
        buttonRef,
        instructionPanelRef,
        screen,
        selectedAlgo,
        setSelectedAlgo,
        selectedMode,
        setSelectedMode,
        generateECG,
        setGenerateECG,
        filteredECG,
        setFilteredECG,
        config,
        setConfig,
        cleanSignal,
        csvFilePath,
        setCsvFilePath,
        prevPathRef,
        rawSamples,
        originalFs,
        time,
        setTime,
        selectedChannels,
        colors,
        noise,
        setNoise,
        applyNoiseTrigger,
        setApplyNoiseTrigger,
        applypsdTrigger,
        setApplypsdTrigger,
        noisySamples,
        setNoisySamples,
        filteredSamples,
        setFilteredSamples,
        algoResults,
        setAlgoResults,
        algorithmMeta,
        setAlgorithmMeta,
        signalType,
        setSignalType,
        uploadedSignalName,
        setUploadedSignalName,
        uploadedSignalData,
        setUploadedSignalData,
        parseUploadedText,
        commitParsedSignal,
        loadECGFromCsv,
        // Guided Tutor
        guideActive,
        setGuideActive,
        step,
        setStep,
        steps,
        actions,
        markAction,
        canProceed,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
