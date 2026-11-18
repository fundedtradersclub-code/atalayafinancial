import { getDailyCloses } from "@/lib/market";
import { binancePair } from "@/lib/symbols";
import { callTool } from "@/lib/tradingcalc";
import { ctxFrom } from "@/lib/providers";

// Feeds a year of real daily returns for one symbol into TradingCalc.
export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("s");
  if (!s) return Response.json({ error: "Falta el símbolo" }, { status: 400 });
  try {
    const closes = await getDailyCloses(s, ctxFrom(req));
    const returns = closes.slice(1).map((c, i) => c / closes[i] - 1).filter(Number.isFinite);
    if (returns.length < 20) return Response.json({ error: "No hay historial suficiente" }, { status: 422 });
    const periods = binancePair(s) ? 365 : 252;
    const [tear, var95, var99] = await Promise.all([
      callTool("workflow.run_portfolio_tearsheet", { returns, periods_per_year: periods }),
      callTool("workflow.run_var_cvar", { returns, confidence: 0.95 }),
      callTool("workflow.run_var_cvar", { returns, confidence: 0.99 }),
    ]);
    return Response.json({
      symbol: s, n: returns.length, periods, returns, closes,
      tearsheet: tear.data, var95: var95.data, var99: var99.data, signedAt: tear.signedAt,
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
