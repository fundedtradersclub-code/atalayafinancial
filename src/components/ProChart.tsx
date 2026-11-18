"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries, HistogramSeries, LineSeries, LineStyle, createChart,
  type IChartApi, type ISeriesApi, type Logical, type MouseEventParams, type UTCTimestamp,
} from "lightweight-charts";
import { Crosshair, Eraser, GitCommitHorizontal, MoveUpRight, Ruler, Spline, TrendingUp, Undo2 } from "lucide-react";
import type { Candle } from "@/lib/market";
import { bollinger, ema, macdSeries, regression, rsiSeries, sma } from "@/lib/indicators";
import { fmt, fmtPrice } from "./ui";

// Charts by TradingView Lightweight Charts (Apache-2.0); its attribution logo stays on.
// Drawings are our own SVG layer on top, stored in time/price space so they survive zoom and interval changes.

type Pt = { t: number; p: number }; // raw UTC seconds, price
type Kind = "trend" | "ray" | "hline" | "fib";
type Drawing = { id: string; kind: Kind; a: Pt; b?: Pt };
type Tool = "cursor" | Kind | "measure";
type Ind = "vol" | "ma20" | "ma50" | "ma200" | "ema21" | "bb" | "chan" | "rsi" | "macd";

const IND_LABEL: Record<Ind, string> = {
  vol: "Volumen", ma20: "Media 20", ma50: "Media 50", ma200: "Media 200", ema21: "EMA 21",
  bb: "Bollinger", chan: "Canal de tendencia", rsi: "RSI 14", macd: "MACD",
};
const IND_COLOR: Partial<Record<Ind, string>> = { ma20: "#ffb224", ma50: "#6cb8ff", ma200: "#e879a6", ema21: "#d9d2c0", bb: "#8a8577" };
const FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

const TOOLS: { id: Tool; label: string; icon: typeof Crosshair; hint: string }[] = [
  { id: "cursor", label: "Cursor", icon: Crosshair, hint: "Mover y hacer zoom" },
  { id: "trend", label: "Línea de tendencia", icon: TrendingUp, hint: "Clic en dos puntos" },
  { id: "ray", label: "Rayo", icon: MoveUpRight, hint: "Línea que se extiende a la derecha. Clic en dos puntos" },
  { id: "hline", label: "Línea horizontal", icon: GitCommitHorizontal, hint: "Soporte o resistencia. Un clic" },
  { id: "fib", label: "Fibonacci", icon: Spline, hint: "Retroceso: clic en el mínimo y el máximo (o al revés)" },
  { id: "measure", label: "Regla", icon: Ruler, hint: "Mide distancia, % y velas. Clic en dos puntos" },
];

function loadJSON<T>(k: string, f: T): T {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : f; } catch { return f; }
}
function saveJSON(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
}

