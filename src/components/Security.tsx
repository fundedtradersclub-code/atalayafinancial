"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ExternalLink, Star } from "lucide-react";
import type { ChartData, NewsItem, Quote } from "@/lib/market";
import type { Fundamentals } from "@/lib/sec";
import { Panel, SourceTag, Tick, Updated, dir, fmt, fmtBig, fmtPrice, inputCls, isClosed, pct, usePoll } from "./ui";
import type { View } from "./Terminal";

const TradingViewChart = dynamic(() => import("./TradingViewChart"), { ssr: false });
const ProChart = dynamic(() => import("./ProChart"), { ssr: false, loading: () => <div className="grid h-full min-h-[420px] place-items-center text-muted">Cargando gráfico…</div> });

const INTERVALS = [
  { id: "1m", label: "1m", title: "1 minuto · últimos 5 días" },
  { id: "5m", label: "5m", title: "5 minutos · último mes" },
  { id: "15m", label: "15m", title: "15 minutos · último mes" },
  { id: "30m", label: "30m", title: "30 minutos · 60 días" },
  { id: "1h", label: "1H", title: "1 hora · 6 meses" },
  { id: "4h", label: "4H", title: "4 horas · 1 año" },
  { id: "1d", label: "D", title: "Diario · 2 años" },
  { id: "1w", label: "S", title: "Semanal · 10 años" },
  { id: "1mo", label: "M", title: "Mensual · todo el historial" },
] as const;
type Interval = (typeof INTERVALS)[number]["id"];

type ChartSource = "atalaya" | "tv";
function loadSource(): ChartSource {
  try { return localStorage.getItem("atalaya.chartsrc") === "tv" ? "tv" : "atalaya"; } catch { return "atalaya"; }
}

function loadInterval(): Interval {
  try { const v = localStorage.getItem("atalaya.interval"); if (INTERVALS.some((x) => x.id === v)) return v as Interval; } catch { /* ignore */ }
  return "1d";
}

