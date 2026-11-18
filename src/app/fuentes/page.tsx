import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/fuentes" }, title: "Fuentes de datos · ATALAYA" };

const SOURCES: [string, string, string][] = [
  ["Finnhub, Twelve Data y Polygon", "Acciones, ETF, divisas y gráficos, cuando la persona conecta su propia API key. Los datos se entregan bajo la licencia de esa persona, para su uso personal.", "https://finnhub.io"],
  ["Banco Central Europeo (vía Frankfurter)", "Tipos de cambio de referencia diarios.", "https://www.frankfurter.app"],
  ["Yahoo Finance (solo instalación personal)", "En copias de uso personal: índices, futuros, divisas y materias primas, con retraso. La versión pública no usa Yahoo.", "https://finance.yahoo.com"],
  ["Binance", "Precios y velas de criptomonedas (pares contra USDT), en tiempo real.", "https://www.binance.com"],
  ["SEC EDGAR", "Estados financieros (XBRL) y reportes oficiales de empresas que cotizan en EE. UU.", "https://www.sec.gov/edgar"],
  ["TradingCalc", "Cálculos de riesgo, estadística, exponente de Hurst, opciones y tamaño de posición. Resultados deterministas y firmados.", "https://tradingcalc.io"],
  ["NVIDIA", "Modelo de lenguaje del Analista IA (Nemotron), vía NVIDIA API Catalog.", "https://build.nvidia.com"],
  ["MarketWatch y CNBC", "Titulares de noticias, enlazados a su publicación original.", "https://www.marketwatch.com"],
  ["TradingView Lightweight Charts", "Biblioteca de gráficos (licencia Apache 2.0).", "https://www.tradingview.com/lightweight-charts/"],
];

export default function Page() {
  return (
    <LegalPage title="Fuentes de datos">
      <p className="text-[12px]"><a href="#en" className="text-info underline">English version ↓</a></p>

      <p>
        Los datos que muestra ATALAYA <strong>no son nuestros</strong>: pertenecen a sus respectivos dueños, que conservan todos sus derechos. Se usan con
        fines informativos, citando la fuente.
      </p>
      <ul>
        {SOURCES.map(([n, d, u]) => (
          <li key={n}>
            <a href={u} target="_blank" rel="noreferrer" className="text-info underline">{n}</a>: {d}
          </li>
        ))}
      </ul>
      <p>Las marcas mencionadas pertenecen a sus dueños. ATALAYA no está afiliada ni patrocinada por ninguna de estas empresas.</p>
      <hr className="my-10 border-line" />
      <section id="en" lang="en" className="space-y-4">
        <h2>English · Data sources</h2>
        <p>The data shown by ATALAYA <strong>is not ours</strong>: it belongs to its respective owners, who retain all their rights. It is used for information purposes, crediting the source.</p>
        <ul>
          <li>Finnhub, Twelve Data and Polygon: stocks, ETFs, currencies and charts, when a person connects their own API key. The data is delivered under that person&apos;s license, for their personal use.</li>
          <li>European Central Bank (via Frankfurter): daily reference exchange rates.</li>
          <li>Binance: cryptocurrency prices and candles (USDT pairs), real time.</li>
          <li>SEC EDGAR: financial statements (XBRL) and official filings of US-listed companies.</li>
          <li>TradingView: embedded charts and quotes (official widgets), with their own data and branding.</li>
          <li>TradingCalc: risk, statistics, Hurst exponent, options and position sizing calculations. Deterministic, signed results.</li>
          <li>NVIDIA: the AI Analyst&apos;s language model (Nemotron), via the NVIDIA API Catalog.</li>
          <li>MarketWatch and CNBC: news headlines, linked to the original article.</li>
          <li>Yahoo Finance: only in personal installations, never in the public version.</li>
          <li>TradingView Lightweight Charts: charting library (Apache 2.0 license).</li>
        </ul>
        <p>The brands mentioned belong to their owners. ATALAYA is not affiliated with or sponsored by any of these companies.</p>
      </section>
    </LegalPage>
  );
}
