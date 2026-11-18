import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";

const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const cond = IBM_Plex_Sans_Condensed({ variable: "--font-plex-cond", subsets: ["latin"], weight: ["400", "600"], display: "swap" });

const DESCRIPTION =
  "Terminal de mercados gratis en español: precios de cripto, divisas, acciones e índices, gráficos con herramientas de dibujo, tendencia por marcos de tiempo, riesgo (VaR, Sharpe), calculadoras de trading, analista IA y cartera simulada.";

export const metadata: Metadata = {
  metadataBase: new URL("https://atalayafinancial.vercel.app"),
  title: { default: "ATALAYA Financial · Terminal de mercados en español", template: "%s" },
  description: DESCRIPTION,
  applicationName: "ATALAYA Financial",
  keywords: [
    "terminal de mercados", "terminal financiera", "trading en español", "análisis técnico", "tendencia del mercado",
    "gráficos de trading", "calculadora de trading", "tamaño de posición", "VaR", "Sharpe", "cripto en vivo", "bitcoin",
    "forex", "Nasdaq", "S&P 500", "MetaTrader 5", "NinjaTrader", "cartera simulada", "paper trading",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "/",
    siteName: "ATALAYA Financial",
    title: "ATALAYA Financial · Terminal de mercados en español",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "ATALAYA Financial · Terminal de mercados en español", description: DESCRIPTION },
  category: "finance",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${mono.variable} ${cond.variable} h-full`}>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
