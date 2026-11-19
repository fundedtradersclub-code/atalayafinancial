"use client";

import { useEffect, useRef, useState } from "react";
import { decimalsFor } from "@/lib/symbols";
import { apiFetch } from "./keys";
import { ninja } from "./ninja";
import { mt5 } from "./mt5client";

/** Fetch JSON and refresh every `ms` (0 = once). State is keyed by URL, so a new URL never shows stale data. */
export function usePoll<T>(url: string | null, ms: number) {
  const [state, setState] = useState<{ url: string; data: T | null; prev: T | null; at: number; error: string | null }>({ url: "", data: null, prev: null, at: 0, error: null });
  useEffect(() => {
    if (!url) return;
    let alive = true;
    const ctrl = new AbortController();
    let failed = false;
    const load = async () => {
      try {
        const r = await apiFetch(url, { signal: ctrl.signal });
        const j = await r.json();
        if (!alive) return;
        if (!r.ok || (j && typeof j === "object" && !Array.isArray(j) && "error" in j)) {
          failed = true;
          setState((s) => ({ ...s, url, data: s.url === url ? s.data : null, error: j?.error ?? `Error ${r.status}` }));
        } else {
          failed = false;
          setState((s) => ({ url, data: j as T, prev: s.url === url ? s.data : null, at: Date.now(), error: null }));
        }
      } catch (e) {
        if (alive && (e as Error).name !== "AbortError") {
          failed = true;
          setState((s) => ({ ...s, url, data: s.url === url ? s.data : null, error: "Sin conexión con la fuente" }));
        }
      }
    };
    load();
    window.addEventListener("atalaya-keys", load); // new key typed: refetch right away
    // With NinjaTrader or MetaTrader connected, quote panels follow their 1-second pulse, and anything
    // that failed before the bridge answered (e.g. an MT5 chart on first load) is retried right away.
    const onNinja = () => { if ((ninja() || mt5()) && !document.hidden && (url.startsWith("/api/quotes") || failed)) load(); };
    window.addEventListener("atalaya-ninja", onNinja);
    window.addEventListener("atalaya-mt5", onNinja);
    const id = ms > 0 ? setInterval(() => { if (!document.hidden) load(); }, ms) : undefined;
    return () => { alive = false; ctrl.abort(); window.removeEventListener("atalaya-keys", load); window.removeEventListener("atalaya-ninja", onNinja); window.removeEventListener("atalaya-mt5", onNinja); if (id) clearInterval(id); };
  }, [url, ms]);
  const mine = url != null && state.url === url;
  return { data: mine ? state.data : null, prev: mine ? state.prev : null, at: mine ? state.at : 0, error: mine ? state.error : null, loading: url != null && !mine };
}

export function fmt(v: number | null | undefined, d = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtPrice(symbol: string, v: number | null | undefined) {
  if (v == null) return "—";
  return fmt(v, decimalsFor(symbol, Math.abs(v)));
}

export function fmtBig(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e12) return `${fmt(v / 1e12, 2)}T`;
  if (a >= 1e9) return `${fmt(v / 1e9, 2)}B`;
  if (a >= 1e6) return `${fmt(v / 1e6, 2)}M`;
  if (a >= 1e3) return `${fmt(v / 1e3, 1)}K`;
  return fmt(v, 2);
}

export function pct(v: number | null | undefined, d = 2) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${fmt(v, d)}%`;
}

export const dir = (v: number | null | undefined) => (v == null || v === 0 ? "text-text" : v > 0 ? "up" : "down");

export function Panel({ title, right, children, className = "" }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex min-h-0 flex-col border border-line bg-panel ${className}`} aria-label={title}>
      <header className="flex h-7 shrink-0 items-center justify-between gap-2 border-b border-line bg-panel-2 px-2">
        <h2 className="ph truncate">{title}</h2>
        {right && <div className="flex items-center gap-2 text-[11px] text-muted">{right}</div>}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}

export function Sparkline({ data, up, w = 72, h = 20 }: { data: number[]; up: boolean; w?: number; h?: number }) {
  if (data.length < 2) return <span className="inline-block" style={{ width: w }} />;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * w).toFixed(1)},${(h - ((v - min) / span) * (h - 2) - 1).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="block">
      <polyline points={pts} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth="1.25" />
    </svg>
  );
}

export function SourceTag({ live, source }: { live: boolean; source?: string }) {
  if (source) {
    return (
      <span className="inline-flex items-center gap-1 text-up" title={`${source}, tiempo real desde esta PC`}>
        <span className="live-dot inline-block size-1.5 rounded-full bg-up" />{source.toUpperCase()}
      </span>
    );
  }
  return live ? (
    <span className="inline-flex items-center gap-1 text-up" title="Binance, tiempo real">
      <span className="live-dot inline-block size-1.5 rounded-full bg-up" />EN VIVO
    </span>
  ) : (
    <span className="text-muted" title="Yahoo Finance, normalmente 10-15 min de retraso">RETRASO</span>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-cond text-[11px] uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "h-9 w-full border border-line-strong bg-bg px-2 text-text outline-none transition-[border-color] duration-150 focus:border-amber";

export function useInterval(fn: () => void, ms: number) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/** Re-mounts on every new value so the flash replays: green if it ticked up, red if down. */
export function Tick({ value, prev, children, className = "" }: { value: number | null | undefined; prev: number | null | undefined; children: React.ReactNode; className?: string }) {
  const d = value != null && prev != null && value !== prev ? (value > prev ? "tick-up" : "tick-down") : "";
  return <span key={String(value)} className={`tick ${d} ${className}`}>{children}</span>;
}

/** Delayed sources with no new bar in 30+ minutes: the market is closed (or halted). */
export function isClosed(q: { live: boolean; time: number | null }, nowMs: number) {
  return !q.live && q.time != null && nowMs / 1000 - q.time > 30 * 60;
}

export function Updated({ at }: { at: number }) {
  if (!at) return null;
  return <span title="Última actualización">{new Date(at).toLocaleTimeString("es-EC", { hour12: false })}</span>;
}
