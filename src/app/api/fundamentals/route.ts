import { getFundamentals } from "@/lib/sec";

export async function GET(req: Request) {
  const s = (new URL(req.url).searchParams.get("s") ?? "").toUpperCase();
  if (!/^[A-Z.\-]{1,6}$/.test(s)) return Response.json(null);
  try {
    return Response.json(await getFundamentals(s.replace(".", "-")));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
