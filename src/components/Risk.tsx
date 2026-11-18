"use client";

import { useState } from "react";
import { Panel, fmt, inputCls, pct, usePoll } from "./ui";

type Num = Record<string, number>;
type RiskData = { symbol: string; n: number; periods: number; returns: number[]; tearsheet: Num; var95: Num; var99: Num; signedAt: string | null };

export default function Risk({ symbol }: { symbol: string }) {
  const { data, error, loading } = usePoll<RiskData>(`/api/risk?s=${encodeURIComponent(symbol)}`, 0);
  const [size, setSize] = useState("10000");
  const pos = Number(size) || 0;

  if (loading) return <Panel title={`Riesgo · ${symbol}`}><p className="p-3 text-muted">Bajando un año de precios y calculando con TradingCalc…</p></Panel>;
  if (error || !data) return <Panel title={`Riesgo · ${symbol}`}><p className="p-3 text-down">{error ?? "Sin datos"}</p></Panel>;

  const t = data.tearsheet;
  const metrics: [string, string, string][] = [
    ["Rendimiento anualizado", pct(t.annualized_return * 100), "Si el último año se repitiera tal cual"],
    ["Volatilidad anualizada", pct(t.annualized_volatility * 100).replace("+", ""), "Cuánto se mueve el precio en un año típico"],
    ["Sharpe (Lo, ajustado)", fmt(t.sharpe_annualized_lo, 2), "Rendimiento por unidad de riesgo, corregido por autocorrelación"],
    ["Sortino", fmt(t.sortino_annualized, 2), "Como Sharpe, pero solo castiga las caídas"],
    ["Caída máxima", pct(t.max_drawdown * 100), "Peor caída desde un máximo en el periodo"],
    ["Calmar", fmt(t.calmar, 2), "Rendimiento anual ÷ caída máxima"],
    ["% de días al alza", pct(t.win_rate * 100).replace("+", ""), ""],
    ["Mejor día", pct(t.best_period * 100), ""],
    ["Peor día", pct(t.worst_period * 100), ""],
    ["Asimetría", fmt(t.skewness, 2), "Negativa = caídas fuertes más frecuentes que subidas fuertes"],
    ["Curtosis", fmt(t.kurtosis, 2), "Alta = días extremos más comunes de lo normal"],
    ["PSR", pct(t.psr * 100).replace("+", ""), "Probabilidad de que el Sharpe real sea mayor que 0"],
  ];

  return (
    <div className="grid gap-1.5 sm:gap-2 lg:grid-cols-[1fr_360px]">
      <Panel title={`Riesgo · ${symbol} · ${data.n} días`} right={<span>TradingCalc{data.signedAt ? " · firmado" : ""}</span>}>
        <dl className="grid sm:grid-cols-2">
          {metrics.map(([k, v, hint]) => (
            <div key={k} className="border-b border-line/60 px-3 py-2 sm:odd:border-r">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-cond text-[11px] uppercase tracking-wider text-muted">{k}</dt>
                <dd className={`text-[15px] ${v.startsWith("-") ? "down" : ""}`}>{v}</dd>
              </div>
              {hint && <p className="mt-0.5 text-[11px] text-muted/80">{hint}</p>}
            </div>
          ))}
        </dl>
      </Panel>

      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Panel title="Valor en riesgo · 1 día" className="shrink-0">
          <div className="p-3">
            <label className="block">
              <span className="font-cond text-[11px] uppercase tracking-wider text-muted">Tamaño de la posición (USD)</span>
              <input type="number" min="0" value={size} onChange={(e) => setSize(e.target.value)} className={`${inputCls} mt-1`} />
            </label>
            <table className="mt-3 w-full text-[12px]">
              <thead>
                <tr className="font-cond text-[10px] uppercase tracking-wider text-muted">
                  <th scope="col" className="text-left font-normal">Confianza</th>
                  <th scope="col" className="text-right font-normal">VaR</th>
                  <th scope="col" className="text-right font-normal">CVaR</th>
                </tr>
              </thead>
              <tbody>
                {[["95%", data.var95], ["99%", data.var99]].map(([k, v]) => {
                  const r = v as Num;
                  return (
                    <tr key={k as string} className="border-t border-line/60">
                      <th scope="row" className="py-1.5 text-left font-normal">{k as string}</th>
                      <td className="py-1.5 text-right down">−${fmt(r.var * pos, 0)}<span className="block text-[10px] text-muted">{fmt(r.var * 100, 2)}%</span></td>
                      <td className="py-1.5 text-right down">−${fmt(r.cvar * pos, 0)}<span className="block text-[10px] text-muted">{fmt(r.cvar * 100, 2)}%</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              VaR 95%: en 19 de cada 20 días la pérdida no debería pasar de esa cifra. CVaR: la pérdida promedio en el día malo restante. Supone que el
              próximo año se parece al último, y casi nunca es así.
            </p>
          </div>
        </Panel>
        <Panel title="Distribución de retornos diarios" className="shrink-0">
          <Histogram returns={data.returns} var95={-data.var95.var} />
        </Panel>
      </div>
    </div>
  );
}

function Histogram({ returns, var95 }: { returns: number[]; var95: number }) {
  const bins = 31;
  const lim = Math.max(...returns.map(Math.abs)) || 0.01;
  const counts = new Array(bins).fill(0);
  for (const r of returns) counts[Math.min(bins - 1, Math.floor(((r + lim) / (2 * lim)) * bins))]++;
  const max = Math.max(...counts);
  const W = 340, H = 120, bw = W / bins;
  const varX = ((var95 + lim) / (2 * lim)) * W;
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="block w-full p-2" role="img" aria-label="Histograma de retornos diarios con la línea del VaR al 95%">
      {counts.map((c, i) => {
        const h = (c / max) * H;
        const mid = -lim + (i + 0.5) * ((2 * lim) / bins);
        return <rect key={i} x={i * bw + 0.5} y={H - h} width={bw - 1} height={h} fill={mid < 0 ? "var(--down)" : "var(--up)"} opacity={0.65} />;
      })}
      <line x1={varX} x2={varX} y1={0} y2={H} stroke="var(--amber)" strokeDasharray="3 3" />
      <text x={varX + 3} y={10} fill="var(--amber)" fontSize="9">VaR 95%</text>
      <text x={0} y={H + 12} fill="var(--muted)" fontSize="9">{fmt(-lim * 100, 1)}%</text>
      <text x={W / 2} y={H + 12} fill="var(--muted)" fontSize="9" textAnchor="middle">0</text>
      <text x={W} y={H + 12} fill="var(--muted)" fontSize="9" textAnchor="end">+{fmt(lim * 100, 1)}%</text>
    </svg>
  );
}
