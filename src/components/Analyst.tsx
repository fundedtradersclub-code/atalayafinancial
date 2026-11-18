"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Panel } from "./ui";
import { apiFetch } from "./keys";
import { lang } from "./i18n";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = (s: string) => [
  `Resume la tendencia de ${s} en los tres marcos de tiempo`,
  `¿Qué niveles de ${s} conviene vigilar y por qué?`,
  `¿Las noticias recientes de ${s} coinciden con lo que muestra el gráfico?`,
  "¿Cómo está el ánimo general del mercado hoy?",
];

export default function Analyst({ symbol, msgs, setMsgs }: { symbol: string; msgs: Msg[]; setMsgs: (f: (m: Msg[]) => Msg[]) => void }) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [useSymbol, setUseSymbol] = useState(true);
  const ctrl = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs]);
  useEffect(() => () => ctrl.current?.abort(), []);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(() => [...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    ctrl.current = new AbortController();
    try {
      const res = await apiFetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, symbol: useSymbol ? symbol : null, lang: lang() }),
        signal: ctrl.current.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: `Error ${res.status}` }));
        throw new Error(j.error);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = dec.decode(value, { stream: true });
        setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: x.content + piece } : x)));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: x.content || `No pude responder: ${(e as Error).message}` } : x)));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Analista IA"
      className="h-full"
      right={
        <span className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={useSymbol} onChange={(e) => setUseSymbol(e.target.checked)} className="accent-[var(--amber)]" />
            datos de <span className="text-amber">{symbol}</span>
          </label>
          {msgs.length > 0 && !busy && <button onClick={() => setMsgs(() => [])} className="btn hover:text-text">Nueva conversación</button>}
        </span>
      }
    >
      <div className="flex h-full min-h-[420px] flex-col">
        <div className="min-h-0 flex-1 overflow-auto p-3" aria-live="polite">
          {msgs.length === 0 ? (
            <div className="max-w-[640px]">
              <p className="text-muted">
                Pregunta sobre el mercado o sobre <span className="text-amber">{symbol}</span>. Antes de responder, el analista recibe los precios del tablero, el análisis de tendencia por marco de tiempo, el exponente de Hurst y los titulares recientes.
              </p>
              <ul className="mt-4 grid gap-1.5">
                {STARTERS(symbol).map((s) => (
                  <li key={s}>
                    <button onClick={() => send(s)} className="btn row-hover w-full border border-line px-3 py-2 text-left hover:border-amber-dim">
                      <span className="mr-2 text-amber">&gt;</span>{s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ol className="grid max-w-[820px] gap-4">
              {msgs.map((m, i) => (
                <li key={i} className={m.role === "user" ? "border-l-2 border-amber pl-3" : "pl-3"}>
                  <div className="ph mb-1 text-[10px]">{m.role === "user" ? "Tú" : "Analista · Nemotron (NVIDIA)"}</div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.content ? <Rich text={m.content} /> : <span className="text-muted">Reuniendo datos y pensando…</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex shrink-0 items-end gap-2 border-t border-line p-2">
          <label className="flex-1">
            <span className="sr-only">Tu pregunta</span>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              rows={2}
              placeholder="Escribe tu pregunta. Enter envía, Shift+Enter cambia de línea."
              className="w-full resize-none border border-line-strong bg-bg px-2 py-1.5 text-text outline-none transition-[border-color] duration-150 placeholder:text-muted focus:border-amber"
            />
          </label>
          {busy ? (
            <button type="button" onClick={() => ctrl.current?.abort()} aria-label="Detener respuesta" className="btn grid size-11 place-items-center border border-line-strong text-text hover:border-down hover:text-down">
              <Square size={14} />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Enviar pregunta" className="btn grid size-11 place-items-center bg-amber text-black disabled:opacity-40">
              <ArrowUp size={16} />
            </button>
          )}
        </form>
        <p className="shrink-0 px-2 pb-2 text-[10px] text-muted">La IA puede equivocarse. Sus respuestas son informativas y no son recomendaciones de inversión.</p>
      </div>
    </Panel>
  );
}

function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((p, k) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={k} className="font-semibold text-amber">{p.slice(2, -2)}</strong>
    : p.length > 2 && p.startsWith("*") && p.endsWith("*") ? <em key={k} className="text-muted">{p.slice(1, -1)}</em>
    : <span key={k}>{p}</span>,
  );
}

/** Minimal markdown: **bold**, "- " bullets and pipe tables, without injecting HTML. */
function Rich({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*\|/.test(lines[i])) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        if (!/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      i--;
      const [head, ...body] = rows;
      blocks.push(
        <div key={`t${i}`} className="my-2 overflow-x-auto whitespace-normal">
          <table className="w-full border-collapse text-[12px]">
            <thead><tr>{head?.map((h, k) => <th key={k} scope="col" className="border-b border-line-strong px-2 py-1 text-left font-cond text-[11px] font-normal uppercase tracking-wider text-muted">{inline(h)}</th>)}</tr></thead>
            <tbody>{body.map((r, k) => <tr key={k} className="border-b border-line/60">{r.map((c, j) => <td key={j} className="px-2 py-1 align-top">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    blocks.push(<Line key={i} line={lines[i]} />);
  }
  return <>{blocks}</>;
}

function Line({ line }: { line: string }) {
  const bullet = /^\s*[-*•]\s+/.test(line);
  const body = line.replace(/^\s*[-*•]\s+/, "").replace(/^#+\s*/, "").replace(/^-{3,}$/, "");
  return (
    <span className={`block ${bullet ? "pl-4 -indent-3" : ""} ${body.trim() === "" ? "h-2" : ""}`}>
      {bullet && <span className="text-amber">· </span>}
      {inline(body)}
    </span>
  );
}
