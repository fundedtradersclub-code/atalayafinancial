"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALIASES, groupsFor, tapeFor } from "@/lib/symbols";
import type { Quote } from "@/lib/market";
import { Tick, dir, fmtPrice, pct, usePoll, useInterval } from "./ui";
import { BookOpen } from "lucide-react";
import Markets from "./Markets";
import Security from "./Security";
import Risk from "./Risk";
import Calc from "./Calc";
import Portfolio, { type Paper, emptyPaper, placeOrder } from "./Portfolio";
import News, { CalendarView } from "./News";
import Help from "./Help";
import TrendView from "./Trend";
import Analyst from "./Analyst";
import Gate, { hasAccepted } from "./Gate";
import { apiFetch } from "./keys";
import Connections from "./Connections";
import { startNinja } from "./ninja";
import { startMt5 } from "./mt5client";
import Logo from "./Logo";
import LangToggle from "./LangToggle";
import { lang } from "./i18n";

export type View = "MKT" | "DES" | "TREND" | "RISK" | "AI" | "CALC" | "PORT" | "NEWS" | "CAL" | "HELP" | "KEYS";

const TABS: { v: View; label: string; key: string }[] = [
  { v: "MKT", label: "Mercados", key: "1" },
  { v: "DES", label: "Símbolo", key: "2" },
  { v: "TREND", label: "Tendencia", key: "3" },
  { v: "RISK", label: "Riesgo", key: "4" },
  { v: "AI", label: "Analista IA", key: "5" },
  { v: "CALC", label: "Calculadoras", key: "6" },
  { v: "PORT", label: "Cartera", key: "7" },
  { v: "NEWS", label: "Noticias", key: "8" },
  { v: "CAL", label: "Calendario", key: "C" },
  { v: "HELP", label: "Ayuda", key: "9" },
  { v: "KEYS", label: "Conexiones", key: "0" },
];

const COMMANDS: Record<string, View> = {
  MERC: "MKT", MKT: "MKT", MERCADOS: "MKT", DES: "DES",
  TEND: "TREND", TENDENCIA: "TREND", TREND: "TREND",
  RIESGO: "RISK", RISK: "RISK", CALC: "CALC",
  IA: "AI", AI: "AI", ANALISTA: "AI",
  CARTERA: "PORT", PORT: "PORT", NOT: "NEWS", NEWS: "NEWS", NOTICIAS: "NEWS",
  CAL: "CAL", CALENDARIO: "CAL", CALENDAR: "CAL",
  AYUDA: "HELP", HELP: "HELP",
  CONEXIONES: "KEYS", API: "KEYS", KEYS: "KEYS",
};

type Hit = { symbol: string; name: string; type: string; exchange: string };

function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode: keep in memory */ }
}

