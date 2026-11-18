"use client";

import { useEffect, useRef } from "react";
import { lang } from "./i18n";

// Official TradingView "Advanced Chart" embed widget (free to embed; their data, their branding).
// ATALAYA can't read these numbers; it's a view, not a data source.

const TV: Record<string, string> = {
  // Free widgets can't show CME/COMEX/NYMEX futures, so futures map to the closest widget-allowed instrument.
  "^GSPC": "FOREXCOM:SPXUSD", "^NDX": "FOREXCOM:NSXUSD", "^DJI": "FOREXCOM:DJI", "^RUT": "TVC:RUT", "^VIX": "TVC:VIX",
  "^STOXX50E": "TVC:SX5E", "^GDAXI": "INDEX:DEU40", "^FTSE": "FOREXCOM:UKXGBP", "^N225": "INDEX:NKY", "^HSI": "TVC:HSI",
  "^BVSP": "BMFBOVESPA:IBOV", "^MXX": "BMV:ME",
  "ES=F": "FOREXCOM:SPXUSD", "MES=F": "FOREXCOM:SPXUSD", "NQ=F": "FOREXCOM:NSXUSD", "MNQ=F": "FOREXCOM:NSXUSD",
  "YM=F": "FOREXCOM:DJI", "RTY=F": "FOREXCOM:US2000", "ZN=F": "TVC:US10Y", "6E=F": "FX:EURUSD",
  "GC=F": "OANDA:XAUUSD", "SI=F": "OANDA:XAGUSD", "HG=F": "OANDA:XCUUSD", "CL=F": "TVC:USOIL", "BZ=F": "TVC:UKOIL",
  "NG=F": "OANDA:NATGASUSD", "KC=F": "ICEUS:KC1!", "CC=F": "ICEUS:CC1!",
  "DX-Y.NYB": "TVC:DXY", "^TNX": "TVC:US10Y", "^FVX": "TVC:US05Y", "^TYX": "TVC:US30Y", "^IRX": "TVC:US03MY",
};

// Listing exchange of the ETFs ATALAYA shows (TradingView needs EXCHANGE:TICKER; NYSE Arca = AMEX).
const ETF_EXCHANGE: Record<string, string> = {
  SPY: "AMEX", QQQ: "NASDAQ", DIA: "AMEX", IWM: "AMEX", VGK: "AMEX", EWJ: "AMEX", FXI: "AMEX", EWZ: "AMEX", EWW: "AMEX",
  GLD: "AMEX", SLV: "AMEX", USO: "AMEX", UNG: "AMEX", CPER: "AMEX", DBA: "AMEX",
  SHY: "NASDAQ", IEF: "NASDAQ", TLT: "NASDAQ", HYG: "AMEX",
};

export function tvSymbol(s: string): string {
  if (TV[s]) return TV[s];
  if (ETF_EXCHANGE[s]) return `${ETF_EXCHANGE[s]}:${s}`;
  const fx = /^([A-Z]{3})([A-Z]{3})=X$/.exec(s);
  if (fx) return `FX:${fx[1]}${fx[2]}`;
  const cr = /^([A-Z0-9]+)-USD$/.exec(s);
  if (cr) return `BINANCE:${cr[1]}USDT`;
  if (s.startsWith("MT5:")) return s.slice(4);
  return s.replace(/=F$/, "1!");
}

const TV_INTERVAL: Record<string, string> = { "1m": "1", "5m": "5", "15m": "15", "30m": "30", "1h": "60", "4h": "240", "1d": "D", "1w": "W", "1mo": "M" };

export default function TradingViewChart({ symbol, interval = "1d" }: { symbol: string; interval?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.innerHTML = "";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%";
    inner.style.width = "100%";
    el.appendChild(inner);
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol(symbol),
      interval: TV_INTERVAL[interval] ?? "D",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      theme: "dark",
      style: "1",
      locale: lang(),
      backgroundColor: "#0c0c0b",
      gridColor: "rgba(42, 38, 32, 0.6)",
      allow_symbol_change: true,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });
    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [symbol, interval]);

  return (
    <div className="flex h-full min-h-[480px] flex-col">
      <div ref={box} className="tradingview-widget-container min-h-0 flex-1" />
      <p className="shrink-0 border-t border-line px-2 py-1 text-[10px] text-muted">
        Gráfico y datos de{" "}
        <a href="https://es.tradingview.com/" target="_blank" rel="noreferrer nofollow" className="text-info hover:underline">TradingView</a>.
        Los futuros se muestran con su equivalente de contado o CFD (por ejemplo NQ como Nasdaq 100). ATALAYA no lee estos datos: las herramientas de Tendencia, Riesgo e IA siguen usando tus otras fuentes.
      </p>
    </div>
  );
}

