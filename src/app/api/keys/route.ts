import { ctxFrom, testKey, type Keys } from "@/lib/providers";

// Checks one key the visitor typed. The key arrives in a header and is used for this one call only.
export async function POST(req: Request) {
  const { provider } = (await req.json().catch(() => ({}))) as { provider?: keyof Keys };
  const key = provider ? ctxFrom(req).keys[provider] : undefined;
  if (!provider || !key) return Response.json({ ok: false, message: "Falta la key" }, { status: 400 });
  try {
    return Response.json({ ok: true, message: await testKey(provider, key) });
  } catch (e) {
    return Response.json({ ok: false, message: (e as Error).message.slice(0, 160) }, { status: 200 });
  }
}
