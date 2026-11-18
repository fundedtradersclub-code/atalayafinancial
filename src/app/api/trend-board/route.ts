import { analyze } from "@/lib/indicators";
import { getChart } from "@/lib/market";
import { NAMES } from "@/lib/symbols";
import { ctxFrom } from "@/lib/providers";

const PUBLIC_BOARD = ["SPY", "QQQ", "DIA", "IWM", "GLD", "SLV", "USO", "TLT", "EURUSD=X", "USDJPY=X", "BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD"];
const BOARD = ["^GSPC", "^NDX", "^DJI", "^RUT", "ES=F", "NQ=F", "^GDAXI", "^N225", "GC=F", "SI=F", "CL=F", "HG=F", "DX-Y.NYB", "EURUSD=X", "USDJPY=X", "USDMXN=X", "^TNX", "BTC-USD", "ETH-USD", "SOL-USD"];

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

export async function GET(req: Request) {
  const extra = (new URL(req.url).searchParams.get("s") ?? "").split(",").filter(Boolean).slice(0, 12);
  const ctx = ctxFrom(req);
  const pub = ctx.mode === "public";
  const syms = [...new Set([...(pub ? PUBLIC_BOARD : BOARD), ...extra])];
  // Free API tiers are per-minute: fewer parallel calls in public mode.
  const rows = await pool(syms, pub ? 2 : 6, async (s) => {
    const [d, w] = await Promise.all([getChart(s, "1A", 600_000, ctx).catch(() => null), getChart(s, "5A", 600_000, ctx).catch(() => null)]);
    const ad = d ? analyze(d.candles) : null, aw = w ? analyze(w.candles) : null;
    const closes = d?.candles.map((c) => c.close) ?? [];
    return {
      symbol: s,
      name: NAMES[s] ?? d?.name ?? s,
      last: ad?.last ?? null,
      chg20: closes.length > 21 ? (closes.at(-1)! / closes.at(-21)! - 1) * 100 : null,
      daily: ad ? { score: ad.score, trend: ad.trend, rsi: ad.rsi } : null,
      weekly: aw ? { score: aw.score, trend: aw.trend } : null,
      spark: closes.slice(-60),
    };
  });
  return Response.json(rows);
}
