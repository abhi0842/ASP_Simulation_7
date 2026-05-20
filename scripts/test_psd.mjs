import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { computePSD } from "../src/utils/psd.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function generateSine(freq, fs, duration, noiseAmp = 0) {
  const N = Math.floor(fs * duration);
  const signal = new Array(N);
  for (let n = 0; n < N; n++) {
    const t = n / fs;
    signal[n] =
      Math.sin(2 * Math.PI * freq * t) + (Math.random() * 2 - 1) * noiseAmp;
  }
  return signal;
}

function topPeaks(freqs, psd, n = 5) {
  return psd
    .map((v, i) => ({ f: freqs[i], v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, n);
}

function loadEcgChannel(csvPath, channel = "ECG_I", maxSeconds = null) {
  const text = readFileSync(csvPath, "utf8");
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const timeIdx = headers.indexOf("time_sec");
  const chIdx = headers.indexOf(channel);
  const values = [];
  const times = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const t = parseFloat(cols[timeIdx]);
    const v = parseFloat(cols[chIdx]);
    if (!Number.isFinite(t) || !Number.isFinite(v)) continue;
    if (maxSeconds != null && t > maxSeconds) break;
    times.push(t);
    values.push(v);
  }
  const dt = times.length > 1 ? times[1] - times[0] : 0.002;
  const fs = dt > 0 ? 1 / dt : 500;
  return { signal: values, fs };
}

let passed = 0;
let failed = 0;

function assert(name, cond) {
  if (cond) {
    console.log(`PASS: ${name}`);
    passed++;
  } else {
    console.log(`FAIL: ${name}`);
    failed++;
  }
}

console.log("=== PSD unit tests (exp3b) ===\n");

// 1) Sine wave should peak near 10 Hz
{
  const fs = 500;
  const { freqs, psd } = computePSD(generateSine(10, fs, 2, 0.01), fs);
  const peaks = topPeaks(freqs, psd, 1);
  const peakF = peaks[0].f;
  assert("sine peak near 10 Hz", Math.abs(peakF - 10) < 1.5);
  console.log(`  top peak: ${peakF.toFixed(2)} Hz\n`);
}

// 2) Output lengths
{
  const sig = generateSine(5, 256, 1);
  const { freqs, psd } = computePSD(sig, 256);
  assert("freqs and psd same length", freqs.length === psd.length);
  assert("one-sided spectrum", freqs.length === Math.floor((1 << Math.ceil(Math.log2(sig.length))) / 2));
  console.log();
}

// 3) ecg100.csv full file — expect ~167 Hz (3-sample cycle at 500 Hz)
{
  const csv = join(__dirname, "../public/ecg100.csv");
  const { signal, fs } = loadEcgChannel(csv);
  const { freqs, psd } = computePSD(signal, fs);
  const peaks = topPeaks(freqs, psd, 3);
  const peakF = peaks[0].f;
  assert("ecg100 dominant peak ~167 Hz (dataset pattern)", Math.abs(peakF - 166.67) < 2);
  console.log(`  ecg100 top peaks: ${peaks.map((p) => `${p.f.toFixed(1)} Hz`).join(", ")}\n`);
}

// 4) 8-second window only
{
  const csv = join(__dirname, "../public/ecg100.csv");
  const { signal, fs } = loadEcgChannel(csv, "ECG_I", 8);
  assert("8s window has ~4000 samples", signal.length >= 3900 && signal.length <= 4100);
  const { freqs, psd } = computePSD(signal, fs);
  assert("PSD computed for windowed signal", psd.length > 0 && freqs[freqs.length - 1] <= fs / 2);
  console.log(`  8s window samples: ${signal.length}\n`);
}

console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
