import { SYSTEM, buildContext } from "@/lib/ai";
import { ctxFrom } from "@/lib/providers";

type Msg = { role: "user" | "assistant"; content: string };

const EN_NOTE =
  "\n\nIMPORTANTE: el usuario usa la interfaz en inglés. Responde SIEMPRE en inglés (English). La línea final será: \"Informational reading, not investment advice.\"";

export async function POST(req: Request) {
  const ctx = ctxFrom(req);
  // Visitor's own key first; the owner's key only in the personal (local) build.
  const key = ctx.keys.nvidia || (ctx.mode === "personal" ? process.env.NVIDIA_API_KEY : undefined);
  if (!key) return Response.json({ error: "Para usar el Analista IA conecta tu key gratuita de NVIDIA en Conexiones." }, { status: 428 });
  const body = (await req.json().catch(() => null)) as { messages?: Msg[]; symbol?: string | null; lang?: string } | null;
  const history = (body?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!history.length || history.at(-1)!.role !== "user") return Response.json({ error: "Mensaje vacío" }, { status: 400 });

  const context = await buildContext(body?.symbol ?? null, ctx);
  const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-ultra-550b-a55b",
      stream: true,
      temperature: 0.3,
      max_tokens: 1400,
      messages: [{ role: "system", content: `${SYSTEM}${body?.lang === "en" ? EN_NOTE : ""}\n\nDATOS:\n${context}` }, ...history],
    }),
    signal: req.signal,
  });
  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(() => "");
    return Response.json({ error: `NVIDIA ${upstream.status}: ${t.slice(0, 200)}` }, { status: 502 });
  }

  // Re-emit only the answer text (drop reasoning deltas and SSE framing).
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctrl) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const d = line.startsWith("data:") ? line.slice(5).trim() : "";
          if (!d || d === "[DONE]") continue;
          try {
            const t = JSON.parse(d).choices?.[0]?.delta?.content;
            if (t) ctrl.enqueue(enc.encode(t));
          } catch { /* partial or keep-alive line */ }
        }
      },
    }),
  );
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
