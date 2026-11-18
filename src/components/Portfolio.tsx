"use client";

import { useState } from "react";
import type { Quote } from "@/lib/market";
import { Panel, dir, fmt, fmtPrice, pct, usePoll } from "./ui";

export type Order = { t: number; side: "BUY" | "SELL"; symbol: string; qty: number; price: number; realized: number };
export type Paper = { start: number; cash: number; positions: Record<string, { qty: number; avg: number }>; orders: Order[] };

export const emptyPaper: Paper = { start: 100_000, cash: 100_000, positions: {}, orders: [] };

/** Long-only paper engine. Prices are taken as USD (simplification for non-USD quotes). */
export function placeOrder(p: Paper, side: "BUY" | "SELL", symbol: string, qty: number, price: number): { paper: Paper } | { error: string } {
  const pos = p.positions[symbol] ?? { qty: 0, avg: 0 };
  if (side === "BUY") {
    const cost = qty * price;
    if (cost > p.cash + 1e-9) return { error: `Efectivo insuficiente: necesitas $${fmt(cost, 2)}, tienes $${fmt(p.cash, 2)}` };
    const nq = pos.qty + qty;
    return {
      paper: {
        ...p,
        cash: p.cash - cost,
        positions: { ...p.positions, [symbol]: { qty: nq, avg: (pos.qty * pos.avg + cost) / nq } },
        orders: [{ t: Date.now(), side, symbol, qty, price, realized: 0 }, ...p.orders].slice(0, 300),
      },
    };
  }
  if (qty > pos.qty + 1e-9) return { error: `Solo tienes ${fmt(pos.qty, 4)} de ${symbol} (la cartera simulada no permite ventas en corto)` };
  const realized = (price - pos.avg) * qty;
  const rest = { ...p.positions };
  const left = pos.qty - qty;
  if (left <= 1e-9) delete rest[symbol];
  else rest[symbol] = { qty: left, avg: pos.avg };
  return {
    paper: {
      ...p,
      cash: p.cash + qty * price,
      positions: rest,
      orders: [{ t: Date.now(), side, symbol, qty, price, realized }, ...p.orders].slice(0, 300),
    },
  };
}