export default function Terminal() {
  // Client-only component (see ClientTerminal), so lazy localStorage reads are safe.
  const [view, setView] = useState<View>(() => load("atalaya.last", { view: "MKT" as View, symbol: "BTC-USD" }).view);
  const [symbol, setSymbol] = useState(() => load("atalaya.last", { view: "MKT" as View, symbol: "BTC-USD" }).symbol);
  const [watch, setWatch] = useState<string[]>(() => load("atalaya.watch", ["AAPL", "NVDA", "MSFT", "TSLA", "BTC-USD"]));
  const [paper, setPaper] = useState<Paper>(() => load("atalaya.paper", emptyPaper));
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [accepted, setAccepted] = useState(hasAccepted);
  const config = usePoll<{ mode: "personal" | "public"; aiShared: boolean }>("/api/config", 0).data;
  const mode = config?.mode ?? "public";
  // Each visitor's own NinjaTrader / MetaTrader 5 bridges, read from this browser (public site too).
  useEffect(() => { startNinja(); startMt5(); }, []);
  // Chat lives here so it survives switching tabs.
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  useEffect(() => save("atalaya.watch", watch), [watch]);
  useEffect(() => save("atalaya.paper", paper), [paper]);
  useEffect(() => save("atalaya.last", { view, symbol }), [view, symbol]);

  const flash = useCallback((text: string, tone: "ok" | "err" = "ok") => {
    setMsg({ text, tone });
    window.setTimeout(() => setMsg((m) => (m?.text === text ? null : m)), 5000);
  }, []);

  const open = useCallback((s: string, v: View = "DES") => { setSymbol(s); setView(v); }, []);

  const trade = useCallback(
    async (side: "BUY" | "SELL", qty: number, s: string) => {
      const r = await apiFetch(`/api/quotes?s=${encodeURIComponent(s)}`).then((x) => x.json()).catch(() => null);
      const q = Array.isArray(r) ? (r[0] as Quote | undefined) : undefined;
      if (!q?.price) return flash(`Sin precio para ${s}`, "err");
      setPaper((p) => {
        const res = placeOrder(p, side, s, qty, q.price!);
        if ("error" in res) { flash(res.error, "err"); return p; }
        flash(`${side === "BUY" ? "Compra" : "Venta"} simulada: ${qty} ${s} @ ${fmtPrice(s, q.price)}`);
        return res.paper;
      });
    },
    [flash],
  );

  const run = useCallback(
    (raw: string) => {
      const parts = raw.trim().toUpperCase().split(/\s+/).filter(Boolean);
      if (!parts.length) return;
      const [head, ...rest] = parts;
      if (COMMANDS[head]) {
        if (rest[0]) setSymbol(ALIASES[rest[0]] ?? rest[0]);
        setView(COMMANDS[head]);
        return;
      }
      if (["COMPRAR", "BUY", "VENDER", "SELL"].includes(head)) {
        const qty = Number(rest[0]);
        const s = rest[1] ? (ALIASES[rest[1]] ?? rest[1]) : symbol;
        if (!(qty > 0)) return flash("Uso: COMPRAR 10 AAPL", "err");
        void trade(head === "COMPRAR" || head === "BUY" ? "BUY" : "SELL", qty, s);
        return;
      }
      if (["VIGILAR", "WATCH"].includes(head) && rest[0]) {
        const s = ALIASES[rest[0]] ?? rest[0];
        setWatch((w) => (w.includes(s) ? w : [...w, s]));
        return flash(`${s} añadido a tu lista`);
      }
      if (["QUITAR", "UNWATCH"].includes(head) && rest[0]) {
        setWatch((w) => w.filter((x) => x !== (ALIASES[rest[0]] ?? rest[0])));
        return;
      }
      const s = ALIASES[head] ?? head;
      open(s, rest[0] && COMMANDS[rest[0]] ? COMMANDS[rest[0]] : "DES");
    },
    [open, symbol, trade, flash],
  );

  // Global shortcuts: "/" or Ctrl+K focuses the command line, Alt+1..7 switches view.
  const cmdRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input,textarea,select");
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        cmdRef.current?.focus();
        cmdRef.current?.select();
      }
      if (e.altKey && /^[0-9c]$/i.test(e.key)) {
        e.preventDefault();
        setView(TABS.find((t) => t.key === e.key.toUpperCase())!.v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!accepted) return <Gate onAccept={() => setAccepted(true)} />;

  return (
    <div className="flex h-full flex-col">
      <TopBar cmdRef={cmdRef} onRun={run} onPick={(s) => open(s)} mode={config?.mode ?? null} onKeys={() => setView("KEYS")} />
      {config && <Tape symbols={tapeFor(mode)} onPick={(s) => open(s)} />}
      <nav aria-label="Funciones" className="flex shrink-0 overflow-x-auto border-b border-line bg-panel">
        {TABS.map((t) => (
          <button
            key={t.v}
            onClick={() => setView(t.v)}
            aria-current={view === t.v ? "page" : undefined}
            className={`btn flex h-9 shrink-0 items-center gap-2 border-r border-line px-3 font-cond text-[12px] uppercase tracking-wider ${
              view === t.v ? "bg-amber text-black" : "text-muted hover:text-text"
            }`}
          >
            <span className={`text-[10px] ${view === t.v ? "text-black/60" : "text-amber-dim"}`}>{t.key}</span>
            {t.label}
          </button>
        ))}
        <div className="ml-auto hidden items-center gap-2 px-3 text-[11px] text-muted lg:flex">
          Símbolo activo <span className="text-amber">{symbol}</span>
        </div>
      </nav>

      <main className="min-h-0 flex-1 overflow-auto p-1.5 sm:p-2" key={view}>
        <div className="view-in h-full">
          {view === "MKT" && (
            config && <Markets groups={groupsFor(mode)} mode={mode} onKeys={() => setView("KEYS")} watch={watch} onPick={open} onUnwatch={(s) => setWatch((w) => w.filter((x) => x !== s))} />
          )}
          {view === "DES" && (
            <Security
              symbol={symbol}
              watched={watch.includes(symbol)}
              onToggleWatch={() => setWatch((w) => (w.includes(symbol) ? w.filter((x) => x !== symbol) : [...w, symbol]))}
              onTrade={(side, qty) => trade(side, qty, symbol)}
              onGo={setView}
            />
          )}
          {view === "TREND" && <TrendView symbol={symbol} watch={watch} onPick={(s) => open(s, "TREND")} />}
          {view === "AI" && <Analyst symbol={symbol} msgs={chat} setMsgs={setChat} />}
          {view === "RISK" && <Risk symbol={symbol} />}
          {view === "CALC" && <Calc symbol={symbol} />}
          {view === "PORT" && (
            <Portfolio paper={paper} onReset={() => setPaper(emptyPaper)} onPick={open} onTrade={trade} />
          )}
          {view === "NEWS" && <News />}
          {view === "CAL" && <CalendarView />}
          {view === "HELP" && <Help onRun={run} />}
          {view === "KEYS" && <Connections mode={mode} />}
        </div>
      </main>

      <footer className="shrink-0 border-t border-line bg-panel px-2 py-1 text-[10.5px] leading-snug text-muted">
        <p aria-live="polite" className={`truncate ${msg ? (msg.tone === "ok" ? "text-up" : "text-down") : "text-text/80"}`}>
          {msg?.text ??
            `Los datos pertenecen a sus dueños (${mode === "personal" ? "Yahoo Finance, " : "tus proveedores conectados, "}Binance, BCE, SEC EDGAR, TradingCalc, medios citados) y se muestran solo con fines informativos. Nada aquí es recomendación de inversión. Invertir tiene alto riesgo: cada persona asume el riesgo de su dinero.`}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <a href={lang() === "en" ? "/manual/en" : "/manual"} target="_blank" className="text-amber hover:underline">Manual</a>
          <a href={"/terminos" + (lang() === "en" ? "#en" : "")} target="_blank" className="hover:text-amber">Términos y riesgo</a>
          <a href={"/privacidad" + (lang() === "en" ? "#en" : "")} target="_blank" className="hover:text-amber">Privacidad</a>
          <a href={"/cookies" + (lang() === "en" ? "#en" : "")} target="_blank" className="hover:text-amber">Cookies</a>
          <a href={"/fuentes" + (lang() === "en" ? "#en" : "")} target="_blank" className="hover:text-amber">Fuentes de datos</a>
          <a href="/reclamos" target="_blank" className="hover:text-amber" title="¿Algún problema con un dato o contenido? Escríbenos y lo resolvemos de buena fe">Reclamos</a>
          <a href="https://www.instagram.com/elmigrante.digital/" target="_blank" rel="noreferrer" className="ml-auto hover:text-amber">
            Hecho por @elmigrante.digital
          </a>
        </div>
      </footer>
    </div>
  );
}

