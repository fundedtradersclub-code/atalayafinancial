import "server-only";

// Personal build only: the MetaTrader 5 bridge (connectors/mt5_bridge.py) runs on this same PC.
// The Next.js server and the bridge share the machine, so the server can read it directly.

const BASE = "http://127.0.0.1:8778";

export type Mt5Quote = { name: string; broker: string; last: number; bid: number; ask: number; high: number | null; low: number | null; prevClose: number | null; time: number };
type Snapshot = { at: number; server: string; quotes: Record<string, Mt5Quote> } | null;

let snap: Snapshot = null;
let lastTry = 0;

/** Latest quotes from MT5, refreshed at most once a second; null when the bridge is off. */
export async function mt5Quotes(): Promise<Snapshot> {
  const now = Date.now();
  if (snap && now - snap.at < 1000) return snap;
  if (!snap && now - lastTry < 5000) return null; // bridge was off a moment ago: don't hammer
  lastTry = now;
  try {
    const r = await fetch(`${BASE}/quotes`, { cache: "no-store", signal: AbortSignal.timeout(2500) });
    const j = await r.json();
    snap = j.ok ? { at: now, server: j.server ?? "", quotes: j.quotes ?? {} } : null;
  } catch {
    snap = null;
  }
  return snap;
}

const TF: Record<string, [string, number]> = {
  i1m: ["M1", 2000], i5m: ["M5", 2000], i15m: ["M15", 2000], i30m: ["M30", 2000], i1h: ["H1", 2000], i4h: ["H4", 1500],
  i1d: ["D1", 1000], i1w: ["W1", 600], i1mo: ["MN1", 300],
  "1D": ["M5", 288], "5D": ["M15", 480], "1M": ["H1", 500], "6M": ["D1", 130], "1A": ["D1", 260], "5A": ["W1", 260],
};

export async function mt5Bars(symbol: string, frame: string) {
  const [tf, count] = TF[frame] ?? TF.i1d;
  const r = await fetch(`${BASE}/bars?symbol=${encodeURIComponent(symbol)}&tf=${tf}&count=${count}`, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  const j = await r.json();
  if (!j.ok) throw new Error("MetaTrader 5 no tiene ese instrumento");
  return j.bars as { time: number; open: number; high: number; low: number; close: number; volume: number }[];
}
