import "server-only";

// TradingCalc remote MCP server (no account needed). We speak plain JSON-RPC
// "tools/call" to it; every result is deterministic and signed by the server.
const ENDPOINT = "https://tradingcalc.io/api/mcp";

export const ALLOWED_TOOLS = new Set([
  "workflow.run_portfolio_tearsheet",
  "workflow.run_var_cvar",
  "workflow.run_black_scholes",
  "workflow.run_position_sizing",
  "workflow.run_risk_reward",
  "workflow.run_forex_pip_value",
  "workflow.run_cagr",
  "workflow.run_fibonacci_levels",
  "workflow.run_hurst_exponent",
]);

export async function callTool(name: string, args: Record<string, unknown>) {
  if (!ALLOWED_TOOLS.has(name)) throw new Error(`Herramienta no permitida: ${name}`);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } }),
    cache: "no-store",
  });
  const text = await res.text();
  // The server may answer as SSE ("data: {...}") or plain JSON.
  const payload = text.trim().startsWith("{") ? text : (text.match(/^data: (.*)$/m)?.[1] ?? "{}");
  const msg = JSON.parse(payload) as {
    error?: { message: string };
    result?: { content?: { type: string; text: string }[]; isError?: boolean };
  };
  if (msg.error) throw new Error(msg.error.message);
  const blocks = msg.result?.content ?? [];
  const first = blocks[0]?.text ?? "{}";
  if (msg.result?.isError) throw new Error(first);
  const sig = blocks[1]?.text ? (JSON.parse(blocks[1].text)._signature as { signedAt?: string } | undefined) : undefined;
  return { data: JSON.parse(first) as Record<string, unknown>, signedAt: sig?.signedAt ?? null };
}
