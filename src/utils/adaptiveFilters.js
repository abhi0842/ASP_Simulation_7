function clampNumber(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function calculateMSE(reference, filtered) {
  if (!Array.isArray(reference) || !Array.isArray(filtered)) return 0;
  const n = Math.min(reference.length, filtered.length);
  if (n === 0) return 0;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const e = reference[i] - filtered[i];
    acc += e * e;
  }
  return acc / n;
}

export function filterSignalNLMS(noisy, reference, options = {}) {
  const { filterOrder, stepSize, epsilon = 1e-8 } = options;
  if (!Array.isArray(noisy) || !noisy.length) return [];
  if (!Array.isArray(reference) || !reference.length) return [];

  const N = Math.min(noisy.length, reference.length);
  const M = Math.max(1, Math.min(256, Math.floor(filterOrder ?? 1)));
  const p_u = noisy.reduce((acc, v) => acc + v * v, 0) / noisy.length;
  const muMax = 1 / (M * p_u + 1e-8);
  const mu = clampNumber(stepSize ?? 0.1, 0.01, Math.min(0.2, muMax * 0.9));
  const eps = Math.max(1e-12, epsilon);

  const w = new Array(M).fill(0);
  const yFiltered = new Array(N).fill(0);

  for (let n = 0; n < N; n++) {
    let power = eps;
    const xVec = new Array(M);
    for (let k = 0; k < M; k++) {
      const idx = n - k;
      const v = idx >= 0 ? noisy[idx] : 0;
      xVec[k] = v;
      power += v * v;
    }
    let y = 0;
    for (let k = 0; k < M; k++) y += w[k] * xVec[k];
    const e = reference[n] - y;
    yFiltered[n] = e;
    const gain = (mu * e) / power;
    for (let k = 0; k < M; k++) w[k] += gain * xVec[k];
  }
  return yFiltered;
}

export function filterSignalLMS(noisy, reference, options = {}) {
  const { filterOrder, stepSize } = options;
  if (!Array.isArray(noisy) || !noisy.length) return [];
  if (!Array.isArray(reference) || !reference.length) return [];

  const N = Math.min(noisy.length, reference.length);
  const M = Math.max(1, Math.min(256, Math.floor(filterOrder ?? 1)));
  const p_u = noisy.reduce((acc, v) => acc + v * v, 0) / noisy.length;
  const muMax = 1 / (M * p_u + 1e-8);
  const mu = clampNumber(stepSize ?? 0.01, 1e-8, muMax * 0.9);

  const w = new Array(M).fill(0);
  const yFiltered = new Array(N).fill(0);

  for (let n = 0; n < N; n++) {
    const xVec = new Array(M);
    for (let k = 0; k < M; k++) {
      const idx = n - k;
      xVec[k] = idx >= 0 ? noisy[idx] : 0;
    }
    let y = 0;
    for (let k = 0; k < M; k++) y += w[k] * xVec[k];
    const e = reference[n] - y;
    yFiltered[n] = e;
    const gain = mu * e;
    for (let k = 0; k < M; k++) w[k] += gain * xVec[k];
  }
  return yFiltered;
}

export function filterSignalRLS(noisy, reference, options = {}) {
  const { filterOrder, forgettingFactor, regularization } = options;
  if (!Array.isArray(noisy) || !noisy.length) return [];
  if (!Array.isArray(reference) || !reference.length) return [];

  const N = Math.min(noisy.length, reference.length);
  const M = Math.max(1, Math.min(256, Math.floor(filterOrder ?? 1)));
  const lambda = clampNumber(forgettingFactor ?? 0.99, 0.9, 0.999999);
  const delta = Math.max(1e-12, regularization ?? 0.01);

  const P = new Array(M);
  for (let i = 0; i < M; i++) {
    P[i] = new Array(M).fill(0);
    P[i][i] = 1 / delta;
  }

  const w = new Array(M).fill(0);
  const yFiltered = new Array(N).fill(0);

  for (let n = 0; n < N; n++) {
    const xVec = new Array(M);
    for (let k = 0; k < M; k++) {
      const idx = n - k;
      xVec[k] = idx >= 0 ? noisy[idx] : 0;
    }
    const z = new Array(M).fill(0);
    for (let i = 0; i < M; i++) {
      let acc = 0;
      for (let j = 0; j < M; j++) acc += P[i][j] * xVec[j];
      z[i] = acc;
    }
    let xTz = 0;
    for (let k = 0; k < M; k++) xTz += xVec[k] * z[k];
    const denom = lambda + xTz;
    let y = 0;
    for (let k = 0; k < M; k++) y += w[k] * xVec[k];
    const e = reference[n] - y;
    yFiltered[n] = e;
    const kVec = new Array(M);
    for (let i = 0; i < M; i++) kVec[i] = z[i] / denom;
    for (let i = 0; i < M; i++) w[i] += kVec[i] * e;
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < M; j++) {
        P[i][j] = (P[i][j] - kVec[i] * z[j]) / lambda;
      }
    }
    for (let i = 0; i < M; i++) {
      for (let j = i + 1; j < M; j++) {
        const avg = (P[i][j] + P[j][i]) / 2;
        P[i][j] = avg;
        P[j][i] = avg;
      }
    }
  }
  return yFiltered;
}