export default function ProChart({ symbol, candles, intraday, frame, livePrice }: { symbol: string; candles: Candle[]; intraday: boolean; frame: string; livePrice?: number | null }) {
  // Keep the user's zoom/scroll when data refreshes; reset it only when the interval changes.
  const viewRef = useRef<{ frame: string; from: number; to: number; n: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  // The live chart handles, mirrored into state (set from a frame callback) so render can read them.
  const [api, setApi] = useState<{ chart: IChartApi; main: ISeriesApi<"Candlestick"> } | null>(null);
  const [, setVer] = useState(0); // bump to re-project the SVG layer
  const bump = useCallback(() => setVer((v) => v + 1), []);

  const [ind, setInd] = useState<Ind[]>(() => loadJSON("atalaya.ind", ["vol", "ma20", "ma50"] as Ind[]));
  const [tool, setTool] = useState<Tool>("cursor");
  const [drawings, setDrawings] = useState<Drawing[]>(() => loadJSON(`atalaya.draw.${symbol}`, [] as Drawing[]));
  const [pending, setPending] = useState<Pt | null>(null);
  const [measure, setMeasure] = useState<{ a: Pt; b: Pt } | null>(null);
  const [hover, setHover] = useState<{ pt: Pt | null; idx: number | null }>({ pt: null, idx: null });
  const [menu, setMenu] = useState(false);

  useEffect(() => saveJSON("atalaya.ind", ind), [ind]);
  useEffect(() => saveJSON(`atalaya.draw.${symbol}`, drawings), [drawings, symbol]);

  // ---- time <-> logical index (fractional, extrapolates past both ends) ----
  const times = useMemo(() => candles.map((c) => c.time), [candles]);
  const step = times.length > 1 ? times[times.length - 1] - times[times.length - 2] : 60;
  const toLogical = useCallback((t: number) => {
    const n = times.length;
    if (!n) return 0;
    if (t <= times[0]) return (t - times[0]) / step;
    if (t >= times[n - 1]) return n - 1 + (t - times[n - 1]) / step;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (times[m] <= t) lo = m; else hi = m; }
    return lo + (t - times[lo]) / (times[hi] - times[lo] || 1);
  }, [times, step]);
  const fromLogical = useCallback((l: number) => {
    const n = times.length;
    if (!n) return 0;
    if (l <= 0) return times[0] + l * step;
    if (l >= n - 1) return times[n - 1] + (l - (n - 1)) * step;
    const i = Math.floor(l);
    return times[i] + (l - i) * (times[i + 1] - times[i]);
  }, [times, step]);

  // Latest values for chart event handlers without recreating the chart.
  const live = useRef({ tool, pending, fromLogical });
  useEffect(() => { live.current = { tool, pending, fromLogical }; });

  const ptFrom = useCallback((param: MouseEventParams): Pt | null => {
    const chart = chartRef.current, s = mainRef.current;
    if (!chart || !s || !param.point || (param.paneIndex ?? 0) !== 0) return null;
    const l = param.logical ?? chart.timeScale().coordinateToLogical(param.point.x);
    const p = s.coordinateToPrice(param.point.y);
    if (l == null || p == null) return null;
    return { t: live.current.fromLogical(l), p };
  }, []);

  // ---- build the chart ----
  useEffect(() => {
    if (!box.current || !candles.length) return;
    const css = getComputedStyle(document.documentElement);
    const v = (n: string) => css.getPropertyValue(n).trim();
    const chart = createChart(box.current, {
      autoSize: true,
      layout: { background: { color: v("--panel") }, textColor: v("--muted"), fontFamily: "var(--font-plex-mono), monospace", fontSize: 11, attributionLogo: true, panes: { separatorColor: v("--line-strong"), separatorHoverColor: v("--amber-dim") } },
      grid: { vertLines: { color: "#17150f" }, horzLines: { color: "#17150f" } },
      rightPriceScale: { borderColor: v("--line") },
      timeScale: { borderColor: v("--line"), timeVisible: intraday, secondsVisible: false, rightOffset: 8 },
      crosshair: { vertLine: { color: v("--amber-dim"), labelBackgroundColor: v("--amber-dim") }, horzLine: { color: v("--amber-dim"), labelBackgroundColor: v("--amber-dim") } },
    });
    chartRef.current = chart;
    const off = intraday ? -new Date().getTimezoneOffset() * 60 : 0; // show intraday axis in local time
    const T = (s: number) => (s + off) as UTCTimestamp;
    const up = v("--up"), down = v("--down");
    const main = chart.addSeries(CandlestickSeries, { upColor: up, downColor: down, borderUpColor: up, borderDownColor: down, wickUpColor: up, wickDownColor: down });
    mainRef.current = main;
    main.setData(candles.map((c) => ({ time: T(c.time), open: c.open, high: c.high, low: c.low, close: c.close })));

    const closes = candles.map((c) => c.close);
    const line = (vals: (number | null)[], color: string, opts: Record<string, unknown> = {}, pane = 0) => {
      const s = chart.addSeries(LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, ...opts }, pane);
      s.setData(vals.flatMap((x, i) => (x == null ? [] : [{ time: T(candles[i].time), value: x }])));
      return s;
    };

    if (ind.includes("vol")) {
      const vol = chart.addSeries(HistogramSeries, { priceScaleId: "vol", priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      vol.setData(candles.map((c) => ({ time: T(c.time), value: c.volume, color: c.close >= c.open ? "rgba(61,220,132,0.28)" : "rgba(255,92,77,0.28)" })));
    }
    if (ind.includes("ma20")) line(sma(closes, 20), IND_COLOR.ma20!);
    if (ind.includes("ma50")) line(sma(closes, 50), IND_COLOR.ma50!);
    if (ind.includes("ma200")) line(sma(closes, 200), IND_COLOR.ma200!);
    if (ind.includes("ema21")) line(ema(closes, 21), IND_COLOR.ema21!, { lineStyle: LineStyle.Dashed });
    if (ind.includes("bb")) {
      const b = bollinger(closes);
      line(b.up, IND_COLOR.bb!); line(b.lo, IND_COLOR.bb!); line(b.mid, IND_COLOR.bb!, { lineStyle: LineStyle.Dotted });
    }
    let pane = 1;
    if (ind.includes("rsi")) {
      const r = line(rsiSeries(closes), v("--amber"), { lastValueVisible: true, crosshairMarkerVisible: true }, pane);
      r.createPriceLine({ price: 70, color: v("--down"), lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: "70" });
      r.createPriceLine({ price: 30, color: v("--up"), lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false, title: "30" });
      pane++;
    }
    if (ind.includes("macd")) {
      const m = macdSeries(closes);
      const h = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
      h.setData(m.hist.map((x, i) => ({ time: T(candles[i].time), value: x, color: x >= 0 ? "rgba(61,220,132,0.55)" : "rgba(255,92,77,0.55)" })));
      line(m.line, v("--info"), {}, pane);
      line(m.signal, v("--amber"), {}, pane);
    }
    chart.panes().forEach((p, i) => { if (i > 0) p.setHeight(110); });

    // Default view: the most recent ~150 bars, not the whole history crushed together.
    const n = candles.length;
    const prev = viewRef.current;
    if (prev && prev.frame === frame) {
      const shift = n - prev.n; // new bars arrived: keep the same window glued to the right edge
      chart.timeScale().setVisibleLogicalRange({ from: prev.from + shift, to: prev.to + shift });
    } else {
      chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, n - 150), to: n + 8 });
    }

    // Our own click detection: the library folds two quick clicks into a double-click,
    // which swallowed the second point of two-click tools.
    const el = box.current;
    let press: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => { press = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      const d = press;
      press = null;
      const { tool: tl, pending: pd } = live.current;
      if (tl === "cursor" || !d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      if (x > chart.timeScale().width() || y > chart.paneSize(0).height) return;
      const l = chart.timeScale().coordinateToLogical(x);
      const p = main.coordinateToPrice(y);
      if (l == null || p == null) return;
      const pt: Pt = { t: live.current.fromLogical(l), p };
      const id = `${Date.now()}`;
      if (tl === "hline") { setDrawings((d) => [...d, { id, kind: "hline", a: pt }]); return; }
      if (!pd) { setPending(pt); setMeasure(null); return; }
      if (tl === "measure") setMeasure({ a: pd, b: pt });
      else setDrawings((d) => [...d, { id, kind: tl, a: pd, b: pt }]);
      setPending(null);
    };
    const onMove = (param: MouseEventParams) => {
      const pt = ptFrom(param);
      const idx = param.logical != null ? Math.round(param.logical) : null;
      setHover({ pt, idx: idx != null && idx >= 0 && idx < n ? idx : null });
    };
    el.addEventListener("pointerdown", onDown, true);
    el.addEventListener("pointerup", onUp, true);
    chart.subscribeCrosshairMove(onMove);
    chart.timeScale().subscribeVisibleLogicalRangeChange(bump);
    chart.timeScale().subscribeSizeChange(bump);
    const raf = requestAnimationFrame(() => { setApi({ chart, main }); bump(); });

    return () => {
      const r = chart.timeScale().getVisibleLogicalRange();
      if (r) viewRef.current = { frame, from: r.from, to: r.to, n };
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onDown, true);
      el.removeEventListener("pointerup", onUp, true);
      chart.unsubscribeCrosshairMove(onMove);
      chart.remove();
      chartRef.current = null; mainRef.current = null;
      setApi(null);
    };
  }, [candles, ind, intraday, frame, ptFrom, bump]);

  useEffect(() => {
    api?.chart.applyOptions({ handleScroll: tool === "cursor", handleScale: tool === "cursor" });
  }, [api, tool]);

  // A live tick (e.g. NinjaTrader) moves the last candle between data reloads.
  useEffect(() => {
    const last = candles.at(-1);
    if (!api || !last || livePrice == null) return;
    const off = intraday ? -new Date().getTimezoneOffset() * 60 : 0;
    api.main.update({
      time: (last.time + off) as UTCTimestamp,
      open: last.open, high: Math.max(last.high, livePrice), low: Math.min(last.low, livePrice), close: livePrice,
    });
  }, [api, livePrice, candles, intraday]);

  // Esc cancels, Ctrl+Z undoes the last drawing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.key === "Escape") { setPending(null); setMeasure(null); setTool("cursor"); }
      if (e.key.toLowerCase() === "z" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setDrawings((d) => d.slice(0, -1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- project drawings to pixels (re-runs on every `ver` bump) ----
  const chart = api?.chart, main = api?.main;
  const ts = chart?.timeScale();
  const W = ts?.width() ?? 0;
  const H = chart?.paneSize(0).height ?? 0;
  const X = (t: number) => ts?.logicalToCoordinate(toLogical(t) as Logical) ?? null;
  const Y = (p: number) => main?.priceToCoordinate(p) ?? null;

  const bar = hover.idx != null ? candles[hover.idx] : candles.at(-1);
  const chg = bar ? bar.close - bar.open : 0;

  const svg: React.ReactNode[] = [];
  const seg = (a: Pt, b: Pt, extend: boolean, color: string, key: string, dashed = false) => {
    const x1 = X(a.t), y1 = Y(a.p), x2 = X(b.t), y2 = Y(b.p);
    if (x1 == null || y1 == null || x2 == null || y2 == null) return;
    let ex: number = x2, ey: number = y2;
    if (extend && x2 !== x1) { ex = W; ey = y1 + ((y2 - y1) * (W - x1)) / (x2 - x1); }
    svg.push(<line key={key} x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth={1.5} strokeDasharray={dashed ? "4 3" : undefined} />);
    svg.push(<circle key={key + "a"} cx={x1} cy={y1} r={2.5} fill={color} />, <circle key={key + "b"} cx={x2} cy={y2} r={2.5} fill={color} />);
  };
  if (chart && main) {
    drawings.forEach((d) => {
      if (d.kind === "hline") {
        const y = Y(d.a.p);
        if (y == null) return;
        svg.push(
          <g key={d.id}>
            <line x1={0} x2={W} y1={y} y2={y} stroke="#6cb8ff" strokeWidth={1} />
            <rect x={W - 78} y={y - 9} width={76} height={18} fill="#0c0c0b" stroke="#6cb8ff" />
            <text x={W - 40} y={y + 4} fill="#6cb8ff" fontSize={10} textAnchor="middle">{fmtPrice(symbol, d.a.p)}</text>
          </g>,
        );
      } else if (d.kind === "fib" && d.b) {
        const x1 = X(Math.min(d.a.t, d.b.t)) ?? 0;
        FIB.forEach((f) => {
          const p = d.b!.p + (d.a.p - d.b!.p) * f; // level 0 at the second click (the extreme you dragged to)
          const y = Y(p);
          if (y == null) return;
          svg.push(
            <g key={d.id + f}>
              <line x1={x1} x2={W} y1={y} y2={y} stroke={f === 0.5 || f === 0.618 ? "#ffb224" : "#b07a14"} strokeWidth={1} opacity={0.85} />
              <text x={x1 + 4} y={y - 3} fill="#ffb224" fontSize={10}>{(f * 100).toFixed(1)}% · {fmtPrice(symbol, p)}</text>
            </g>,
          );
        });
      } else if (d.b) {
        seg(d.a, d.b, d.kind === "ray", "#ffb224", d.id);
      }
    });

    // Auto trend channel: least squares over the last 50 closes, ±2σ, projected 10 bars ahead.
    if (ind.includes("chan") && candles.length >= 50) {
      const r = regression(candles.map((c) => c.close), 50);
      const start = candles.length - 50;
      const at = (k: number) => r.intercept + r.slope * k;
      const t0 = fromLogical(start), t1 = fromLogical(start + 59);
      const col = r.slope >= 0 ? "#3ddc84" : "#ff5c4d";
      seg({ t: t0, p: at(0) }, { t: t1, p: at(59) }, false, col, "chan-m", true);
      seg({ t: t0, p: at(0) + 2 * r.sigma }, { t: t1, p: at(59) + 2 * r.sigma }, false, col, "chan-u");
      seg({ t: t0, p: at(0) - 2 * r.sigma }, { t: t1, p: at(59) - 2 * r.sigma }, false, col, "chan-l");
    }

    // Preview of the tool in progress
    if (pending && hover.pt && tool !== "hline") {
      if (tool === "fib" || tool === "measure") {
        const x1 = X(pending.t), y1 = Y(pending.p), x2 = X(hover.pt.t), y2 = Y(hover.pt.p);
        if (x1 != null && y1 != null && x2 != null && y2 != null)
          svg.push(<rect key="pv" x={Math.min(x1, x2)} y={Math.min(y1, y2)} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} fill="#ffb224" opacity={0.08} stroke="#ffb224" strokeDasharray="3 3" />);
      } else seg(pending, hover.pt, tool === "ray", "#ffb224", "pv", true);
    }

    const m = measure ?? (tool === "measure" && pending && hover.pt ? { a: pending, b: hover.pt } : null);
    if (m) {
      const x1 = X(m.a.t), y1 = Y(m.a.p), x2 = X(m.b.t), y2 = Y(m.b.p);
      if (x1 != null && y1 != null && x2 != null && y2 != null) {
        const dp = m.b.p - m.a.p;
        const bars = Math.round(toLogical(m.b.t) - toLogical(m.a.t));
        const col = dp >= 0 ? "#3ddc84" : "#ff5c4d";
        svg.push(
          <g key="ms">
            <rect x={Math.min(x1, x2)} y={Math.min(y1, y2)} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} fill={col} opacity={0.12} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeDasharray="3 3" />
            <rect x={x2 + 6} y={y2 - 26} width={150} height={36} fill="#0c0c0b" stroke={col} />
            <text x={x2 + 12} y={y2 - 12} fill={col} fontSize={11}>{dp >= 0 ? "+" : ""}{fmtPrice(symbol, dp)} ({dp >= 0 ? "+" : ""}{fmt((dp / m.a.p) * 100, 2)}%)</text>
            <text x={x2 + 12} y={y2 + 3} fill="#918b7c" fontSize={10}>{bars} velas</text>
          </g>,
        );
      }
    }
  }

  const toggle = (k: Ind) => setInd((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));
  const activeTool = TOOLS.find((t) => t.id === tool)!;

  return (
    <div className="flex h-full flex-col" style={{ minHeight: 440 + (ind.includes("rsi") ? 110 : 0) + (ind.includes("macd") ? 110 : 0) }}>
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line px-1.5 py-1">
        <div role="toolbar" aria-label="Herramientas de dibujo" className="flex">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTool(t.id); setPending(null); if (t.id !== "measure") setMeasure(null); }}
              aria-pressed={tool === t.id}
              aria-label={t.label}
              title={`${t.label}: ${t.hint}`}
              className={`btn grid size-8 place-items-center ${tool === t.id ? "bg-amber text-black" : "text-muted hover:text-text"}`}
            >
              <t.icon size={15} />
            </button>
          ))}
          <span className="mx-1 w-px self-stretch bg-line" />
          <button onClick={() => setDrawings((d) => d.slice(0, -1))} disabled={!drawings.length} aria-label="Deshacer último dibujo" title="Deshacer (Ctrl+Z)" className="btn grid size-8 place-items-center text-muted hover:text-text disabled:opacity-30"><Undo2 size={15} /></button>
          <button onClick={() => { setDrawings([]); setMeasure(null); }} disabled={!drawings.length && !measure} aria-label="Borrar todos los dibujos" title="Borrar todo" className="btn grid size-8 place-items-center text-muted hover:text-down disabled:opacity-30"><Eraser size={15} /></button>
        </div>
        <div className="relative ml-auto">
          <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} className="btn h-8 border border-line-strong px-2.5 font-cond text-[12px] uppercase tracking-wider text-text hover:border-amber">
            Indicadores · {ind.length}
          </button>
          {menu && (
            <ul className="absolute right-0 top-full z-20 mt-1 w-52 origin-top-right border border-line-strong bg-panel py-1 shadow-[0_12px_32px_rgba(0,0,0,0.6)] view-in">
              {(Object.keys(IND_LABEL) as Ind[]).map((k) => (
                <li key={k}>
                  <label className="row-hover flex cursor-pointer items-center gap-2 px-3 py-1.5 text-[12px]">
                    <input type="checkbox" checked={ind.includes(k)} onChange={() => toggle(k)} className="accent-[var(--amber)]" />
                    {IND_COLOR[k] && <i className="inline-block h-0.5 w-3" style={{ background: IND_COLOR[k] }} />}
                    {IND_LABEL[k]}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Legend + chart + drawing layer */}
      <div className="relative min-h-0 flex-1" onClick={() => menu && setMenu(false)}>
        <div ref={box} className={`absolute inset-0 ${tool !== "cursor" ? "cursor-crosshair" : ""}`} />
        <svg className="pointer-events-none absolute left-0 top-0 z-[5] overflow-hidden" width={W} height={H} aria-hidden="true">{svg}</svg>
        {bar && (
          <div className="pointer-events-none absolute left-2 top-1.5 z-10 flex flex-wrap gap-x-2 text-[11px]">
            <span className="text-muted">A <span className="text-text">{fmtPrice(symbol, bar.open)}</span></span>
            <span className="text-muted">Máx <span className="text-text">{fmtPrice(symbol, bar.high)}</span></span>
            <span className="text-muted">Mín <span className="text-text">{fmtPrice(symbol, bar.low)}</span></span>
            <span className="text-muted">C <span className={chg >= 0 ? "up" : "down"}>{fmtPrice(symbol, bar.close)}</span></span>
            <span className={chg >= 0 ? "up" : "down"}>{chg >= 0 ? "+" : ""}{fmt((chg / bar.open) * 100, 2)}%</span>
          </div>
        )}
        {tool !== "cursor" && (
          <div className="pointer-events-none absolute bottom-8 left-2 z-10 border border-amber-dim bg-bg/90 px-2 py-1 text-[11px] text-amber">
            {activeTool.label}: {pending ? "clic en el segundo punto · Esc cancela" : activeTool.hint}
          </div>
        )}
      </div>
    </div>
  );
}
