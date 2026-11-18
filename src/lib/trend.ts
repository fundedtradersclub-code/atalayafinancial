import "server-only";
import { analyze, type Analysis } from "./indicators";
import { getChart } from "./market";
import { callTool } from "./tradingcalc";
import type { Ctx } from "./providers";

export const TIMEFRAMES = [
  { id: "intra", label: "Intradía", range: "5D", bar: "velas de 15-30 min, últimos 5 días", horizon: "horas" },
  { id: "daily", label: "Diario", range: "1A", bar: "velas diarias, último año", horizon: "días a semanas" },
  { id: "weekly", label: "Semanal", range: "5A", bar: "velas semanales, últimos 5 años", horizon: "meses" },
] as const;

export type TrendReport = {
  symbol: string;
  name: string;
  live: boolean;
  frames: { id: string; label: string; bar: string; horizon: string; a: Analysis | null }[];
  hurst: { h: number; reading: string } | null;
  consensus: { score: number; label: string };
};

export async function trendReport(symbol: string, ctx?: Ctx): Promise<TrendReport> {
  const charts = await Promise.all(TIMEFRAMES.map((t) => getChart(symbol, t.range, 600_000, ctx).catch(() => null)));
  if (!charts.some(Boolean)) {
    // Surface the "connect a key" message instead of an empty report.
    await getChart(symbol, "1A", 600_000, ctx);
  }
  const frames = TIMEFRAMES.map((t, i) => ({ id: t.id, label: t.label, bar: t.bar, horizon: t.horizon, a: charts[i] ? analyze(charts[i]!.candles) : null }));
  const daily = charts[1]?.candles.map((c) => c.close) ?? [];
  const rets = daily.slice(1).map((c, i) => c / daily[i] - 1).filter(Number.isFinite);
  let hurst: TrendReport["hurst"] = null;
  if (rets.length >= 64) {
    const h = await callTool("workflow.run_hurst_exponent", { values: rets }).catch(() => null);
    const v = h?.data.hurst as number | undefined;
    if (typeof v === "number") {
      hurst = {
        h: v,
        reading: v > 0.55 ? "Persistente: los movimientos tienden a continuar en la misma dirección" : v < 0.45 ? "Revierte a la media: los movimientos tienden a corregirse" : "Cercano al azar: el pasado dice poco del siguiente movimiento",
      };
    }
  }
  // Longer timeframes weigh more: they move slower and fake out less.
  const w = [1, 2, 3];
  const valid = frames.map((f, i) => (f.a ? { s: f.a.score, w: w[i] } : null)).filter(Boolean) as { s: number; w: number }[];
  const score = valid.length ? Math.round(valid.reduce((s, x) => s + x.s * x.w, 0) / valid.reduce((s, x) => s + x.w, 0)) : 0;
  const label = score >= 50 ? "Alcista" : score >= 20 ? "Ligeramente alcista" : score <= -50 ? "Bajista" : score <= -20 ? "Ligeramente bajista" : "Sin dirección clara";
  const meta = charts.find(Boolean);
  return { symbol, name: meta?.name ?? symbol, live: meta?.live ?? false, frames, hurst, consensus: { score, label } };
}
