"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/market";
import { Field, Panel, fmt, inputCls } from "./ui";
import { apiFetch } from "./keys";

type Def = {
  tool: string;
  title: string;
  note: string;
  fields: { k: string; label: string; type?: "select"; options?: string[]; text?: boolean }[];
  build: (v: Record<string, string>) => Record<string, unknown>;
  show: [string, string, (x: number) => string][];
};

const usd = (x: number) => `$${fmt(x, 2)}`;
const n2 = (x: number) => fmt(x, 2);
const n4 = (x: number) => fmt(x, 4);

const DEFS: Def[] = [
  {
    tool: "workflow.run_risk_reward",
    title: "Riesgo / beneficio",
    note: "Cuánto comprar para arriesgar un % fijo de tu cuenta, y qué ganas si llega al objetivo.",
    fields: [
      { k: "side", label: "Dirección", type: "select", options: ["long", "short"] },
      { k: "entry", label: "Entrada" }, { k: "stop", label: "Stop" }, { k: "target", label: "Objetivo" },
      { k: "balance", label: "Cuenta (USD)" }, { k: "risk", label: "Riesgo %" }, { k: "lev", label: "Apalancamiento" },
    ],
    build: (v) => ({ side: v.side, entry_price: +v.entry, stop_loss: +v.stop, take_profit: +v.target, account_balance: +v.balance, risk_pct: +v.risk, leverage: +v.lev || 1, fee_open_pct: 0, fee_close_pct: 0 }),
    show: [
      ["position_size", "Unidades", n4], ["notional", "Valor de la posición", usd], ["risk_amount", "Riesgo", usd],
      ["pnl_at_stop", "Resultado en stop", usd], ["pnl_at_target", "Resultado en objetivo", usd], ["risk_reward_ratio", "Ratio R:B", n2],
    ],
  },
  {
    tool: "workflow.run_position_sizing",
    title: "Tamaño de posición",
    note: "Cuántas unidades comprar para no perder más de una cifra en dólares si toca el stop.",
    fields: [
      { k: "side", label: "Dirección", type: "select", options: ["long", "short"] },
      { k: "entry", label: "Entrada" }, { k: "stop", label: "Stop" }, { k: "riskUsd", label: "Pérdida máx. (USD)" },
    ],
    build: (v) => ({ side: v.side, entryPrice: +v.entry, stopLoss: +v.stop, riskUsdt: +v.riskUsd, feeOpenPct: 0, feeClosePct: 0 }),
    show: [["sizeBase", "Unidades", n4], ["sizeQuote", "Valor (USD)", usd], ["stopDistPct", "Distancia al stop %", n2]],
  },
  {
    tool: "workflow.run_black_scholes",
    title: "Opciones · Black-Scholes",
    note: "Precio teórico y griegas de una opción europea. La volatilidad es la implícita que tú supongas.",
    fields: [
      { k: "spot", label: "Precio subyacente" }, { k: "strike", label: "Strike" }, { k: "days", label: "Días al vencimiento" },
      { k: "vol", label: "Volatilidad %" }, { k: "rate", label: "Tasa libre de riesgo %" }, { k: "div", label: "Dividendo %" },
    ],
    build: (v) => ({ spot: +v.spot, strike: +v.strike, daysToExpiry: +v.days, volatilityPct: +v.vol, riskFreeRatePct: +v.rate || 0, dividendYieldPct: +v.div || 0 }),
    show: [
      ["callPriceUsd", "Call", usd], ["putPriceUsd", "Put", usd], ["deltaCall", "Delta call", n4], ["deltaPut", "Delta put", n4],
      ["gamma", "Gamma", n4], ["vegaPerPct", "Vega (por 1%)", n4], ["thetaCallPerDay", "Theta call / día", n4], ["thetaPutPerDay", "Theta put / día", n4],
    ],
  },
  {
    tool: "workflow.run_forex_pip_value",
    title: "Forex · valor del pip",
    note: "Lote estándar 100.000 · mini 10.000 · micro 1.000.",
    fields: [{ k: "pair", label: "Par (BASE/COTIZ.)", text: true }, { k: "units", label: "Unidades" }],
    build: (v) => ({ pair: v.pair.toUpperCase(), units: +v.units }),
    show: [["pipSize", "Tamaño del pip", (x) => String(x)], ["pipValueQuote", "Valor del pip (moneda cotizada)", n2]],
  },
];

