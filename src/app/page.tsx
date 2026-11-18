import ClientTerminal from "@/components/ClientTerminal";

// Structured data so search engines understand what the page is.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ATALAYA Financial",
  url: "https://atalayafinancial.vercel.app/",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  inLanguage: "es",
  description:
    "Terminal de mercados en español con gráficos, herramientas de dibujo, tendencia por marcos de tiempo, riesgo, calculadoras de trading, analista IA y cartera simulada.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  creator: { "@type": "Person", name: "@elmigrante.digital", url: "https://www.instagram.com/elmigrante.digital/" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      {/* Server-rendered summary: the interactive terminal itself loads in the browser. */}
      <header className="sr-only">
        <h1>ATALAYA Financial: terminal de mercados en español</h1>
        <p>
          Precios de cripto, divisas, acciones, ETF e índices; gráficos de 1 minuto a mensual con medias, Bollinger, RSI, MACD, Fibonacci y líneas de
          tendencia; lectura de tendencia intradía, diaria y semanal; riesgo con VaR y Sharpe; calculadoras de tamaño de posición, riesgo/beneficio,
          opciones y forex; analista con inteligencia artificial y cartera simulada. Herramienta informativa: no es recomendación de inversión.
        </p>
        <nav>
          <a href="/manual">Manual de uso</a> <a href="/fuentes">Fuentes de datos</a> <a href="/terminos">Términos y aviso de riesgo</a>
        </nav>
      </header>
      <ClientTerminal />
    </>
  );
}
