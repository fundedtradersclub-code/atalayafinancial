"use client";

import { Moon, X } from "lucide-react";
import { type Group, isYield } from "@/lib/symbols";
import type { Quote } from "@/lib/market";
import { hasKey } from "./keys";
import { useMt5 } from "./mt5client";
import { useNinja } from "./ninja";
import dynamic from "next/dynamic";

const TvMarketOverview = dynamic(() => import("./TradingViewChart").then((m) => m.TvMarketOverview), { ssr: false });
const TvQuotes = dynamic(() => import("./TradingViewChart").then((m) => m.TvQuotes), { ssr: false });
const ETF_GROUPS = new Set(["idx", "cmd", "bnd-etf"]);
import { Panel, SourceTag, Sparkline, Tick, Updated, dir, fmt, fmtPrice, isClosed, pct, usePoll } from "./ui";

export default function Markets({ groups, mode, onKeys, watch, onPick, onUnwatch }: {
  groups: Group[]; mode: "personal" | "public"; onKeys: () => void; watch: string[]; onPick: (s: string) => void; onUnwatch: (s: string) => void;
}) {
  const m5 = useMt5();
  const m5Syms = m5 ? Object.entries(m5.quotes).filter(([s]) => s.startsWith("MT5:")) : [];
  const mt5Group: Group | null = m5 && m5Syms.length
    ? { id: "mt5", title: `MetaTrader 5 · ${m5.server}`, symbols: m5Syms.map(([s, q]) => ({ s, name: q.name })) }
    : null;
  const nt = useNinja();
  const ntSyms = nt ? Object.entries(nt.quotes) : [];
  const ntGroup: Group | null = ntSyms.length
    ? { id: "ninja", title: "NinjaTrader · tu PC", symbols: ntSyms.map(([root, q]) => ({ s: `${root}=F`, name: q.name || root })) }
    : null;
  const shown = [...groups, ...(mt5Group ? [mt5Group] : []), ...(ntGroup ? [ntGroup] : [])];
  const ALL = shown.flatMap((g) => g.symbols.map((s) => s.s));
  const needKey = mode === "public" && !hasKey("finnhub");
  const { data, prev, at, error } = usePoll<Quote[]>(`/api/quotes?s=${encodeURIComponent(ALL.join(","))}`, 10_000);
  const wl = usePoll<Quote[]>(watch.length ? `/api/quotes?s=${encodeURIComponent(watch.join(","))}` : null, 10_000);
  const by = new Map((data ?? []).map((q) => [q.symbol, q]));
  const prevPrice = new Map([...(prev ?? []), ...(wl.prev ?? [])].map((q) => [q.symbol, q.price]));
  const now = at || wl.at;

  // Movers across everything on the board, by absolute % move.
  const movers = [...(data ?? [])].filter((q) => q.changePct != null && !isYield(q.symbol) && !q.symbol.startsWith("MT5:")).sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!)).slice(0, 8);

  return (
    <div className="grid gap-1.5 sm:gap-2 md:grid-cols-2 xl:grid-cols-3">
      {error && <p className="border border-down/40 bg-panel p-2 text-down md:col-span-2 xl:col-span-3">No se pudieron cargar los precios: {error}</p>}
      {needKey && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-amber-dim bg-panel px-3 py-2 md:col-span-2 xl:col-span-3">
          <p className="text-[12px]">
            Cripto y divisas funcionan en ATALAYA; índices y materias primas se ven con TradingView. Conecta tu key gratuita de Finnhub para ver <span className="text-amber">acciones y ETF en tiempo real</span> dentro de ATALAYA, con tendencia, riesgo e IA.
          </p>
          <button onClick={onKeys} className="btn ml-auto h-8 bg-amber px-3 font-cond text-[12px] font-semibold uppercase tracking-wider text-black">Conectar</button>
        </div>
      )}

      {mode === "public" && (
        <Panel title="Índices, materias primas y bonos · TradingView" className="h-[460px] md:col-span-2 xl:col-span-1 xl:row-span-2 xl:h-auto xl:min-h-[460px]">
          <TvMarketOverview />
        </Panel>
      )}

      <Panel title="Mi lista" right={<span>VIGILAR TSLA para añadir · <Updated at={wl.at} /></span>}>
        <QuoteTable
          rows={watch.map((s) => wl.data?.find((q) => q.symbol === s) ?? { symbol: s, name: s, price: null, change: null, changePct: null, prevClose: null, spark: [], live: false, time: null })}
          onPick={onPick}
          onRemove={onUnwatch}
          prevPrice={prevPrice}
          now={now}
        />
      </Panel>

      {shown.map((g) => needKey && ETF_GROUPS.has(g.id) ? (
        <Panel key={g.id} title={g.title} className="h-[420px]" right={<span>vía TradingView</span>}>
          <TvQuotes title={g.title} symbols={g.symbols} />
        </Panel>
      ) : (
        <Panel key={g.id} title={g.title} right={<span className="flex items-center gap-2"><Updated at={at} />{g.id === "mt5" ? <SourceTag live source="MetaTrader 5" /> : g.id === "ninja" ? <SourceTag live source="NinjaTrader" /> : g.id === "cry" ? <SourceTag live /> : <SourceTag live={false} />}</span>}>
          <QuoteTable rows={g.symbols.map((s) => by.get(s.s) ?? { symbol: s.s, name: s.name, price: null, change: null, changePct: null, prevClose: null, spark: [], live: false, time: null })} onPick={onPick} yieldMode={g.id === "bnd"} prevPrice={prevPrice} now={now} />
        </Panel>
      ))}

      <Panel title="Mayores movimientos del tablero">
        <ul>
          {movers.map((q) => (
            <li key={q.symbol}>
              <button onClick={() => onPick(q.symbol)} className="row-hover grid w-full grid-cols-[1fr_auto] items-center gap-2 border-b border-line/60 px-2 py-1.5 text-left">
                <span className="truncate">{q.name}</span>
                <span className="relative flex h-4 w-32 items-center">
                  <span
                    className={`absolute top-0 h-4 ${q.changePct! >= 0 ? "left-1/2 bg-up/25" : "right-1/2 bg-down/25"}`}
                    style={{ width: `${Math.min(50, Math.abs(q.changePct!) * 10)}%` }}
                  />
                  <span className={`relative w-full text-right ${dir(q.changePct)}`}>{pct(q.changePct)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function QuoteTable({ rows, onPick, onRemove, yieldMode, prevPrice, now }: { rows: Quote[]; onPick: (s: string) => void; onRemove?: (s: string) => void; yieldMode?: boolean; prevPrice: Map<string, number | null>; now: number }) {
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr className="font-cond text-[10px] uppercase tracking-wider text-muted">
          <th scope="col" className="px-2 py-1 text-left font-normal">Instrumento</th>
          <th scope="col" className="px-2 py-1 text-right font-normal">{yieldMode ? "Rend." : "Último"}</th>
          <th scope="col" className="hidden px-2 py-1 text-right font-normal 2xl:table-cell">{yieldMode ? "Δ pb" : "Var."}</th>
          <th scope="col" className="px-2 py-1 text-right font-normal">%</th>
          <th scope="col" className="hidden px-2 py-1 font-normal sm:table-cell"><span className="sr-only">Gráfico del día</span></th>
          {onRemove && <th scope="col"><span className="sr-only">Quitar</span></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((q) => {
          const closed = isClosed(q, now);
          return (
          <tr key={q.symbol} className={`row-hover cursor-pointer border-t border-line/60 ${closed ? "opacity-60" : ""}`} onClick={() => onPick(q.symbol)}>
            <td className="max-w-0 px-2 py-1.5" title={`${q.name} · ${q.symbol}`}>
              <button className="flex w-full items-center gap-1.5 text-left" onClick={(e) => { e.stopPropagation(); onPick(q.symbol); }}>
                {closed && (
                  <span title={`Mercado cerrado · último dato ${new Date(q.time! * 1000).toLocaleString("es-EC")}`} className="shrink-0 text-muted">
                    <Moon size={11} aria-hidden="true" /><span className="sr-only">cerrado</span>
                  </span>
                )}
                <span className="min-w-0 truncate">
                <span className="text-amber">{q.name === q.symbol ? q.symbol : q.name}</span>
                {q.name !== q.symbol && <span className="ml-1.5 hidden text-[10px] text-muted 2xl:inline">{q.symbol}</span>}
                </span>
                
              </button>
            </td>
            <td className="px-2 py-1.5 text-right"><Tick value={q.price} prev={prevPrice.get(q.symbol)}>{yieldMode ? fmt(q.price, 3) : fmtPrice(q.symbol, q.price)}</Tick></td>
            <td className={`hidden px-2 py-1.5 text-right 2xl:table-cell ${dir(q.change)}`}>
              {q.change == null ? "—" : yieldMode ? `${q.change > 0 ? "+" : ""}${fmt(q.change * 100, 1)}` : `${q.change > 0 ? "+" : ""}${fmtPrice(q.symbol, q.change)}`}
            </td>
            <td className={`px-2 py-1.5 text-right ${dir(q.changePct)}`}>{pct(q.changePct)}</td>
            <td className="hidden px-2 py-1 sm:table-cell"><Sparkline data={q.spark} up={(q.change ?? 0) >= 0} /></td>
            {onRemove && (
              <td className="w-8 pr-1 text-right">
                <button
                  aria-label={`Quitar ${q.symbol} de la lista`}
                  onClick={(e) => { e.stopPropagation(); onRemove(q.symbol); }}
                  className="btn inline-grid size-7 place-items-center text-muted hover:text-down"
                >
                  <X size={13} />
                </button>
              </td>
            )}
          </tr>
          );
        })}
      </tbody>
    </table>
  );
}
