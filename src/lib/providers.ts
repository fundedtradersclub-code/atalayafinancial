import "server-only";
import { createHash } from "node:crypto";

// Public mode: no Yahoo. Each visitor's data comes through *their own* API keys
// (sent per request in headers, never stored or logged), plus sources that are
// free to republish: Binance (crypto), ECB reference rates via Frankfurter, SEC.

export type Keys = { finnhub?: string; twelvedata?: string; polygon?: string; nvidia?: string };
export type Ctx = { mode: "personal" | "public"; keys: Keys };

export const MODE: Ctx["mode"] = process.env.DATA_MODE === "personal" ? "personal" : "public";

export function ctxFrom(req: Request): Ctx {
  const h = (n: string) => req.headers.get(`x-key-${n}`)?.trim().slice(0, 200) || undefined;
  return { mode: MODE, keys: { finnhub: h("finnhub"), twelvedata: h("twelvedata"), polygon: h("polygon"), nvidia: h("nvidia") } };
}

/** Cache partition per key, so one visitor's licensed data is never served to another. */
export const kh = (k?: string) => (k ? createHash("sha256").update(k).digest("hex").slice(0, 10) : "anon");

export class NeedsKey extends Error {
  constructor(msg: string) { super(msg); this.name = "NeedsKey"; }
}

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { cache: "no-store", ...init });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(body?.error || body?.message || `HTTP ${r.status}`);
  return body as T;
}

// ---------- symbol classes ----------
export const fxPair = (s: string) => {
  const m = /^([A-Z]{3})([A-Z]{3})=X$/.exec(s);
  return m ? { base: m[1], quote: m[2] } : null;
};
export const isTicker = (s: string) => /^[A-Z][A-Z0-9.\-]{0,9}$/.test(s);

// ---------- quotes ----------
export type PQuote = { price: number; prevClose: number | null; time: number | null; spark?: number[] };

export async function finnhubQuote(sym: string, key: string): Promise<PQuote | null> {
  const d = await j<{ c: number; pc: number; t: number }>(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${key}`);
  return d.c ? { price: d.c, prevClose: d.pc || null, time: d.t || null } : null;
}

export async function twelveQuote(sym: string, key: string): Promise<PQuote | null> {
  const d = await j<{ close?: string; previous_close?: string; last_quote_at?: number; timestamp?: number; status?: string; message?: string }>(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(sym)}&apikey=${key}`,
  );
  if (d.status === "error") throw new Error(d.message);
  return d.close ? { price: +d.close, prevClose: d.previous_close ? +d.previous_close : null, time: d.last_quote_at ?? d.timestamp ?? null } : null;
}

export async function frankfurterFx(base: string, quote: string): Promise<PQuote & { spark: number[] }> {
  const from = new Date(Date.now() - 45 * 86400_000).toISOString().slice(0, 10);
  const d = await j<{ rates: Record<string, Record<string, number>> }>(`https://api.frankfurter.dev/v1/${from}..?base=${base}&symbols=${quote}`);
  const days = Object.keys(d.rates).sort();
  const vals = days.map((k) => d.rates[k][quote]);
  return { price: vals.at(-1)!, prevClose: vals.at(-2) ?? null, time: Date.parse(days.at(-1)! + "T16:00:00Z") / 1000, spark: vals };
}

// ---------- candles ----------
export type PCandle = { time: number; open: number; high: number; low: number; close: number; volume: number };

const TD_INT: Record<string, [string, number]> = {
  i1m: ["1min", 1500], i5m: ["5min", 2000], i15m: ["15min", 2000], i30m: ["30min", 2000], i1h: ["1h", 2000], i4h: ["4h", 1500],
  i1d: ["1day", 750], i1w: ["1week", 520], i1mo: ["1month", 300],
  "1D": ["5min", 100], "5D": ["15min", 160], "1M": ["1h", 180], "6M": ["1day", 130], "1A": ["1day", 260], "5A": ["1week", 260],
};

