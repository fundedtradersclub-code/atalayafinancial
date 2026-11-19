"use client";

import { useState } from "react";
import type { NewsItem } from "@/lib/market";
import dynamic from "next/dynamic";
import { Panel, Updated, usePoll } from "./ui";

const TvEconomicCalendar = dynamic(() => import("./TradingViewChart").then((m) => m.TvEconomicCalendar), { ssr: false });

/** Economic calendar view (its own tab). */
export function CalendarView() {
  const [imp, setImp] = useState<"high" | "medium" | "all">("medium");
  return (
    <Panel
      title="Calendario económico"
      className="h-full min-h-[600px]"
      right={
        <div role="group" aria-label="Importancia" className="flex">
          {([["high", "Alta"], ["medium", "Media y alta"], ["all", "Todas"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setImp(k)} aria-pressed={imp === k} className={`btn h-6 px-2 text-[11px] ${imp === k ? "bg-amber text-black" : "text-muted hover:text-text"}`}>{l}</button>
          ))}
        </div>
      }
    >
      <TvEconomicCalendar importance={imp} />
    </Panel>
  );
}

export default function News() {
  // Headlines refresh every minute while the page is visible.
  const { data, error, loading, at } = usePoll<NewsItem[]>("/api/news", 60_000);
  const [src, setSrc] = useState<string>("Todas");
  const sources = ["Todas", ...new Set((data ?? []).map((n) => n.source))];
  const list = (data ?? []).filter((n) => src === "Todas" || n.source === src);

  return (
    <Panel
      title="Noticias de mercado"
      right={
        <div className="flex items-center gap-2">
        <span className="hidden sm:inline">act. <Updated at={at} /></span>
        <div role="group" aria-label="Fuente" className="flex">
          {sources.map((s) => (
            <button key={s} onClick={() => setSrc(s)} aria-pressed={src === s} className={`btn h-6 px-2 text-[11px] ${src === s ? "bg-amber text-black" : "text-muted hover:text-text"}`}>{s}</button>
          ))}
        </div>
        </div>
      }
    >
      {loading && <p className="p-3 text-muted">Cargando titulares…</p>}
      {error && <p className="p-3 text-down">{error}</p>}
      <ul>
        {list.map((n) => (
          <li key={n.link} className="border-b border-line/60">
            <a href={n.link} target="_blank" rel="noreferrer" className="row-hover grid grid-cols-[52px_1fr] gap-3 px-3 py-2 sm:grid-cols-[52px_1fr_160px]">
              <time className="text-amber" dateTime={new Date(n.time).toISOString()}>
                {new Date(n.time).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </time>
              <span className="leading-snug">{n.title}</span>
              <span className="hidden truncate text-right text-[11px] text-muted sm:block">{n.source}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="p-3 text-[11px] text-muted">Titulares en inglés, enlazados a su fuente original.</p>
    </Panel>
  );
}
