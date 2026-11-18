import { RANGES, getChart } from "@/lib/market";
import { ctxFrom } from "@/lib/providers";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const s = p.get("s");
  if (!s) return Response.json({ error: "Falta el símbolo" }, { status: 400 });
  const i = p.get("i");
  const key = i && RANGES[`i${i}`] ? `i${i}` : (p.get("r") ?? "6M");
  try {
    return Response.json(await getChart(s, key, key.startsWith("i1m") || key === "i5m" ? 15_000 : 30_000, ctxFrom(req)));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: (e as Error).name === "NeedsKey" ? 428 : 404 });
  }
}
