"use client";

// Reads live prices from the AtalayaBridge NinjaScript indicator running on THIS computer.
// Browser -> 127.0.0.1 only: the data never touches ATALAYA's server (personal use).

export type NinjaQuote = { name: string; last: number; bid: number | null; ask: number | null; high: number | null; low: number | null; prevClose: number | null; volume: number; time: number };
type State = { at: number; quotes: Record<string, NinjaQuote> } | null;

export const NINJA_URL = "http://127.0.0.1:8777/quotes";
let state: State = null;
let started = false;

export function startNinja() {
  if (started) return;
  started = true;
  const tick = async () => {
    let next = 1000;
    try {
      const r = await fetch(NINJA_URL, { cache: "no-store", signal: AbortSignal.timeout(900) });
      const j = await r.json();
      state = { at: Date.now(), quotes: j.quotes ?? {} };
    } catch {
      state = null;
      next = 10_000; // bridge not running: check back calmly instead of spamming the console
    }
    window.dispatchEvent(new Event("atalaya-ninja"));
    setTimeout(tick, next);
  };
  tick();
}

/** Fresh snapshot (under 3 s old) or null. */
export function ninja(): State {
  return state && Date.now() - state.at < 3000 ? state : null;
}

/** NinjaTrader master name for a Yahoo-style futures symbol: "MNQ=F" -> "MNQ". */
export const ninjaRoot = (symbol: string) => (symbol.endsWith("=F") ? symbol.slice(0, -2) : null);

type Q = { symbol: string; price: number | null; prevClose: number | null; change: number | null; changePct: number | null; live: boolean; time: number | null; source?: string };

/** Overlay NinjaTrader prices on quotes that came from the server. */
export function mergeNinja<T extends Q>(rows: T[]): T[] {
  const n = ninja();
  if (!n) return rows;
  return rows.map((q) => {
    const root = ninjaRoot(q.symbol);
    const x = root ? n.quotes[root] : undefined;
    if (!x?.last) return q;
    const prev = x.prevClose || q.prevClose;
    const change = prev ? x.last - prev : null;
    return { ...q, price: x.last, prevClose: prev, change, changePct: change != null && prev ? (change / prev) * 100 : null, live: true, time: Math.floor((x.time || n.at) / 1000), source: "NinjaTrader" };
  });
}
