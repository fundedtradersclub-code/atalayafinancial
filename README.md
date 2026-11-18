<p align="center">
  <img src="src/app/icon.svg" width="96" alt="ATALAYA Financial logo: a watchtower with its beacon lit over a rising market line">
</p>

<h1 align="center">ATALAYA Financial</h1>

<p align="center">
  Terminal de mercados en español e inglés · Market terminal in Spanish and English<br>
  <a href="https://atalayafinancial.vercel.app"><strong>atalayafinancial.vercel.app</strong></a> ·
  <a href="https://atalayafinancial.vercel.app/manual">Manual (ES)</a> ·
  <a href="https://atalayafinancial.vercel.app/manual/en">Manual (EN)</a>
</p>

---

## Español

ATALAYA es una terminal de mercados web, al estilo de las terminales profesionales, que reúne en una sola pantalla precios, gráficos, análisis técnico, riesgo, calculadoras, noticias y un analista con IA. **Muestra datos; no recomienda qué comprar ni vender.**

### Qué hace

- **Mercados**: tablero de índices, futuros, materias primas, divisas, cripto y bonos, con destellos de cambio de precio y aviso de mercado cerrado.
- **Gráfico avanzado**: 9 temporalidades (1 min a mensual), medias, Bollinger, RSI, MACD, canal de tendencia automático y herramientas de dibujo (línea de tendencia, rayo, horizontal, Fibonacci, regla). Alternativa con el gráfico oficial de TradingView.
- **Tendencia**: lectura intradía, diaria y semanal por votos de 8 señales, consenso ponderado y exponente de Hurst.
- **Riesgo**: VaR, CVaR, Sharpe, Sortino, caída máxima y más, con un año de retornos reales (TradingCalc).
- **Analista IA**: responde con los datos de la pantalla (NVIDIA Nemotron), en el idioma elegido.
- **Calculadoras**: riesgo/beneficio, tamaño de posición, Black-Scholes y valor del pip.
- **Cartera simulada**, **noticias**, **estados financieros de la SEC**, línea de comandos y atajos de teclado.
- **Conexiones**: cada persona puede conectar sus propias keys (Finnhub, Twelve Data, Polygon, NVIDIA). En una instalación personal, también MetaTrader 5 y NinjaTrader (solo lectura).
- **Español / inglés**, páginas legales, aceptación de condiciones y página de reclamos.

### Fuentes de datos

Binance (cripto en vivo), Banco Central Europeo vía Frankfurter (divisas diarias), SEC EDGAR, TradingCalc, widgets oficiales de TradingView y las APIs que conecte cada usuario. Los datos pertenecen a sus dueños. Yahoo Finance solo se usa en instalaciones personales (`DATA_MODE=personal`), nunca en la versión pública.

### Ejecutar en tu PC

```bash
npm install
npm run dev        # http://localhost:3000
```

Variables opcionales en `.env.local` (nunca se suben):

```
DATA_MODE=personal          # habilita Yahoo y los puentes locales; sin esto = modo público
NVIDIA_API_KEY=...          # key propia para el Analista IA en modo personal
NVIDIA_MODEL=nvidia/nemotron-3-ultra-550b-a55b
SEC_USER_AGENT="Nombre correo@ejemplo.com"   # si la SEC pide identificarse
```

Puentes locales (opcionales, solo lectura): `INICIAR-METATRADER5.bat` (MetaTrader 5, Python) y el indicador `public/ninjatrader/AtalayaBridge.cs` (NinjaTrader 8). Ver el manual.

### Aviso

Herramienta informativa. Nada de lo que muestra es recomendación de inversión. Invertir tiene alto riesgo: cada persona asume el riesgo de su dinero.

---

## English

ATALAYA is a web market terminal, in the style of professional terminals, that brings prices, charts, technical analysis, risk, calculators, news and an AI analyst together on one screen. **It shows data; it does not recommend what to buy or sell.**

### Features

- **Markets** board (indices, futures, commodities, currencies, crypto, bonds) with price-tick flashes and closed-market markers.
- **Advanced chart**: 9 timeframes (1 min to monthly), moving averages, Bollinger, RSI, MACD, automatic trend channel and drawing tools (trend line, ray, horizontal, Fibonacci, ruler). Official TradingView chart as an alternative.
- **Trend**: intraday, daily and weekly readings from 8 voting signals, weighted consensus and Hurst exponent.
- **Risk**: VaR, CVaR, Sharpe, Sortino, max drawdown and more, from a year of real returns (TradingCalc).
- **AI Analyst** grounded in the on-screen data (NVIDIA Nemotron), answering in the selected language.
- **Calculators**: risk/reward, position size, Black-Scholes, pip value.
- **Paper portfolio**, **news**, **SEC financial statements**, command line and keyboard shortcuts.
- **Connections**: bring-your-own keys (Finnhub, Twelve Data, Polygon, NVIDIA); in a personal install, read-only MetaTrader 5 and NinjaTrader bridges.
- **Spanish / English**, legal pages, terms acceptance and a claims page.

### Run locally

```bash
npm install
npm run dev
```

Set `DATA_MODE=personal` in `.env.local` to enable Yahoo Finance and the local bridges (personal use only). Without it the app runs in public mode.

### Notice

Informational tool. Nothing shown is investment advice. Investing is high risk: each person bears the risk of their own money.

---

## Licencia · License

El código se publica bajo la [licencia MIT](LICENSE). La licencia cubre solo el código de este repositorio: los datos de mercado, los widgets de TradingView, las marcas y las librerías de terceros conservan sus propios términos (ver [Fuentes de datos](https://atalayafinancial.vercel.app/fuentes)).

The code is released under the [MIT License](LICENSE). It covers only the code in this repository: market data, TradingView widgets, trademarks and third-party libraries keep their own terms.

---

<p align="center">Hecho por <a href="https://www.instagram.com/elmigrante.digital/">@elmigrante.digital</a></p>