export async function twelveSeries(sym: string, key: string, frame: string): Promise<PCandle[]> {
  const [interval, size] = TD_INT[frame] ?? TD_INT.i1d;
  const d = await j<{ values?: { datetime: string; open: string; high: string; low: string; close: string; volume?: string }[]; status?: string; message?: string }>(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(sym)}&interval=${interval}&outputsize=${size}&timezone=UTC&order=ASC&apikey=${key}`,
  );
  if (d.status === "error") throw new Error(d.message);
  return (d.values ?? []).map((v) => ({
    time: Math.floor(Date.parse(v.datetime.length <= 10 ? `${v.datetime}T00:00:00Z` : `${v.datetime.replace(" ", "T")}Z`) / 1000),
    open: +v.open, high: +v.high, low: +v.low, close: +v.close, volume: v.volume ? +v.volume : 0,
  }));
}

const PG_INT: Record<string, [number, string, number]> = {
  i1m: [1, "minute", 5], i5m: [5, "minute", 30], i15m: [15, "minute", 30], i30m: [30, "minute", 60], i1h: [1, "hour", 180], i4h: [4, "hour", 365],
  i1d: [1, "day", 730], i1w: [1, "week", 730], i1mo: [1, "month", 730],
  "1D": [5, "minute", 3], "5D": [15, "minute", 7], "1M": [1, "hour", 31], "6M": [1, "day", 183], "1A": [1, "day", 365], "5A": [1, "week", 730],
};

export async function polygonAggs(ticker: string, key: string, frame: string): Promise<PCandle[]> {
  const [mult, span, days] = PG_INT[frame] ?? PG_INT.i1d;
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const d = await j<{ results?: { t: number; o: number; h: number; l: number; c: number; v: number }[] }>(
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/${mult}/${span}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${key}`,
  );
  return (d.results ?? []).map((r) => ({ time: Math.floor(r.t / 1000), open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v }));
}

export async function frankfurterSeries(base: string, quote: string, years = 5): Promise<PCandle[]> {
  const from = new Date(Date.now() - years * 365 * 86400_000).toISOString().slice(0, 10);
  const d = await j<{ rates: Record<string, Record<string, number>> }>(`https://api.frankfurter.dev/v1/${from}..?base=${base}&symbols=${quote}`);
  return Object.keys(d.rates).sort().map((day) => {
    const v = d.rates[day][quote];
    return { time: Date.parse(`${day}T00:00:00Z`) / 1000, open: v, high: v, low: v, close: v, volume: 0 };
  });
}

/** Provider-specific symbol for a Yahoo-style one. */
export function mapSymbol(s: string, provider: "twelvedata" | "polygon"): string | null {
  const fx = fxPair(s);
  if (fx) return provider === "twelvedata" ? `${fx.base}/${fx.quote}` : `C:${fx.base}${fx.quote}`;
  if (isTicker(s)) return s;
  return null;
}

// ---------- search & news ----------
export async function finnhubSearch(q: string, key: string) {
  const d = await j<{ result?: { symbol: string; description: string; type: string; displaySymbol: string }[] }>(
    `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${key}`,
  );
  return (d.result ?? []).filter((x) => !x.symbol.includes(".") || x.symbol.split(".")[1].length <= 1).slice(0, 8)
    .map((x) => ({ symbol: x.symbol, name: x.description, type: x.type || "Acción", exchange: "EE. UU." }));
}

export async function twelveSearch(q: string) {
  const d = await j<{ data?: { symbol: string; instrument_name: string; exchange: string; instrument_type: string; country: string }[] }>(
    `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=12`,
  );
  const seen = new Set<string>();
  return (d.data ?? [])
    .filter((x) => (x.country === "United States" || x.instrument_type === "Physical Currency") && !seen.has(x.symbol) && seen.add(x.symbol))
    .slice(0, 8)
    .map((x) => ({ symbol: x.symbol.includes("/") ? `${x.symbol.replace("/", "")}=X` : x.symbol, name: x.instrument_name, type: x.instrument_type, exchange: x.exchange }));
}

export async function finnhubNews(sym: string, key: string) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
  const d = await j<{ headline: string; url: string; source: string; datetime: number }[]>(
    `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(sym)}&from=${from}&to=${to}&token=${key}`,
  );
  return d.slice(0, 15).map((n) => ({ title: n.headline, link: n.url, source: n.source, time: n.datetime * 1000 }));
}

// ---------- key check ----------
export async function testKey(provider: keyof Keys, key: string): Promise<string> {
  switch (provider) {
    case "finnhub": { const q = await finnhubQuote("AAPL", key); return q ? `OK · AAPL ${q.price}` : "Respondió sin datos"; }
    case "twelvedata": {
      const d = await j<{ current_usage?: number; plan_limit?: number; status?: string; message?: string }>(`https://api.twelvedata.com/api_usage?apikey=${key}`);
      if (d.status === "error") throw new Error(d.message);
      return `OK · ${d.current_usage ?? 0}/${d.plan_limit ?? "?"} créditos usados este minuto`;
    }
    case "polygon": { const c = await polygonAggs("AAPL", key, "1A"); return `OK · ${c.length} velas diarias de AAPL`; }
    case "nvidia": {
      const d = await j<{ data?: unknown[] }>("https://integrate.api.nvidia.com/v1/models", { headers: { Authorization: `Bearer ${key}` } });
      // /models is public; confirm the key with a 1-token completion.
      await j("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b", max_tokens: 1, messages: [{ role: "user", content: "ok" }] }),
      });
      return `OK · ${d.data?.length ?? 0} modelos disponibles`;
    }
  }
}
