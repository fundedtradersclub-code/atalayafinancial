import { search } from "@/lib/market";
import { ctxFrom } from "@/lib/providers";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return Response.json(await search(q.slice(0, 40), ctxFrom(req)));
}
