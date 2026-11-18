import { trendReport } from "@/lib/trend";
import { ctxFrom } from "@/lib/providers";

export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("s");
  if (!s) return Response.json({ error: "Falta el símbolo" }, { status: 400 });
  try {
    return Response.json(await trendReport(s, ctxFrom(req)));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
