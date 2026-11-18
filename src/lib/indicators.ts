// Classic technical indicators and a transparent vote-based trend read.
// Everything is shown to the user signal by signal; nothing here is a forecast.
import type { Candle } from "./market";

export function sma(v: number[], n: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  v.forEach((x, i) => {
    sum += x;
    if (i >= n) sum -= v[i - n];
    out.push(i >= n - 1 ? sum / n : null);
  });
  return out;
}

export function ema(v: number[], n: number): number[] {
  const k = 2 / (n + 1);
  const out: number[] = [];
  v.forEach((x, i) => out.push(i === 0 ? x : x * k + out[i - 1] * (1 - k)));
  return out;
}

export function rsi(v: number[], n = 14): number | null {
  if (v.length <= n) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = v[i] - v[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= n; loss /= n;
  for (let i = n + 1; i < v.length; i++) {
    const d = v[i] - v[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
  }
  return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
}

export function atr(c: Candle[], n = 14): number | null {
  if (c.length <= n) return null;
  const tr = c.slice(1).map((x, i) => Math.max(x.high - x.low, Math.abs(x.high - c[i].close), Math.abs(x.low - c[i].close)));
  let a = tr.slice(0, n).reduce((s, x) => s + x, 0) / n;
  for (let i = n; i < tr.length; i++) a = (a * (n - 1) + tr[i]) / n;
  return a;
}

/** Least squares on the last `n` closes. Returns slope per bar, intercept, R² and residual σ. */
export function regression(v: number[], n: number) {
  const y = v.slice(-n);
  const m = y.length;
  const xm = (m - 1) / 2;
  const ym = y.reduce((s, x) => s + x, 0) / m;
  let sxy = 0, sxx = 0, sst = 0;
  y.forEach((yi, i) => { sxy += (i - xm) * (yi - ym); sxx += (i - xm) ** 2; sst += (yi - ym) ** 2; });
  const slope = sxx ? sxy / sxx : 0;
  const intercept = ym - slope * xm;
  let sse = 0;
  y.forEach((yi, i) => { sse += (yi - (intercept + slope * i)) ** 2; });
  return { slope, intercept, r2: sst ? 1 - sse / sst : 0, sigma: Math.sqrt(sse / Math.max(1, m - 2)), n: m };
}

export type Signal = { name: string; value: string; vote: -1 | 0 | 1; why: string };
export type Trend = "ALCISTA" | "BAJISTA" | "LATERAL";

export type Analysis = {
  trend: Trend;
  score: number; // -100..100
  strength: "débil" | "moderada" | "fuerte";
  last: number;
  rsi: number | null;
  atrPct: number | null;
  support: number;
  resistance: number;
  signals: Signal[];
  chart: { closes: number[]; sma20: (number | null)[]; sma50: (number | null)[]; reg: { from: number; slope: number; intercept: number; sigma: number; ahead: number } };
};

const v = (b: boolean | null, cond2?: boolean | null): -1 | 0 | 1 => (b ? 1 : cond2 ? -1 : 0);

export function analyze(candles: Candle[]): Analysis | null {
  if (candles.length < 30) return null;
  const c = candles.map((x) => x.close);
  const last = c.at(-1)!;
  const s20 = sma(c, 20), s50 = sma(c, 50), s200 = sma(c, 200);
  const m20 = s20.at(-1)!, m50 = s50.at(-1), m200 = s200.at(-1);
  const e26 = ema(c, 26);
  const macdLine = ema(c, 12).map((x, i) => x - e26[i]);
  const hist = macdLine.at(-1)! - ema(macdLine, 9).at(-1)!;
  const r = rsi(c);
  const a = atr(candles);
  const reg = regression(c, 20);
  const slopePct = (reg.slope / last) * 100;
  const look = candles.slice(-20);
  const hi = Math.max(...look.map((x) => x.high)), lo = Math.min(...look.map((x) => x.low));
  const pos = (last - lo) / (hi - lo || 1);
  const f = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: x < 10 ? 4 : 2 });

  const signals: Signal[] = [
    { name: "Precio vs media 20", value: `${f(last)} / ${f(m20)}`, vote: v(last > m20, last < m20), why: "Tendencia de corto plazo" },
    ...(m50 != null ? [{ name: "Precio vs media 50", value: `${f(last)} / ${f(m50)}`, vote: v(last > m50, last < m50), why: "Tendencia de medio plazo" } as Signal] : []),
    ...(m50 != null ? [{ name: "Media 20 vs media 50", value: m20 > m50 ? "20 arriba" : "20 abajo", vote: v(m20 > m50, m20 < m50), why: "Cruce de medias" } as Signal] : []),
    ...(m200 != null && m50 != null ? [{ name: "Media 50 vs media 200", value: m50 > m200 ? "cruce dorado" : "cruce de la muerte", vote: v(m50 > m200, m50 < m200), why: "Régimen de largo plazo" } as Signal] : []),
    { name: "MACD (histograma)", value: f(hist), vote: v(hist > 0, hist < 0), why: "Impulso: la media rápida se aleja o se acerca de la lenta" },
    { name: "RSI 14", value: r == null ? "—" : r.toFixed(1), vote: v(r != null && r > 55, r != null && r < 45), why: r == null ? "" : r > 70 ? "Sobrecompra: subida extendida, riesgo de pausa" : r < 30 ? "Sobreventa: caída extendida, riesgo de rebote" : "Zona neutral entre 45 y 55" },
    { name: "Regresión 20 velas", value: `${slopePct >= 0 ? "+" : ""}${slopePct.toFixed(3)}%/vela · R² ${reg.r2.toFixed(2)}`, vote: reg.r2 > 0.3 ? v(slopePct > 0, slopePct < 0) : 0, why: reg.r2 > 0.3 ? "Pendiente clara" : "Precio sin dirección clara (R² bajo)" },
    { name: "Posición en el rango 20", value: `${Math.round(pos * 100)}%`, vote: v(pos > 0.8, pos < 0.2), why: "Cerca del máximo o del mínimo reciente" },
  ];
  const score = Math.round((signals.reduce((s, x) => s + x.vote, 0) / signals.length) * 100);
  const abs = Math.abs(score);
  const tail = 120;
  const from = Math.max(0, c.length - tail);
  return {
    trend: score >= 35 ? "ALCISTA" : score <= -35 ? "BAJISTA" : "LATERAL",
    score,
    strength: abs >= 70 ? "fuerte" : abs >= 35 ? "moderada" : "débil",
    last,
    rsi: r,
    atrPct: a != null ? (a / last) * 100 : null,
    support: lo,
    resistance: hi,
    signals,
    chart: {
      closes: c.slice(from),
      sma20: s20.slice(from),
      sma50: s50.slice(from),
      // Regression fitted on the last 20 bars, index relative to the sliced chart.
      reg: { from: c.length - from - reg.n, slope: reg.slope, intercept: reg.intercept, sigma: reg.sigma, ahead: 10 },
    },
  };
}

// ---- Full series for the interactive chart ----

export function rsiSeries(v: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = new Array(v.length).fill(null);
  if (v.length <= n) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= n; i++) {
    const d = v[i] - v[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= n; loss /= n;
  out[n] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = n + 1; i < v.length; i++) {
    const d = v[i] - v[i - 1];
    gain = (gain * (n - 1) + Math.max(d, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function macdSeries(v: number[], fast = 12, slow = 26, sig = 9) {
  const f = ema(v, fast), s = ema(v, slow);
  const line = f.map((x, i) => x - s[i]);
  const signal = ema(line, sig);
  return { line, signal, hist: line.map((x, i) => x - signal[i]) };
}

export function bollinger(v: number[], n = 20, k = 2) {
  const mid = sma(v, n);
  const up: (number | null)[] = [], lo: (number | null)[] = [];
  v.forEach((_, i) => {
    const m = mid[i];
    if (m == null) { up.push(null); lo.push(null); return; }
    let ss = 0;
    for (let j = i - n + 1; j <= i; j++) ss += (v[j] - m) ** 2;
    const sd = Math.sqrt(ss / n);
    up.push(m + k * sd); lo.push(m - k * sd);
  });
  return { mid, up, lo };
}
