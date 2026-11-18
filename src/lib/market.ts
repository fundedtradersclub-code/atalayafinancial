import "server-only";
import { binancePair, NAMES } from "./symbols";
import {
  MODE, NeedsKey, finnhubNews, finnhubQuote, finnhubSearch, frankfurterFx, frankfurterSeries, fxPair, isTicker, kh, mapSymbol,
  polygonAggs, twelveQuote, twelveSearch, twelveSeries, type Ctx, type PCandle,
} from "./providers";

import { mt5Bars, mt5Quotes } from "./mt5";

const DEFAULT_CTX: Ctx = { mode: MODE, keys: {} };

// Personal-use terminal. Yahoo's public endpoints are unofficial and delayed;
// Binance's public market-data mirror is real time. Nothing here is redistributed.

const UA = { "User-Agent": "Mozilla/5.0 (AtalayaTerminal personal research)" };
const YH = "https://query1.finance.yahoo.com";
const BN = "https://data-api.binance.vision/api/v3";

// Tiny in-memory TTL cache so a busy dashboard doesn't hammer free sources.
const store = new Map<string, { at: number; v: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.v as T;
  const v = await fn();
  store.set(key, { at: Date.now(), v });
  return v;
}

async function getJson<T>(url: string, headers: Record<string, string> = UA): Promise<T> {
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${new URL(url).host}`);
  return res.json() as Promise<T>;
}

export type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  prevClose: number | null;
  change: number | null;
  changePct: number | null;
  spark: number[];
  live: boolean; // true = real time (Binance), false = delayed (Yahoo)
  time: number | null; // unix seconds of the last trade/bar; old = market closed
  source?: string; // set when a local feed (NinjaTrader) overrides the price
};

type Spark = Record<string, { close?: (number | null)[]; timestamp?: number[]; previousClose?: number; chartPreviousClose?: number }>;

async function yahooQuotes(symbols: string[]): Promise<Quote[]> {
  const out: Quote[] = [];
  for (let i = 0; i < symbols.length; i += 20) {
    const chunk = symbols.slice(i, i + 20);
    const url = `${YH}/v8/finance/spark?symbols=${encodeURIComponent(chunk.join(","))}&range=1d&interval=15m`;
    const data = await getJson<Spark>(url).catch(() => ({}) as Spark);
    for (const s of chunk) {
      const d = data[s];
      const closes = (d?.close ?? []).filter((x): x is number => typeof x === "number");
      const price = closes.at(-1) ?? null;
      const prev = d?.previousClose ?? d?.chartPreviousClose ?? null;
      out.push(toQuote(s, price, prev, closes, false, d?.timestamp?.at(-1) ?? null));
    }
  }
  return out;
}

type Bn24 = { symbol: string; lastPrice: string; prevClosePrice: string; openPrice: string };
type Kline = [number, string, string, string, string, string, ...unknown[]];

async function binanceQuotes(pairs: { s: string; p: string }[]): Promise<Quote[]> {
  if (!pairs.length) return [];
  const syms = encodeURIComponent(JSON.stringify(pairs.map((x) => x.p)));
  const tickers = await getJson<Bn24[]>(`${BN}/ticker/24hr?symbols=${syms}`).catch(() => [] as Bn24[]);
  return Promise.all(
    pairs.map(async ({ s, p }) => {
      const t = tickers.find((x) => x.symbol === p);
      const kl = await cached(`bnk:${p}`, 60_000, () =>
        getJson<Kline[]>(`${BN}/klines?symbol=${p}&interval=15m&limit=96`).catch(() => [] as Kline[]),
      );
      const price = t ? Number(t.lastPrice) : null;
      // 24h rolling change, the crypto convention: "prev" = price 24h ago.
      const prev = t ? Number(t.openPrice) : null;
      return toQuote(s, price, prev, kl.map((k) => Number(k[4])), true, Math.floor(Date.now() / 1000));
    }),
  );
}

function toQuote(symbol: string, price: number | null, prev: number | null, spark: number[], live: boolean, time: number | null): Quote {
  const change = price != null && prev ? price - prev : null;
  return {
    symbol,
    name: NAMES[symbol] ?? symbol,
    price,
    prevClose: prev,
    change,
    changePct: change != null && prev ? (change / prev) * 100 : null,
    spark,
    live,
    time,
  };
}

export async function getQuotes(symbols: string[], ctx: Ctx = DEFAULT_CTX): Promise<Quote[]> {
  const uniq = [...new Set(symbols)].slice(0, 80);
  const crypto = uniq.flatMap((s) => {
    const p = binancePair(s);
    return p ? [{ s, p }] : [];
  });
  const rest = uniq.filter((s) => !binancePair(s));
  // With a Finnhub key, stocks/ETFs come in real time even in the personal build (Yahoo is ~15 min late).
  const viaKey = ctx.mode === "personal" && ctx.keys.finnhub ? rest.filter(isTicker) : [];
  const viaYahoo = rest.filter((s) => !viaKey.includes(s) && !s.startsWith("MT5:"));
  const [a, b, c] = await Promise.all([
    ctx.mode === "personal" ? cached(`yq:${viaYahoo.join(",")}`, 8_000, () => yahooQuotes(viaYahoo)) : publicQuotes(rest, ctx),
    cached(`bq:${crypto.map((c) => c.s).join(",")}`, 3_000, () => binanceQuotes(crypto)),
    viaKey.length ? publicQuotes(viaKey, ctx) : Promise.resolve([] as Quote[]),
  ]);
  // A ticker Finnhub couldn't price falls back to Yahoo's delayed row.
  const yahooFallback = c.some((q) => q.price == null) ? await yahooQuotes(c.filter((q) => q.price == null).map((q) => q.symbol)) : [];
  const all = [...c.filter((q) => q.price != null), ...yahooFallback, ...a, ...b];
  const rows = uniq.map((s) => all.find((q) => q.symbol === s) ?? toQuote(s, null, null, [], false, null));
  return ctx.mode === "personal" ? overlayMt5(rows) : rows;
}

/** Personal build: MetaTrader 5 (if its bridge is running) supplies live FX and broker CFDs. */
async function overlayMt5(rows: Quote[]): Promise<Quote[]> {
  if (!rows.some((q) => q.symbol.endsWith("=X") || q.symbol.startsWith("MT5:"))) return rows;
  const m = await mt5Quotes();
  if (!m) return rows;
  return rows.map((q) => {
    const x = m.quotes[q.symbol];
    if (!x) return q;
    const prev = x.prevClose ?? q.prevClose;
    const change = prev ? x.last - prev : null;
    return { ...q, name: q.name === q.symbol ? x.name : q.name, price: x.last, prevClose: prev, change, changePct: change != null && prev ? (change / prev) * 100 : null, live: true, time: Math.floor(x.time / 1000), source: "MetaTrader 5" };
  });
}

// Public mode quotes: the visitor's own keys, one symbol at a time (free tiers are per-call).
async function publicQuotes(symbols: string[], ctx: Ctx): Promise<Quote[]> {
  const { finnhub, twelvedata } = ctx.keys;
  return Promise.all(symbols.map(async (s) => {
    const fx = fxPair(s);
    try {
      if (fx) {
        if (twelvedata) {
          const q = await cached(`tq:${kh(twelvedata)}:${s}`, 60_000, () => twelveQuote(mapSymbol(s, "twelvedata")!, twelvedata));
          if (q) return toQuote(s, q.price, q.prevClose, [], false, q.time);
        }
        const q = await cached(`ff:${s}`, 3_600_000, () => frankfurterFx(fx.base, fx.quote));
        // ECB publishes once a day: not "closed", just daily.
        return toQuote(s, q.price, q.prevClose, q.spark, false, null);
      }
      if (isTicker(s)) {
        if (finnhub) {
          const q = await cached(`fq:${kh(finnhub)}:${s}`, 15_000, () => finnhubQuote(s, finnhub));
          if (q) return { ...toQuote(s, q.price, q.prevClose, [], false, q.time), live: true };
        }
        if (twelvedata && symbols.length <= 3) {
          const q = await cached(`tq:${kh(twelvedata)}:${s}`, 60_000, () => twelveQuote(s, twelvedata));
          if (q) return toQuote(s, q.price, q.prevClose, [], false, q.time);
        }
      }
    } catch { /* fall through to an empty row */ }
    return toQuote(s, null, null, [], false, null);
  }));
}

export type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };
export type ChartData = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  type: string;
  live: boolean;
  candles: Candle[];
  stats: Record<string, number | null>;
};

// y = Yahoo [range, interval], b = Binance [interval, limit], agg = merge N Yahoo bars (Yahoo has no 4h).
export const RANGES: Record<string, { y: [string, string]; b: [string, number]; agg?: number }> = {
  // Lookback windows used by Trend / Risk
  "1D": { y: ["1d", "5m"], b: ["5m", 288] },
  "5D": { y: ["5d", "15m"], b: ["30m", 240] },
  "1M": { y: ["1mo", "60m"], b: ["2h", 360] },
  "6M": { y: ["6mo", "1d"], b: ["1d", 182] },
  "1A": { y: ["1y", "1d"], b: ["1d", 365] },
  "5A": { y: ["5y", "1wk"], b: ["1w", 260] },
  // Chart intervals (bar size), each with the deepest history the free source allows
  "i1m": { y: ["5d", "1m"], b: ["1m", 1000] },
  "i5m": { y: ["1mo", "5m"], b: ["5m", 1000] },
  "i15m": { y: ["1mo", "15m"], b: ["15m", 1000] },
  "i30m": { y: ["60d", "30m"], b: ["30m", 1000] },
  "i1h": { y: ["6mo", "60m"], b: ["1h", 1000] },
  "i4h": { y: ["1y", "60m"], b: ["4h", 1000], agg: 4 },
  "i1d": { y: ["2y", "1d"], b: ["1d", 1000] },
  "i1w": { y: ["10y", "1wk"], b: ["1w", 600] },
  "i1mo": { y: ["max", "1mo"], b: ["1M", 300] },
};

/** Merge every `n` consecutive bars of the same trading day into one (used for 4h on Yahoo). */
function aggregate(c: Candle[], n: number): Candle[] {
  const out: Candle[] = [];
  let cur: Candle | null = null, count = 0, day = -1;
  for (const x of c) {
    const d = Math.floor(x.time / 86400);
    if (!cur || count === n || d !== day) {
      if (cur) out.push(cur);
      cur = { ...x }; count = 1; day = d;
    } else {
      cur.high = Math.max(cur.high, x.high); cur.low = Math.min(cur.low, x.low);
      cur.close = x.close; cur.volume += x.volume; count++;
    }
  }
  if (cur) out.push(cur);
  return out;
}

type YChart = {
  chart: {
    result?: {
      meta: Record<string, unknown>;
      timestamp?: number[];
      indicators: { quote: { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[]; volume: (number | null)[] }[] };
    }[];
    error?: { description?: string } | null;
  };
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export async function getChart(symbol: string, range: string, ttlMs = 30_000, ctx: Ctx = DEFAULT_CTX): Promise<ChartData> {
  const r = RANGES[range] ?? RANGES["6M"];
  const pair = binancePair(symbol);
  if (!pair && ctx.mode === "public") return publicChart(symbol, RANGES[range] ? range : "6M", ctx);
  if (ctx.mode === "personal" && (symbol.startsWith("MT5:") || fxPair(symbol))) {
    const m = await mt5Quotes();
    const q = m?.quotes[symbol];
    if (q) {
      const bars = await cached(`mt:${symbol}:${range}`, 5_000, () => mt5Bars(symbol, range));
      const daily = ["i1d", "6M", "1A"].includes(range);
      const year = daily ? bars.slice(-252) : [];
      return {
        symbol, name: q.name, currency: fxPair(symbol)?.quote ?? "USD", exchange: `MetaTrader 5 · ${m!.server} · ${q.broker}`, type: fxPair(symbol) ? "CURRENCY" : "CFD", live: true,
        candles: bars,
        stats: {
          price: q.last, prevClose: q.prevClose, open: daily ? bars.at(-1)?.open ?? null : null, dayHigh: q.high, dayLow: q.low, volume: null,
          high52: year.length ? Math.max(...year.map((c) => c.high)) : null, low52: year.length ? Math.min(...year.map((c) => c.low)) : null,
        },
      };
    }
    if (symbol.startsWith("MT5:")) throw new Error("Abre MetaTrader 5 y su puente (INICIAR-METATRADER5.bat) para ver este instrumento.");
  }
  if (pair) {
    return cached(`bc:${pair}:${range}`, Math.min(ttlMs, 10_000), async () => {
      const [kl, t] = await Promise.all([
        getJson<Kline[]>(`${BN}/klines?symbol=${pair}&interval=${r.b[0]}&limit=${r.b[1]}`),
        getJson<Bn24 & { highPrice: string; lowPrice: string; volume: string }>(`${BN}/ticker/24hr?symbol=${pair}`),
      ]);
      const candles = kl.map((k) => ({
        time: Math.floor(k[0] / 1000),
        open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5],
      }));
      const year = await cached(`by:${pair}`, 3_600_000, () =>
        getJson<Kline[]>(`${BN}/klines?symbol=${pair}&interval=1d&limit=365`).catch(() => [] as Kline[]),
      );
      return {
        symbol, name: NAMES[symbol] ?? symbol, currency: "USD", exchange: "Binance (USDT)", type: "CRYPTO", live: true, candles,
        stats: {
          price: +t.lastPrice, prevClose: +t.openPrice, open: +t.openPrice, dayHigh: +t.highPrice, dayLow: +t.lowPrice,
          volume: +t.volume,
          high52: year.length ? Math.max(...year.map((k) => +k[2])) : null,
          low52: year.length ? Math.min(...year.map((k) => +k[3])) : null,
        },
      };
    });
  }
  return cached(`yc:${symbol}:${range}`, ttlMs, async () => {
    const url = `${YH}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r.y[0]}&interval=${r.y[1]}&includePrePost=false`;
    const data = await getJson<YChart>(url);
    const res = data.chart.result?.[0];
    if (!res) throw new Error(data.chart.error?.description ?? "Símbolo no encontrado");
    const q = res.indicators.quote[0] ?? { open: [], high: [], low: [], close: [], volume: [] };
    const candles: Candle[] = [];
    (res.timestamp ?? []).forEach((t, i) => {
      const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
      if (o == null || h == null || l == null || c == null) return;
      candles.push({ time: t, open: o, high: h, low: l, close: c, volume: q.volume[i] ?? 0 });
    });
    const bars = r.agg ? aggregate(candles, r.agg) : candles;
    const m = res.meta;
    // Session open = first bar of the last trading day (in the exchange's own timezone).
    const off = num(m.gmtoffset) ?? 0;
    const dayOf = (t: number) => Math.floor((t + off) / 86400);
    const lastDay = candles.length ? dayOf(candles.at(-1)!.time) : 0;
    const sessionOpen = candles.find((c) => dayOf(c.time) === lastDay)?.open ?? null;
    // Long ranges omit previousClose and chartPreviousClose is the close *before the range*,
    // so derive yesterday's close from the day change Yahoo reports.
    const px = num(m.regularMarketPrice);
    const dayChg = num(m.fulldayChange) ?? num(m.regularMarketChange);
    const prevClose = num(m.previousClose) ?? num(m.regularMarketPreviousClose) ?? (px != null && dayChg != null ? px - dayChg : null) ??
      (r.y[0] === "1d" ? num(m.chartPreviousClose) : null);
    return {
      symbol,
      name: (m.longName as string) ?? (m.shortName as string) ?? NAMES[symbol] ?? symbol,
      currency: (m.currency as string) ?? "",
      exchange: (m.fullExchangeName as string) ?? (m.exchangeName as string) ?? "",
      type: (m.instrumentType as string) ?? "",
      live: false,
      candles: bars,
      stats: {
        price: px,
        prevClose,
        open: r.y[1] === "1d" || r.y[1].endsWith("m") ? sessionOpen : null,
        dayHigh: num(m.regularMarketDayHigh),
        dayLow: num(m.regularMarketDayLow),
        volume: num(m.regularMarketVolume),
        high52: num(m.fiftyTwoWeekHigh),
        low52: num(m.fiftyTwoWeekLow),
      },
    };
  });
}

async function publicChart(symbol: string, frame: string, ctx: Ctx): Promise<ChartData> {
  const { twelvedata, polygon } = ctx.keys;
  const fx = fxPair(symbol);
  let candles: PCandle[] | null = null;
  let src = "";
  if (twelvedata && mapSymbol(symbol, "twelvedata")) {
    candles = await cached(`ts:${kh(twelvedata)}:${symbol}:${frame}`, 60_000, () => twelveSeries(mapSymbol(symbol, "twelvedata")!, twelvedata, frame)).catch(() => null);
    src = "Twelve Data";
  }
  if (!candles?.length && polygon && mapSymbol(symbol, "polygon")) {
    candles = await cached(`pa:${kh(polygon)}:${symbol}:${frame}`, 60_000, () => polygonAggs(mapSymbol(symbol, "polygon")!, polygon, frame)).catch(() => null);
    src = "Polygon";
  }
  if (!candles?.length && fx && ["i1d", "i1w", "i1mo", "6M", "1A", "5A"].includes(frame)) {
    const daily = await cached(`fs:${symbol}`, 3_600_000, () => frankfurterSeries(fx.base, fx.quote));
    candles = frame === "6M" ? daily.slice(-130) : frame === "1A" ? daily.slice(-260) : daily;
    src = "BCE (Frankfurter, diario)";
  }
  if (!candles?.length) {
    throw new NeedsKey(
      fx ? "Para divisas intradía conecta Twelve Data o Polygon (Conexiones)."
        : isTicker(symbol) ? "Para gráficos de acciones y ETF conecta Twelve Data o Polygon en Conexiones (son gratis)."
        : "Este mercado no está disponible en la versión pública. Prueba con un ETF que lo siga (por ejemplo SPY para el S&P 500).",
    );
  }
  const last = candles.at(-1)!;
  const daily = ["i1d", "6M", "1A"].includes(frame);
  const year = daily ? candles.slice(-252) : [];
  return {
    symbol, name: NAMES[symbol] ?? symbol, currency: fx ? fx.quote : "USD", exchange: src, type: fx ? "CURRENCY" : "EQUITY", live: false,
    candles,
    stats: {
      price: last.close,
      prevClose: daily && candles.length > 1 ? candles.at(-2)!.close : null,
      open: daily ? last.open : null, dayHigh: daily ? last.high : null, dayLow: daily ? last.low : null, volume: daily ? last.volume : null,
      high52: year.length ? Math.max(...year.map((c) => c.high)) : null,
      low52: year.length ? Math.min(...year.map((c) => c.low)) : null,
    },
  };
}

/** Daily closes for risk analytics (about one year). */
export async function getDailyCloses(symbol: string, ctx: Ctx = DEFAULT_CTX): Promise<number[]> {
  const c = await getChart(symbol, "1A", 30_000, ctx);
  return c.candles.map((x) => x.close);
}

export type SearchHit = { symbol: string; name: string; type: string; exchange: string };

export async function search(q: string, ctx: Ctx = DEFAULT_CTX): Promise<SearchHit[]> {
  if (!q.trim()) return [];
  if (ctx.mode === "public") {
    const fk = ctx.keys.finnhub;
    return cached(`ps:${kh(fk)}:${q.toLowerCase()}`, 300_000, () => (fk ? finnhubSearch(q, fk) : twelveSearch(q)).catch(() => []));
  }
  return cached(`s:${q.toLowerCase()}`, 300_000, async () => {
    const d = await getJson<{ quotes?: Record<string, string>[] }>(
      `${YH}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`,
    ).catch(() => ({ quotes: [] }));
    return (d.quotes ?? [])
      .filter((x) => x.symbol)
      .map((x) => ({ symbol: x.symbol, name: x.longname ?? x.shortname ?? x.symbol, type: x.typeDisp ?? x.quoteType ?? "", exchange: x.exchDisp ?? x.exchange ?? "" }));
  });
}

export type NewsItem = { title: string; link: string; source: string; time: number };

export async function getNews(symbol?: string, ctx: Ctx = DEFAULT_CTX): Promise<NewsItem[]> {
  if (symbol && ctx.mode === "public") {
    const fk = ctx.keys.finnhub;
    if (!fk || !isTicker(symbol)) return [];
    return cached(`pn:${kh(fk)}:${symbol}`, 600_000, () => finnhubNews(symbol, fk).catch(() => []));
  }
  if (symbol) {
    return cached(`n:${symbol}`, 300_000, async () => {
      const q = symbol.replace(/=F$|=X$|^\^/g, "");
      const d = await getJson<{ news?: { title: string; link: string; publisher: string; providerPublishTime: number }[] }>(
        `${YH}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=0&newsCount=12`,
      ).catch(() => ({ news: [] }));
      return (d.news ?? []).map((n) => ({ title: n.title, link: n.link, source: n.publisher, time: n.providerPublishTime * 1000 }));
    });
  }
  return cached("n:general", 300_000, async () => {
    const feeds = [
      ["MarketWatch", "https://feeds.content.dowjones.io/public/rss/mw_topstories"],
      ["MarketWatch Mercados", "https://feeds.content.dowjones.io/public/rss/mw_marketpulse"],
      ["CNBC", "https://www.cnbc.com/id/100003114/device/rss/rss.html"],
    ] as const;
    const lists = await Promise.all(
      feeds.map(async ([source, url]) => {
        const xml = await fetch(url, { headers: UA, cache: "no-store" }).then((r) => (r.ok ? r.text() : "")).catch(() => "");
        return parseRss(xml, source);
      }),
    );
    const seen = new Set<string>();
    return lists
      .flat()
      .filter((n) => (seen.has(n.title) ? false : (seen.add(n.title), true)))
      .sort((a, b) => b.time - a.time)
      .slice(0, 60);
  });
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/g) ?? [];
  const tag = (s: string, t: string) =>
    (new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`).exec(s)?.[1] ?? "")
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
  return items.map((it) => ({
    title: tag(it, "title"),
    link: tag(it, "link"),
    source,
    time: Date.parse(tag(it, "pubDate")) || 0,
  })).filter((n) => n.title && n.link.startsWith("http"));
}
