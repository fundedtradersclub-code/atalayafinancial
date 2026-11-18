import { connection } from "next/server";
import { MODE } from "@/lib/providers";

export async function GET() {
  await connection(); // read the mode per request, not at build time
  return Response.json({ mode: MODE, aiShared: MODE === "personal" && !!process.env.NVIDIA_API_KEY });
}
