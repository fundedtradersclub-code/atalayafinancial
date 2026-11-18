import { getQuotes } from "@/lib/market";
import { ctxFrom } from "@/lib/providers";

export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("s") ?? "";
  const symbols = s.split(",").map((x) => x.trim()).filter(Boolean);
  if (!symbols.length) return Response.json([]);
  try {
    return Response.json(await getQuotes(symbols, ctxFrom(req)));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
