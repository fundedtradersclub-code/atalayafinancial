import { callTool } from "@/lib/tradingcalc";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { tool?: string; args?: Record<string, unknown> } | null;
  if (!body?.tool) return Response.json({ error: "Falta la herramienta" }, { status: 400 });
  try {
    return Response.json(await callTool(body.tool, body.args ?? {}));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 422 });
  }
}