/** Generic official TradingView embed (market overview, ticker tape…). */
export function TvEmbed({ widget, config, className = "" }: { widget: string; config: Record<string, unknown>; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cfg = JSON.stringify(config);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';
    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.async = true;
    script.innerHTML = cfg;
    el.appendChild(script);
    return () => { el.innerHTML = ""; };
  }, [widget, cfg]);
  return <div ref={box} className={`tradingview-widget-container ${className}`} />;
}

export function TvMarketOverview() {
  const sym = (s: string, d: string) => ({ s, d });
  return (
    <div className="flex h-full flex-col">
      <TvEmbed
        widget="market-overview"
        className="min-h-0 flex-1"
        config={{
          colorTheme: "dark", dateRange: "1D", showChart: true, locale: lang(), isTransparent: true, showSymbolLogo: true,
          showFloatingTooltip: true, width: "100%", height: "100%",
          plotLineColorGrowing: "#3ddc84", plotLineColorFalling: "#ff5c4d", scaleFontColor: "#918b7c",
          belowLineFillColorGrowing: "rgba(61,220,132,0.08)", belowLineFillColorFalling: "rgba(255,92,77,0.08)",
          symbolActiveColor: "rgba(255,178,36,0.12)",
          tabs: [
            { title: lang() === "en" ? "Indices" : "Índices", symbols: [sym("FOREXCOM:SPXUSD", "S&P 500"), sym("FOREXCOM:NSXUSD", "Nasdaq 100"), sym("FOREXCOM:DJI", "Dow Jones"), sym("INDEX:DEU40", "DAX"), sym("INDEX:NKY", "Nikkei 225"), sym("FOREXCOM:UKXGBP", "FTSE 100")] },
            { title: lang() === "en" ? "Commodities" : "Materias primas", symbols: [sym("OANDA:XAUUSD", lang() === "en" ? "Gold" : "Oro"), sym("OANDA:XAGUSD", lang() === "en" ? "Silver" : "Plata"), sym("TVC:USOIL", lang() === "en" ? "WTI crude" : "Petróleo WTI"), sym("TVC:UKOIL", "Brent"), sym("OANDA:NATGASUSD", lang() === "en" ? "Natural gas" : "Gas natural"), sym("OANDA:XCUUSD", lang() === "en" ? "Copper" : "Cobre")] },
            { title: lang() === "en" ? "Bonds" : "Bonos", symbols: [sym("TVC:US02Y", "EE. UU. 2 años"), sym("TVC:US10Y", "EE. UU. 10 años"), sym("TVC:US30Y", "EE. UU. 30 años"), sym("TVC:DE10Y", "Alemania 10 años"), sym("TVC:JP10Y", "Japón 10 años")] },
          ],
        }}
      />
      <p className="shrink-0 border-t border-line px-2 py-1 text-[10px] text-muted">
        Datos de <a href="https://es.tradingview.com/" target="_blank" rel="noreferrer nofollow" className="text-info hover:underline">TradingView</a>. Algunos pueden ir con retraso.
      </p>
    </div>
  );
}

/** Quote table of a group of symbols, served by TradingView (used when the visitor has no stock-data key). */
export function TvQuotes({ title, symbols }: { title: string; symbols: { s: string; name: string }[] }) {
  return (
    <div className="flex h-full flex-col">
      <TvEmbed
        widget="market-quotes"
        className="min-h-0 flex-1"
        config={{
          width: "100%", height: "100%", colorTheme: "dark", isTransparent: true, locale: lang(), showSymbolLogo: true,
          symbolsGroups: [{ name: title, symbols: symbols.map((x) => ({ name: tvSymbol(x.s), displayName: x.name })) }],
        }}
      />
      <p className="shrink-0 border-t border-line px-2 py-1 text-[10px] text-muted">
        Cotizaciones de <a href="https://es.tradingview.com/" target="_blank" rel="noreferrer nofollow" className="text-info hover:underline">TradingView</a>. Conecta Finnhub para verlas en ATALAYA en tiempo real.
      </p>
    </div>
  );
}
