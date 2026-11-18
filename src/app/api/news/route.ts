import { getNews } from "@/lib/market";
import { ctxFrom } from "@/lib/providers";

export async function GET(req: Request) {
  const s = new URL(req.url).searchParams.get("s") ?? undefined;
  return Response.json(await getNews(s, ctxFrom(req)));
}
