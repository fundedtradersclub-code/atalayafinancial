import { connection } from "next/server";
import { MODE } from "@/lib/providers";
import { mt5Quotes } from "@/lib/mt5";

// Status of the local MetaTrader 5 bridge (personal build only).
export async function GET() {
  await connection();
  if (MODE !== "personal") return Response.json({ connected: false, available: false });
  const m = await mt5Quotes();
  return Response.json({
    available: true,
    connected: !!m,
    server: m?.server ?? null,
    symbols: m ? Object.entries(m.quotes).map(([symbol, q]) => ({ symbol, name: q.name, broker: q.broker })) : [],
  });
}