export default function Portfolio({
  paper, onReset, onPick, onTrade,
}: {
  paper: Paper;
  onReset: () => void;
  onPick: (s: string) => void;
  onTrade: (side: "BUY" | "SELL", qty: number, s: string) => void;
}) {
  const syms = Object.keys(paper.positions);
  const { data } = usePoll<Quote[]>(syms.length ? `/api/quotes?s=${encodeURIComponent(syms.join(","))}` : null, 15_000);
  const [confirm, setConfirm] = useState(false);

  const rows = syms.map((s) => {
    const pos = paper.positions[s];
    const q = data?.find((x) => x.symbol === s);
    const last = q?.price ?? pos.avg;
    const value = last * pos.qty;
    const pnl = (last - pos.avg) * pos.qty;
    return { s, pos, q, last, value, pnl, pnlPct: ((last - pos.avg) / pos.avg) * 100 };
  });
  const invested = rows.reduce((a, r) => a + r.value, 0);
  const equity = paper.cash + invested;
  const unreal = rows.reduce((a, r) => a + r.pnl, 0);
  const realized = paper.orders.reduce((a, o) => a + o.realized, 0);
  const total = equity - paper.start;

  return (
    <div className="grid gap-1.5 sm:gap-2">
      <div className="grid grid-cols-2 border border-line bg-panel md:grid-cols-5">
        {[
          ["Patrimonio", `$${fmt(equity, 2)}`, ""],
          ["Resultado total", `${total >= 0 ? "+" : "−"}$${fmt(Math.abs(total), 2)}`, dir(total)],
          ["Rentabilidad", pct((total / paper.start) * 100), dir(total)],
          ["No realizado", `${unreal >= 0 ? "+" : "−"}$${fmt(Math.abs(unreal), 2)}`, dir(unreal)],
          ["Efectivo", `$${fmt(paper.cash, 2)}`, ""],
        ].map(([k, v, c]) => (
          <div key={k} className="border-b border-r border-line/60 px-3 py-2 md:border-b-0">
            <div className="font-cond text-[11px] uppercase tracking-wider text-muted">{k}</div>
            <div className={`text-[18px] ${c}`}>{v}</div>
          </div>
        ))}
      </div>

      <Panel
        title={`Posiciones (${rows.length})`}
        right={<span>Cartera simulada · empieza con $100.000 · realizado {realized >= 0 ? "+" : "−"}${fmt(Math.abs(realized), 2)}</span>}
      >
        {rows.length === 0 ? (
          <p className="p-3 text-muted">Sin posiciones. Escribe <span className="text-amber">COMPRAR 10 AAPL</span> en la línea de comandos, o usa la caja de órdenes en la ficha de un símbolo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[12px]">
              <thead>
                <tr className="font-cond text-[10px] uppercase tracking-wider text-muted">
                  {["Símbolo", "Cantidad", "Precio medio", "Último", "Valor", "Resultado", "%", "Peso", ""].map((h, i) => (
                    <th key={i} scope="col" className={`px-2 py-1 font-normal ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.s} className="row-hover border-t border-line/60">
                    <td className="px-2 py-1.5"><button onClick={() => onPick(r.s)} className="text-amber">{r.s}</button></td>
                    <td className="px-2 py-1.5 text-right">{fmt(r.pos.qty, r.pos.qty % 1 ? 4 : 0)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtPrice(r.s, r.pos.avg)}</td>
                    <td className="px-2 py-1.5 text-right">{fmtPrice(r.s, r.last)}</td>
                    <td className="px-2 py-1.5 text-right">${fmt(r.value, 2)}</td>
                    <td className={`px-2 py-1.5 text-right ${dir(r.pnl)}`}>{r.pnl >= 0 ? "+" : "−"}${fmt(Math.abs(r.pnl), 2)}</td>
                    <td className={`px-2 py-1.5 text-right ${dir(r.pnlPct)}`}>{pct(r.pnlPct)}</td>
                    <td className="px-2 py-1.5 text-right">{fmt((r.value / equity) * 100, 1)}%</td>
                    <td className="px-2 py-1.5 text-right">
                      <button onClick={() => onTrade("SELL", r.pos.qty, r.s)} className="btn h-7 border border-line-strong px-2 text-[11px] text-muted hover:border-down hover:text-down">Cerrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Historial de órdenes"
        right={
          confirm ? (
            <span className="flex items-center gap-2">
              ¿Borrar todo y volver a $100.000?
              <button onClick={() => { onReset(); setConfirm(false); }} className="btn text-down">Sí, reiniciar</button>
              <button onClick={() => setConfirm(false)} className="btn text-text">No</button>
            </span>
          ) : (
            <button onClick={() => setConfirm(true)} className="btn text-muted hover:text-down">Reiniciar cartera</button>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[12px]">
            <tbody>
              {paper.orders.map((o) => (
                <tr key={o.t + o.symbol} className="border-t border-line/60">
                  <td className="px-2 py-1.5 text-muted">{new Date(o.t).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className={`px-2 py-1.5 ${o.side === "BUY" ? "up" : "down"}`}>{o.side === "BUY" ? "COMPRA" : "VENTA"}</td>
                  <td className="px-2 py-1.5 text-amber">{o.symbol}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(o.qty, o.qty % 1 ? 4 : 0)}</td>
                  <td className="px-2 py-1.5 text-right">@ {fmtPrice(o.symbol, o.price)}</td>
                  <td className={`px-2 py-1.5 text-right ${o.side === "SELL" ? dir(o.realized) : "text-muted"}`}>
                    {o.side === "SELL" ? `${o.realized >= 0 ? "+" : "−"}$${fmt(Math.abs(o.realized), 2)}` : ""}
                  </td>
                </tr>
              ))}
              {paper.orders.length === 0 && <tr><td className="p-3 text-muted">Todavía no hay órdenes.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