export default function Calc({ symbol }: { symbol: string }) {
  const [spot, setSpot] = useState<number | null>(null);
  useEffect(() => {
    apiFetch(`/api/quotes?s=${encodeURIComponent(symbol)}`).then((r) => r.json()).then((q: Quote[]) => setSpot(q?.[0]?.price ?? null)).catch(() => {});
  }, [symbol]);

  const p = spot ?? 100;
  const r = (x: number) => String(Number(x.toPrecision(6)));
  const defaults: Record<string, Record<string, string>> = {
    "workflow.run_risk_reward": { side: "long", entry: r(p), stop: r(p * 0.98), target: r(p * 1.04), balance: "10000", risk: "1", lev: "1" },
    "workflow.run_position_sizing": { side: "long", entry: r(p), stop: r(p * 0.98), riskUsd: "100" },
    "workflow.run_black_scholes": { spot: r(p), strike: r(Math.round(p)), days: "30", vol: "25", rate: "4", div: "0" },
    "workflow.run_forex_pip_value": { pair: "EUR/USD", units: "100000" },
  };

  return (
    <div className="grid gap-1.5 sm:gap-2 lg:grid-cols-2">
      <p className="border border-line bg-panel px-3 py-2 text-[12px] text-muted lg:col-span-2">
        Valores iniciales tomados de <span className="text-amber">{symbol}</span>{spot ? ` (${fmt(spot, 4)})` : ""}. Los cálculos los hace TradingCalc, sin comisiones.
      </p>
      {DEFS.map((d) => <CalcCard key={d.tool + symbol + (spot ?? "")} def={d} initial={defaults[d.tool]} />)}
    </div>
  );
}

function CalcCard({ def, initial }: { def: Def; initial: Record<string, string> }) {
  const [v, setV] = useState(initial);
  const [out, setOut] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await apiFetch("/api/calc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool: def.tool, args: def.build(v) }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setOut(j.data);
    } catch (e) {
      setErr((e as Error).message); setOut(null);
    } finally { setBusy(false); }
  };

  return (
    <Panel title={def.title}>
      <form onSubmit={go} className="p-3">
        <p className="mb-3 text-[12px] text-muted">{def.note}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {def.fields.map((f) => (
            <Field key={f.k} label={f.label}>
              {f.type === "select" ? (
                <select value={v[f.k]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} className={inputCls}>
                  {f.options!.map((o) => <option key={o} value={o}>{o === "long" ? "Compra (long)" : "Venta (short)"}</option>)}
                </select>
              ) : (
                <input type={f.text ? "text" : "number"} step="any" value={v[f.k]} onChange={(e) => setV({ ...v, [f.k]: e.target.value })} className={inputCls} required />
              )}
            </Field>
          ))}
        </div>
        <button type="submit" disabled={busy} className="btn mt-3 h-9 border border-amber px-4 font-cond text-[12px] uppercase tracking-wider text-amber hover:bg-amber hover:text-black disabled:opacity-50">
          {busy ? "Calculando…" : "Calcular"}
        </button>
        {err && <p className="mt-2 text-[12px] text-down">{err}</p>}
        {out && (
          <dl className="mt-3 grid grid-cols-2 border-t border-line">
            {def.show.map(([k, label, f]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-line/60 py-1.5 pr-2">
                <dt className="text-[12px] text-muted">{label}</dt>
                <dd className={typeof out[k] === "number" && (out[k] as number) < 0 ? "down" : ""}>{typeof out[k] === "number" ? f(out[k] as number) : "—"}</dd>
              </div>
            ))}
          </dl>
        )}
      </form>
    </Panel>
  );
}
