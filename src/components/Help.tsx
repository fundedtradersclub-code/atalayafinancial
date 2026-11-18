"use client";

import { Panel } from "./ui";
import { lang } from "./i18n";

const CMDS: [string, string][] = [
  ["AAPL · NQ · BTC · ORO · EURUSD", "Abre la ficha del símbolo (gráfico, sesión, noticias, estados financieros)"],
  ["apple · tesla · bitcoin", "Busca por nombre; elige con ↑ ↓ y Enter"],
  ["NVDA RIESGO", "Abre el símbolo directo en la vista de riesgo"],
  ["MERC · TEND · RIESGO · IA · CALC · CARTERA · NOT", "Cambia de vista"],
  ["BTC TEND", "Abre el símbolo directo en Tendencia"],
  ["COMPRAR 10 AAPL", "Orden simulada al último precio (sin el símbolo usa el activo)"],
  ["VENDER 5 AAPL", "Vende de la cartera simulada"],
  ["VIGILAR TSLA · QUITAR TSLA", "Añade o quita de tu lista en Mercados"],
];

const KEYS: [string, string][] = [
  ["/ o Ctrl+K", "Ir a la línea de comandos"],
  ["Alt+1 … Alt+9, Alt+0", "Cambiar de vista (Alt+0 = Conexiones)"],
  ["Esc", "Limpiar la línea de comandos"],
];

export default function Help({ onRun }: { onRun: (s: string) => void }) {
  return (
    <div className="grid gap-1.5 sm:gap-2 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="Comandos">
        <ul>
          {CMDS.map(([c, d]) => (
            <li key={c} className="grid gap-1 border-b border-line/60 px-3 py-2 sm:grid-cols-[260px_1fr]">
              <button onClick={() => onRun(c.split(" · ")[0])} className="text-left text-amber hover:underline">{c}</button>
              <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <Panel title="Manual completo" className="shrink-0">
          <p className="p-3 text-[12px] text-muted">
            Guía paso a paso de cada pantalla y de cómo conectar APIs, MetaTrader 5 y NinjaTrader:{" "}
            <a href={lang() === "en" ? "/manual/en" : "/manual"} target="_blank" className="text-amber hover:underline">abrir el manual</a>.
          </p>
        </Panel>
        <Panel title="Teclado" className="shrink-0">
          <ul>
            {KEYS.map(([k, d]) => (
              <li key={k} className="flex justify-between gap-3 border-b border-line/60 px-3 py-2">
                <kbd className="text-amber">{k}</kbd><span className="text-muted">{d}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="De dónde salen los datos" className="shrink-0">
          <ul className="space-y-2 p-3 text-[12px] leading-relaxed text-muted">
            <li><span className="text-text">Acciones, ETF y gráficos:</span> con tus keys de Finnhub, Twelve Data o Polygon (pestaña Conexiones). En la instalación personal, además, Yahoo Finance con retraso.</li>
            <li><span className="text-text">Divisas sin key:</span> tipos de referencia diarios del Banco Central Europeo.</li>
            <li><span className="text-text">Cripto:</span> Binance, en tiempo real (pares contra USDT).</li>
            <li><span className="text-text">Estados financieros y reportes:</span> SEC EDGAR, empresas de EE. UU.</li>
            <li><span className="text-text">Cálculos de riesgo y calculadoras:</span> TradingCalc, resultados deterministas y firmados.</li>
            <li><span className="text-text">Cartera simulada:</span> se guarda solo en este navegador.</li>
            <li className="text-amber">Esta terminal muestra datos. No te dice qué comprar ni vender.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
