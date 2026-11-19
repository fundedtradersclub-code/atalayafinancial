"use client";

import { useEffect, useState } from "react";

// Reads the visitor's own MetaTrader 5 through the bridge running on THEIR computer
// (connectors/mt5_bridge.py, http://127.0.0.1:8778). Browser -> loopback only: the data never
// reaches ATALAYA's server, so it works the same in the public site and in a personal install.

export const MT5_URL = "http://127.0.0.1:8778";

export type Mt5Quote = { name: string; broker: string; last: number; bid: number; ask: number; high: number | null; low: number | null; prevClose: number | null; time: number };
type State = { at: number; server: string; quotes: Record<string, Mt5Quote> } | null;

let state: State = null;
let started = false;

export function startMt5() {
  if (started) return;
  started = true;
  const tick = async () => {
    let next = 1000;
    try {
      const r = await fetch(`${MT5_URL}/quotes`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      const j = await r.json();
      state = j.ok ? { at: Date.now(), server: j.server ?? "", quotes: j.quotes ?? {} } : null;
      if (!state) next = 10_000;
    } catch {
      state = null;
      next = 10_000; // bridge not running: check back calmly
    }
    window.dispatchEvent(new Event("atalaya-mt5"));
    setTimeout(tick, next);
  };
  tick();
}

/** Fresh snapshot (under 5 s old) or null. */
export function mt5(): State {
  return state && Date.now() - state.at < 5000 ? state : null;
}

type Q = { symbol: string; name: string; price: number | null; prevClose: number | null; change: number | null; changePct: number | null; live: boolean; time: number | null; source?: string };

/** Overlay MetaTrader 5 prices on currencies (EURUSD=X…) and broker instruments (MT5:XAUUSD…). */
export function mergeMt5<T extends Q>(rows: T[]): T[] {
  const m = mt5();
  if (!m) return rows;
  return rows.map((q) => {
    const x = m.quotes[q.symbol];
    if (!x) return q;
    const prev = x.prevClose ?? q.prevClose;
    const change = prev ? x.last - prev : null;
    return { ...q, name: q.name === q.symbol ? x.name : q.name, price: x.last, prevClose: prev, change, changePct: change != null && prev ? (change / prev) * 100 : null, live: true, time: Math.floor(x.time / 1000), source: "MetaTrader 5" };
  });
}

const TF: Record<string, [string, number]> = {
  "1m": ["M1", 2000], "5m": ["M5", 2000], "15m": ["M15", 2000], "30m": ["M30", 2000], "1h": ["H1", 2000], "4h": ["H4", 1500],
  "1d": ["D1", 1000], "1w": ["W1", 600], "1mo": ["MN1", 300],
  "1D": ["M5", 288], "5D": ["M15", 480], "1M": ["H1", 500], "6M": ["D1", 130], "1A": ["D1", 260], "5A": ["W1", 260],
};

/** Chart data for an MT5 instrument, shaped like ATALAYA's /api/chart answer. */
export async function mt5Chart(symbol: string, interval: string) {
  const m = mt5();
  const q = m?.quotes[symbol];
  if (!m || !q) return null;
  const [tf, count] = TF[interval] ?? TF["1d"];
  const r = await fetch(`${MT5_URL}/bars?symbol=${encodeURIComponent(symbol)}&tf=${tf}&count=${count}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const j = await r.json();
  if (!j.ok) return null;
  const bars = j.bars as { time: number; open: number; high: number; low: number; close: number; volume: number }[];
  const daily = ["1d", "6M", "1A"].includes(interval);
  const year = daily ? bars.slice(-252) : [];
  const fx = /^([A-Z]{3})([A-Z]{3})=X$/.exec(symbol);
  return {
    symbol, name: q.name, currency: fx ? fx[2] : "USD", exchange: `MetaTrader 5 · ${m.server} · ${q.broker}`, type: fx ? "CURRENCY" : "CFD", live: true,
    candles: bars,
    stats: {
      price: q.last, prevClose: q.prevClose, open: daily ? bars.at(-1)?.open ?? null : null, dayHigh: q.high, dayLow: q.low, volume: null,
      high52: year.length ? Math.max(...year.map((c) => c.high)) : null, low52: year.length ? Math.min(...year.map((c) => c.low)) : null,
    },
  };
}


/** React view of the visitor's MetaTrader 5 bridge (re-renders on each poll). */
export function useMt5() {
  const [snap, setSnap] = useState(mt5);
  useEffect(() => {
    const on = () => setSnap(mt5());
    window.addEventListener("atalaya-mt5", on);
    return () => window.removeEventListener("atalaya-mt5", on);
  }, []);
  return snap;
}