function TopBar({ cmdRef, onRun, onPick, mode, onKeys }: { cmdRef: React.RefObject<HTMLInputElement | null>; onRun: (s: string) => void; onPick: (s: string) => void; mode: "personal" | "public" | null; onKeys: () => void }) {
  const [q, setQ] = useState("");
  const [found, setFound] = useState<{ term: string; hits: Hit[] }>({ term: "", hits: [] });
  const [hi, setHi] = useState(-1);
  const [openList, setOpenList] = useState(false);

  const term = q.trim();
  const first = term.split(/\s+/)[0]?.toUpperCase() ?? "";
  const searchable = term.length >= 2 && !COMMANDS[first] && !/^(COMPRAR|BUY|VENDER|SELL|VIGILAR|WATCH|QUITAR|UNWATCH)$/.test(first);
  // Only show results that belong to what's typed right now.
  const hits = searchable && found.term === term ? found.hits : [];

  useEffect(() => {
    if (!searchable) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      apiFetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((h: Hit[]) => { setFound({ term, hits: h }); setHi(-1); })
        .catch(() => {});
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [term, searchable]);

  const submit = () => {
    if (hi >= 0 && hits[hi]) onPick(hits[hi].symbol);
    else onRun(q);
    setQ(""); setOpenList(false);
    cmdRef.current?.blur();
  };

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-strong bg-bg px-2 py-1.5">
      <div className="flex items-center gap-2">
        <span className="shrink-0" role="img" aria-label="ATALAYA Financial"><Logo size={28} /></span>
        <LangToggle />
        <a
          href={lang() === "en" ? "/manual/en" : "/manual"}
          target="_blank"
          title="Manual de uso: cómo usar cada pantalla y conectar APIs, MetaTrader y NinjaTrader"
          className="btn flex h-6 items-center gap-1 border border-amber-dim px-1.5 font-cond text-[11px] uppercase tracking-wider text-amber hover:bg-amber hover:text-black"
        >
          <BookOpen size={12} aria-hidden="true" /> Manual
        </a>
        {mode && (
          <button onClick={onKeys} title="Fuentes de datos y API keys" className="btn border border-line-strong px-1.5 font-cond text-[10px] uppercase tracking-wider text-muted hover:border-amber hover:text-amber">
            {mode === "personal" ? "personal" : "pública"}
          </button>
        )}
      </div>

      <div className="relative order-3 w-full sm:order-none sm:w-auto sm:min-w-[340px] sm:flex-1 lg:max-w-[560px]">
        <div className="flex h-8 items-center border border-amber-dim bg-panel focus-within:border-amber">
          <span className="px-2 text-amber" aria-hidden="true">&gt;</span>
          <input
            ref={cmdRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpenList(true); }}
            onFocus={() => setOpenList(true)}
            onBlur={() => setTimeout(() => setOpenList(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); submit(); }
              else if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(i + 1, hits.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(i - 1, -1)); }
              else if (e.key === "Escape") { setQ(""); cmdRef.current?.blur(); }
            }}
            placeholder="Símbolo o comando: AAPL · NQ · BTC · RIESGO · COMPRAR 10 AAPL"
            aria-label="Línea de comandos"
            role="combobox"
            aria-expanded={openList && hits.length > 0}
            aria-controls="cmd-hits"
            autoComplete="off"
            spellCheck={false}
            className="h-full w-full min-w-0 bg-transparent pr-2 uppercase text-text outline-none placeholder:normal-case placeholder:text-muted"
          />
          <kbd className="mr-1 hidden shrink-0 border border-line-strong px-1 text-[10px] text-muted sm:block">/</kbd>
        </div>
        {openList && hits.length > 0 && (
          <ul id="cmd-hits" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-px max-h-80 overflow-auto border border-line-strong bg-panel shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
            {hits.map((h, i) => (
              <li key={h.symbol} role="option" aria-selected={i === hi}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); onPick(h.symbol); setQ(""); cmdRef.current?.blur(); }}
                  className={`grid w-full grid-cols-[110px_1fr_auto] gap-2 px-2 py-1.5 text-left ${i === hi ? "bg-amber text-black" : "row-hover"}`}
                >
                  <span className={i === hi ? "" : "text-amber"}>{h.symbol}</span>
                  <span className="truncate">{h.name}</span>
                  <span className={`text-[11px] ${i === hi ? "text-black/70" : "text-muted"}`}>{h.type} · {h.exchange}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Clocks />
    </header>
  );
}

