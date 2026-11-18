import "server-only";
import { getChart, getNews, getQuotes } from "./market";
import { tapeFor } from "./symbols";
import type { Ctx } from "./providers";
import { trendReport } from "./trend";

const n = (x: number | null | undefined, d = 2) => (x == null || !Number.isFinite(x) ? "n/d" : x.toLocaleString("en-US", { maximumFractionDigits: d }));

/** Compact, factual snapshot the model must ground its answer in. */
export async function buildContext(symbol: string | null, ctx: Ctx): Promise<string> {
  const lines: string[] = [`Fecha y hora (UTC): ${new Date().toISOString()}`];
  const tape = (await getQuotes(tapeFor(ctx.mode), ctx).catch(() => [])).filter((q) => q.price != null);
  lines.push("TABLERO GENERAL (último, var % del día):");
  for (const q of tape) lines.push(`- ${q.name} (${q.symbol}): ${n(q.price, 4)} (${n(q.changePct)}%)${q.live ? " [en vivo]" : " [con retraso]"}`);

  if (symbol) {
    const [chart, trend, news] = await Promise.all([
      getChart(symbol, "6M", 30_000, ctx).catch(() => null),
      trendReport(symbol, ctx).catch(() => null),
      getNews(symbol, ctx).catch(() => []),
    ]);
    if (chart) {
      const s = chart.stats;
      lines.push(`\nSÍMBOLO ACTIVO: ${chart.name} (${symbol}) · ${chart.exchange} · ${chart.currency} · ${chart.live ? "en vivo" : "con retraso"}`);
      lines.push(`Precio ${n(s.price, 4)} · cierre anterior ${n(s.prevClose, 4)} · máx/mín día ${n(s.dayHigh, 4)}/${n(s.dayLow, 4)} · máx/mín 52 sem ${n(s.high52, 4)}/${n(s.low52, 4)}`);
    }
    if (trend) {
      lines.push(`ANÁLISIS TÉCNICO (puntaje -100 a +100, por votos de 8 señales): consenso ${trend.consensus.label} (${trend.consensus.score})`);
      for (const f of trend.frames) {
        if (!f.a) continue;
        lines.push(`- ${f.label} (${f.bar}): ${f.a.trend} ${f.a.score}, RSI ${n(f.a.rsi, 1)}, ATR ${n(f.a.atrPct)}%, soporte ${n(f.a.support, 4)}, resistencia ${n(f.a.resistance, 4)}`);
        lines.push(`  señales: ${f.a.signals.map((x) => `${x.name}=${x.value} (${x.vote > 0 ? "+" : x.vote < 0 ? "−" : "0"})`).join("; ")}`);
      }
      if (trend.hurst) lines.push(`Exponente de Hurst (retornos diarios): ${n(trend.hurst.h, 3)} → ${trend.hurst.reading}`);
    }
    if (news.length) {
      lines.push("TITULARES RECIENTES:");
      for (const x of news.slice(0, 6)) lines.push(`- ${x.title} (${x.source}, ${new Date(x.time).toISOString().slice(0, 10)})`);
    }
  }
  return lines.join("\n");
}

export const SYSTEM = `Eres el analista de ATALAYA, una terminal de mercados en español.
Reglas:
- Responde en español, claro y directo. Usa listas cortas cuando ayuden. Nada de relleno.
- Basa las cifras SOLO en el bloque DATOS. Si un dato no está ahí, dilo; no inventes precios, fechas ni noticias.
- Puedes explicar qué sugieren las señales técnicas y describir escenarios condicionales ("si rompe X, ...; si pierde Y, ..."), siempre como lectura de datos, no como certeza.
- No des recomendaciones personalizadas de compra o venta, ni tamaños de posición para el usuario. Si te lo piden, explica los factores a considerar.
- Recuerda cuando aplique que los datos de Yahoo vienen con retraso.
- Termina con una línea breve: "Lectura informativa, no es recomendación de inversión."`;
