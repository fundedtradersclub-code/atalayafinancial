"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import type { Analysis } from "@/lib/indicators";
import type { TrendReport } from "@/lib/trend";
import { Panel, SourceTag, Sparkline, fmt, fmtPrice, pct, usePoll } from "./ui";

type BoardRow = {
  symbol: string; name: string; last: number | null; chg20: number | null;
  daily: { score: number; trend: string; rsi: number | null } | null;
  weekly: { score: number; trend: string } | null;
  spark: number[];
};

const tone = (s: number) => (s >= 35 ? "up" : s <= -35 ? "down" : "text-amber");

export default function TrendView({ symbol, watch, onPick }: { symbol: string; watch: string[]; onPick: (s: string) => void }) {
  const { data, error, loading } = usePoll<TrendReport>(`/api/trend?s=${encodeURIComponent(symbol)}`, 300_000);
  const board = usePoll<BoardRow[]>(`/api/trend-board?s=${encodeURIComponent(watch.join(","))}`, 600_000);

  return (
    <div className="grid gap-1.5 sm:gap-2">
      <p className="border border-amber-dim/50 bg-panel px-3 py-2 text-[12px] text-muted">
        Lectura técnica de precios pasados por votos de 8 señales. Describe la tendencia de hoy; <span className="text-amber">no predice el futuro</span> y puede cambiar con la siguiente vela.
      </p>

      {/* Consensus strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-line bg-panel px-3 py-2">
        <div>
          <h1 className="font-cond text-[20px] font-semibold text-amber">{symbol}</h1>
          <p className="text-[12px] text-muted">{data?.name ?? (loading ? "Analizando 3 marcos de tiempo…" : "")}</p>
        </div>
        {data && (
          <>
            <div className="min-w-[220px] flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-cond text-[11px] uppercase tracking-wider text-muted">Consenso ponderado</span>
                <span className={`text-[16px] ${tone(data.consensus.score)}`}>{data.consensus.label} · {data.consensus.score > 0 ? "+" : ""}{data.consensus.score}</span>
              </div>
              <Gauge score={data.consensus.score} />
            </div>
            {data.hurst && (
              <div className="max-w-[360px]">
                <div className="font-cond text-[11px] uppercase tracking-wider text-muted">Hurst (TradingCalc) · {fmt(data.hurst.h, 3)}</div>
                <p className="text-[12px]">{data.hurst.reading}</p>
              </div>
            )}
            <div className="text-[11px]"><SourceTag live={data.live} /></div>
          </>
        )}
      </div>

      {error && <p className="border border-down/40 bg-panel p-2 text-down">{error}</p>}

      <div className="grid gap-1.5 sm:gap-2 xl:grid-cols-3">
        {(data?.frames ?? [{ id: "a", label: "Intradía" }, { id: "b", label: "Diario" }, { id: "c", label: "Semanal" }]).map((f) => (
          <Frame key={f.id} label={f.label} sub={"bar" in f ? `${f.bar} · horizonte ${f.horizon}` : ""} a={"a" in f ? f.a : null} symbol={symbol} loading={loading} />
        ))}
      </div>

      <Panel title="Tendencia del mercado · diario y semanal" right={<span>clic para analizar</span>}>
        {board.loading && <p className="p-3 text-muted">Analizando unos 20 mercados… la primera vez tarda unos segundos.</p>}
        {board.data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[12px]">
              <thead>
                <tr className="font-cond text-[10px] uppercase tracking-wider text-muted">
                  {["Mercado", "Último", "20 días", "Diario", "Semanal", "RSI", "3 meses"].map((h, i) => (
                    <th key={h} scope="col" className={`px-2 py-1 font-normal ${i === 0 ? "text-left" : i >= 3 && i <= 4 ? "text-center" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.data.map((r) => (
                  <tr key={r.symbol} onClick={() => onPick(r.symbol)} className="row-hover cursor-pointer border-t border-line/60">
                    <td className="px-2 py-1.5">
                      <button className="text-left" onClick={(e) => { e.stopPropagation(); onPick(r.symbol); }}>
                        <span className="text-amber">{r.name}</span> <span className="text-[10px] text-muted">{r.symbol}</span>
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-right">{fmtPrice(r.symbol, r.last)}</td>
                    <td className={`px-2 py-1.5 text-right ${r.chg20 == null ? "" : r.chg20 >= 0 ? "up" : "down"}`}>{pct(r.chg20)}</td>
                    <td className="px-2 py-1.5"><ScoreCell s={r.daily?.score} /></td>
                    <td className="px-2 py-1.5"><ScoreCell s={r.weekly?.score} /></td>
                    <td className={`px-2 py-1.5 text-right ${r.daily?.rsi == null ? "" : r.daily.rsi > 70 || r.daily.rsi < 30 ? "text-amber" : ""}`}>{fmt(r.daily?.rsi, 0)}</td>
                    <td className="px-2 py-1"><div className="flex justify-end"><Sparkline data={r.spark} up={(r.chg20 ?? 0) >= 0} w={90} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Gauge({ score }: { score: number }) {
  const p = (score + 100) / 2;
  return (
    <div className="relative mt-1 h-2 bg-[linear-gradient(90deg,var(--down),#3a2f22_45%,#3a2f22_55%,var(--up))]" role="meter" aria-valuemin={-100} aria-valuemax={100} aria-valuenow={score} aria-label="Puntaje de tendencia">
      <div className="absolute -top-1 h-4 w-1 bg-text" style={{ left: `calc(${p}% - 2px)` }} />
    </div>
  );
}

function ScoreCell({ s }: { s: number | undefined }) {
  if (s == null) return <span className="block text-center text-muted">—</span>;
  const Icon = s >= 35 ? ArrowUpRight : s <= -35 ? ArrowDownRight : ArrowRight;
  return (
    <span className={`flex items-center justify-center gap-1 ${tone(s)}`}>
      <Icon size={13} aria-hidden="true" />
      <span className="w-9 text-right">{s > 0 ? "+" : ""}{s}</span>
      <span className="sr-only">{s >= 35 ? "alcista" : s <= -35 ? "bajista" : "lateral"}</span>
    </span>
  );
}

function Frame({ label, sub, a, symbol, loading }: { label: string; sub: string; a: Analysis | null; symbol: string; loading: boolean }) {
  return (
    <Panel title={label} right={a ? <span className={tone(a.score)}>{a.trend} · {a.strength}</span> : null}>
      {!a ? (
        <p className="p-3 text-muted">{loading ? "Calculando…" : "Historial insuficiente para este marco."}</p>
      ) : (
        <div className="p-2">
          <p className="mb-1 text-[11px] text-muted">{sub}</p>
          <div className="mb-2 flex items-baseline justify-between">
            <span className={`text-[22px] ${tone(a.score)}`}>{a.score > 0 ? "+" : ""}{a.score}</span>
            <span className="text-[11px] text-muted">ATR {fmt(a.atrPct, 2)}% por vela</span>
          </div>
          <Gauge score={a.score} />
          <MiniChart a={a} symbol={symbol} />
          <ul className="mt-2">
            {a.signals.map((s) => (
              <li key={s.name} className="grid grid-cols-[16px_1fr_auto] items-start gap-2 border-t border-line/60 py-1.5 text-[12px]">
                <span className={`mt-0.5 ${s.vote > 0 ? "up" : s.vote < 0 ? "down" : "text-muted"}`} aria-label={s.vote > 0 ? "a favor de alza" : s.vote < 0 ? "a favor de baja" : "neutral"}>
                  {s.vote > 0 ? <Plus size={13} /> : s.vote < 0 ? <Minus size={13} /> : <span className="text-[11px]">·</span>}
                </span>
                <span>
                  {s.name}
                  {s.why && <span className="block text-[11px] text-muted">{s.why}</span>}
                </span>
                <span className="text-right text-[11px]">{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/** Closes, 20/50 averages, last-20 regression channel projected 10 bars ahead, support/resistance. */
function MiniChart({ a, symbol }: { a: Analysis; symbol: string }) {
  const { closes, sma20, sma50, reg } = a.chart;
  const total = closes.length + reg.ahead;
  const regAt = (k: number) => reg.intercept + reg.slope * k; // k = bars since regression start
  const lastK = closes.length - 1 - reg.from;
  const k0 = 0, k1 = lastK + reg.ahead;
  const vals = [...closes, a.support, a.resistance, regAt(k1) + 2 * reg.sigma, regAt(k1) - 2 * reg.sigma, regAt(0) + 2 * reg.sigma, regAt(0) - 2 * reg.sigma];
  const min = Math.min(...vals), max = Math.max(...vals);
  const W = 420, H = 150, P = 4;
  const x = (i: number) => P + (i / (total - 1)) * (W - 2 * P);
  const y = (v: number) => P + (1 - (v - min) / (max - min || 1)) * (H - 2 * P);
  const path = (arr: (number | null)[]) =>
    arr.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ");
  const band = [
    [x(reg.from + k0), y(regAt(k0) + 2 * reg.sigma)], [x(reg.from + k1), y(regAt(k1) + 2 * reg.sigma)],
    [x(reg.from + k1), y(regAt(k1) - 2 * reg.sigma)], [x(reg.from + k0), y(regAt(k0) - 2 * reg.sigma)],
  ].map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const up = reg.slope >= 0;
  return (
    <figure className="mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full border border-line bg-bg" role="img" aria-label={`Precio de ${symbol} con medias móviles y canal de regresión proyectado`}>
        <line x1={P} x2={W - P} y1={y(a.resistance)} y2={y(a.resistance)} stroke="var(--down)" strokeOpacity="0.35" strokeDasharray="2 3" />
        <line x1={P} x2={W - P} y1={y(a.support)} y2={y(a.support)} stroke="var(--up)" strokeOpacity="0.35" strokeDasharray="2 3" />
        <line x1={x(closes.length - 1)} x2={x(closes.length - 1)} y1={P} y2={H - P} stroke="var(--line-strong)" />
        <polygon points={band} fill={up ? "var(--up)" : "var(--down)"} opacity="0.08" />
        <line x1={x(reg.from)} y1={y(regAt(0))} x2={x(reg.from + k1)} y2={y(regAt(k1))} stroke={up ? "var(--up)" : "var(--down)"} strokeDasharray="4 3" strokeWidth="1.25" />
        <polyline points={path(sma50)} fill="none" stroke="var(--info)" strokeWidth="1" opacity="0.8" />
        <polyline points={path(sma20)} fill="none" stroke="var(--amber)" strokeWidth="1" opacity="0.85" />
        <polyline points={path(closes)} fill="none" stroke="var(--text)" strokeWidth="1.25" />
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted">
        <span><i className="mr-1 inline-block h-px w-3 bg-text align-middle" />precio</span>
        <span><i className="mr-1 inline-block h-px w-3 bg-amber align-middle" />media 20</span>
        <span><i className="mr-1 inline-block h-px w-3 bg-info align-middle" />media 50</span>
        <span>- - canal ±2σ extendido 10 velas (si nada cambia)</span>
        <span>S {fmtPrice(symbol, a.support)} · R {fmtPrice(symbol, a.resistance)}</span>
      </figcaption>
    </figure>
  );
}