export default function Security({
  symbol, watched, onToggleWatch, onTrade, onGo,
}: {
  symbol: string;
  watched: boolean;
  onToggleWatch: () => void;
  onTrade: (side: "BUY" | "SELL", qty: number) => void;
  onGo: (v: View) => void;
}) {
  const [interval, setIntervalId] = useState<Interval>(loadInterval);
  const pickInterval = (i: Interval) => {
    setIntervalId(i);
    try { localStorage.setItem("atalaya.interval", i); } catch { /* ignore */ }
  };
  const [source, setSource] = useState<ChartSource>(loadSource);
  const pickSource = (v: ChartSource) => {
    setSource(v);
    try { localStorage.setItem("atalaya.chartsrc", v); } catch { /* ignore */ }
  };
  const fast = interval === "1m" || interval === "5m" || interval === "15m";
  const { data, error, loading } = usePoll<ChartData>(`/api/chart?s=${encodeURIComponent(symbol)}&i=${interval}`, fast ? 20_000 : 60_000);
  // Header price refreshes on its own fast loop; the chart reloads less often.
  const live = usePoll<Quote[]>(`/api/quotes?s=${encodeURIComponent(symbol)}`, 5_000);
  const lq = live.data?.[0];
  const lp = live.prev?.[0]?.price;
  const s: Record<string, number | null> | undefined = data?.stats ? { ...data.stats, price: lq?.price ?? data.stats.price } : undefined;
  const closed = lq ? isClosed(lq, live.at) : false;
  const chg = s?.price != null && s?.prevClose ? s.price - s.prevClose : null;
  const chgPct = chg != null && s?.prevClose ? (chg / s.prevClose) * 100 : null;
  const isEquity = data?.type === "EQUITY" && /^[A-Z.\-]{1,6}$/.test(symbol);

  // No data from our sources (no key, or unknown here): TradingView still shows the market.
  const useTv = source === "tv" || !!error;

  return (
    <div className="grid h-full gap-1.5 sm:gap-2 lg:grid-cols-[1fr_320px] lg:grid-rows-[auto_auto_auto]">
      {/* Header strip */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border border-line bg-panel px-3 py-2 lg:col-span-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-cond text-[20px] font-semibold tracking-wide text-amber">{symbol}</h1>
            <button onClick={onToggleWatch} aria-pressed={watched} aria-label={watched ? "Quitar de mi lista" : "Añadir a mi lista"} className="btn grid size-7 place-items-center text-muted hover:text-amber">
              <Star size={15} fill={watched ? "var(--amber)" : "none"} color={watched ? "var(--amber)" : "currentColor"} />
            </button>
          </div>
          <p className="truncate text-[12px] text-muted">{data ? `${data.name} · ${data.exchange} · ${data.currency}` : loading ? "Cargando…" : ""}</p>
          {error && <p className="max-w-[520px] text-[11px] text-amber">Sin datos propios para {symbol}: {error} Te muestro el gráfico de TradingView.</p>}
        </div>
        <div className="flex items-baseline gap-3">
          <Tick value={s?.price} prev={lp} className="text-[26px] leading-none">{fmtPrice(symbol, s?.price)}</Tick>
          <span className={`text-[15px] ${dir(chg)}`}>{chg == null ? "" : `${chg > 0 ? "+" : ""}${fmtPrice(symbol, chg)}`}</span>
          <span className={`text-[15px] ${dir(chgPct)}`}>{pct(chgPct)}</span>
        </div>
        <div className="flex flex-col text-[11px] text-muted">
          {data && <SourceTag live={lq?.live ?? data.live} source={lq?.source} />}
          {closed ? <span title={lq?.time ? `Último dato: ${new Date(lq.time * 1000).toLocaleString("es-EC")}` : ""}>mercado cerrado</span> : <Updated at={live.at} />}
        </div>
        <div className="ml-auto flex gap-1">
          <button onClick={() => onGo("RISK")} className="btn h-8 border border-line-strong px-3 font-cond text-[12px] uppercase tracking-wider text-text hover:border-amber hover:text-amber">Riesgo</button>
          <button onClick={() => onGo("CALC")} className="btn h-8 border border-line-strong px-3 font-cond text-[12px] uppercase tracking-wider text-text hover:border-amber hover:text-amber">Calcular</button>
        </div>
      </div>

      <Panel
        title="Gráfico"
        className="min-h-[520px]"
        right={
          <div className="flex flex-wrap items-center justify-end gap-2">
          <div role="group" aria-label="Fuente del gráfico" className="flex border border-line-strong">
            {([["atalaya", "ATALAYA"], ["tv", "TradingView"]] as const).map(([id, label]) => (
              <button key={id} onClick={() => pickSource(id)} aria-pressed={(id === "tv") === useTv} disabled={id === "atalaya" && !!error}
                className={`btn h-6 px-2 text-[11px] disabled:opacity-35 ${(id === "tv") === useTv ? "bg-amber text-black" : "text-muted hover:text-text"}`}>{label}</button>
            ))}
          </div>
          <div role="group" aria-label="Temporalidad" className="flex">
            {INTERVALS.map((r) => (
              <button key={r.id} onClick={() => pickInterval(r.id)} aria-pressed={interval === r.id} title={r.title} className={`btn h-6 min-w-7 px-1.5 text-[11px] ${interval === r.id ? "bg-amber text-black" : "text-muted hover:text-text"}`}>{r.label}</button>
            ))}
          </div>
          </div>
        }
      >
        {useTv ? (
          <TradingViewChart symbol={symbol} interval={interval} />
        ) : data && data.candles.length > 0 ? (
          <ProChart key={symbol} symbol={symbol} candles={data.candles} intraday={!["1d", "1w", "1mo"].includes(interval)} frame={interval} livePrice={lq?.source ? lq.price : null} />
        ) : (
          <div className="grid h-full min-h-[420px] place-items-center text-muted">{loading ? "Cargando…" : "Sin datos para esta temporalidad"}</div>
        )}
      </Panel>

      <div className="flex min-h-0 flex-col gap-1.5 sm:gap-2 lg:row-span-2">
        <Panel title="Sesión" className="shrink-0">
          <dl className="grid grid-cols-2 text-[12px]">
            {[
              ["Apertura", fmtPrice(symbol, s?.open)],
              ["Cierre ant.", fmtPrice(symbol, s?.prevClose)],
              ["Máximo", fmtPrice(symbol, s?.dayHigh)],
              ["Mínimo", fmtPrice(symbol, s?.dayLow)],
              ["Volumen", fmtBig(s?.volume)],
              ["Máx. 52 sem", fmtPrice(symbol, s?.high52)],
              ["Mín. 52 sem", fmtPrice(symbol, s?.low52)],
              ["Vs. máx. 52s", s?.price && s?.high52 ? pct(((s.price - s.high52) / s.high52) * 100) : "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 border-b border-line/60 px-2 py-1.5">
                <dt className="font-cond text-[11px] uppercase tracking-wider text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {s?.high52 != null && s?.low52 != null && s?.price != null && <Range52 low={s.low52} high={s.high52} price={s.price} />}
        </Panel>
        <TradeBox onTrade={onTrade} />
        <SymbolNews symbol={symbol} />
      </div>

      {isEquity && <Filings symbol={symbol} />}
    </div>
  );
}

function Range52({ low, high, price }: { low: number; high: number; price: number }) {
  const p = Math.max(0, Math.min(1, (price - low) / (high - low || 1)));
  return (
    <div className="px-2 pb-2 pt-3" aria-label={`Precio en el ${Math.round(p * 100)}% del rango de 52 semanas`}>
      <div className="relative h-1 bg-line-strong">
        <div className="absolute -top-1 h-3 w-0.5 bg-amber" style={{ left: `${p * 100}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted"><span>mín 52s</span><span>{Math.round(p * 100)}% del rango</span><span>máx 52s</span></div>
    </div>
  );
}

function TradeBox({ onTrade }: { onTrade: (side: "BUY" | "SELL", qty: number) => void }) {
  const [qty, setQty] = useState("1");
  const n = Number(qty);
  return (
    <Panel title="Orden simulada" className="shrink-0" right={<span>sin dinero real</span>}>
      <div className="flex items-end gap-2 p-2">
        <label className="flex-1">
          <span className="sr-only">Cantidad</span>
          <input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} aria-label="Cantidad" />
        </label>
        <button disabled={!(n > 0)} onClick={() => onTrade("BUY", n)} className="btn h-9 bg-up px-4 font-semibold text-black disabled:opacity-40">Comprar</button>
        <button disabled={!(n > 0)} onClick={() => onTrade("SELL", n)} className="btn h-9 bg-down px-4 font-semibold text-black disabled:opacity-40">Vender</button>
      </div>
    </Panel>
  );
}

function SymbolNews({ symbol }: { symbol: string }) {
  const { data } = usePoll<NewsItem[]>(`/api/news?s=${encodeURIComponent(symbol)}`, 300_000);
  return (
    <Panel title="Noticias del símbolo" className="min-h-[200px] flex-1">
      <ul>
        {(data ?? []).map((n) => (
          <li key={n.link} className="border-b border-line/60">
            <a href={n.link} target="_blank" rel="noreferrer" className="row-hover block px-2 py-1.5">
              <span className="block text-[12px] leading-snug">{n.title}</span>
              <span className="text-[10px] text-muted">{n.source} · {new Date(n.time).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}</span>
            </a>
          </li>
        ))}
        {data && data.length === 0 && <li className="p-2 text-muted">Sin noticias recientes.</li>}
      </ul>
    </Panel>
  );
}

function Filings({ symbol }: { symbol: string }) {
  const { data, error, loading } = usePoll<Fundamentals | null>(`/api/fundamentals?s=${encodeURIComponent(symbol)}`, 0);
  return (
    <Panel title="Estados financieros · SEC EDGAR" right={data ? <span>CIK {data.cik}</span> : null}>
      {loading && <p className="p-2 text-muted">Consultando la SEC…</p>}
      {error && <p className="p-2 text-muted">La SEC no respondió ({error}).</p>}
      {!loading && !error && !data && <p className="p-2 text-muted">Solo empresas que reportan a la SEC de EE. UU.</p>}
      {data && (
        <div className="grid gap-2 p-2 xl:grid-cols-[1fr_380px]">
          <table className="w-full border-collapse text-[12px]">
            <caption className="sr-only">Cifras anuales en USD</caption>
            <thead>
              <tr className="font-cond text-[10px] uppercase tracking-wider text-muted">
                <th scope="col" className="py-1 text-left font-normal">Año calendario (USD)</th>
                {data.years.map((y) => <th scope="col" key={y} className="py-1 text-right font-normal">{y}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.key} className="border-t border-line/60">
                  <th scope="row" className="py-1.5 text-left font-normal text-muted">{r.label}</th>
                  {r.values.map((v, i) => <td key={i} className={`py-1.5 text-right ${v != null && v < 0 ? "down" : ""}`}>{r.key === "eps" ? fmt(v, 2) : fmtBig(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="border-l border-line pl-2">
            <li className="ph pb-1">Reportes recientes</li>
            {data.filings.map((f) => (
              <li key={f.url}>
                <a href={f.url} target="_blank" rel="noreferrer" className="row-hover grid grid-cols-[56px_80px_1fr_14px] items-center gap-2 py-1 text-[12px]">
                  <span className="text-amber">{f.form}</span>
                  <span className="text-muted">{f.date}</span>
                  <span className="truncate">{f.desc}</span>
                  <ExternalLink size={12} className="text-muted" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