const ZONES = [
  { id: "NY", tz: "America/New_York", open: [9 * 60 + 30, 16 * 60] },
  { id: "LDN", tz: "Europe/London", open: [8 * 60, 16 * 60 + 30] },
  { id: "TYO", tz: "Asia/Tokyo", open: [9 * 60, 15 * 60 + 30] },
  { id: "GYE", tz: "America/Guayaquil", open: null },
] as const;

function Clocks() {
  const [now, setNow] = useState(() => new Date());
  useInterval(() => setNow(new Date()), 1000);
  return (
    <div className="ml-auto flex items-center gap-3 text-[11px]">
      {ZONES.map((z) => {
        const parts = new Intl.DateTimeFormat("en-GB", { timeZone: z.tz, hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false }).formatToParts(now);
        const h = Number(parts.find((p) => p.type === "hour")?.value);
        const m = Number(parts.find((p) => p.type === "minute")?.value);
        const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
        const mins = h * 60 + m;
        const isOpen = z.open && !["Sat", "Sun"].includes(wd) && mins >= z.open[0] && mins < z.open[1];
        return (
          <div key={z.id} className={`flex items-center gap-1.5 ${z.id === "GYE" ? "" : "hidden md:flex"}`} title={z.open ? (isOpen ? "Bolsa abierta (horario regular, sin feriados)" : "Bolsa cerrada") : "Tu hora local"}>
            {z.open && <span className={`inline-block size-1.5 rounded-full ${isOpen ? "bg-up" : "bg-line-strong"}`} />}
            <span className="font-cond uppercase tracking-wider text-muted">{z.id}</span>
            <span className={z.id === "GYE" ? "text-amber" : "text-text"}>{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}</span>
          </div>
        );
      })}
    </div>
  );
}

function Tape({ symbols, onPick }: { symbols: string[]; onPick: (s: string) => void }) {
  const { data, prev } = usePoll<Quote[]>(`/api/quotes?s=${encodeURIComponent(symbols.join(","))}`, 10_000);
  const before = useMemo(() => new Map((prev ?? []).map((q) => [q.symbol, q.price])), [prev]);
  const items = useMemo(() => (data ?? []).filter((q) => q.price != null), [data]);
  return (
    <div className="tape relative h-7 shrink-0 overflow-hidden border-b border-line bg-bg" aria-label="Cinta de precios">
      {items.length > 0 && (
        <div className="tape-track flex h-full w-max items-center">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center" aria-hidden={k === 1}>
              {items.map((q) => (
                <button key={q.symbol + k} tabIndex={k === 1 ? -1 : 0} onClick={() => onPick(q.symbol)} className="flex items-center gap-2 border-r border-line px-3 text-[12px]">
                  <span className="text-amber">{q.name}</span>
                  <Tick value={q.price} prev={before.get(q.symbol)}>{fmtPrice(q.symbol, q.price)}</Tick>
                  <span className={dir(q.changePct)}>{pct(q.changePct)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
