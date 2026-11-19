"use client";

// Interface language. Spanish is the source; other languages are a translation layer
// applied to the rendered terminal (text nodes and a few attributes), so every screen,
// including text that arrives from the server, switches without touching each component.

export const LANGS = [
  { id: "es", label: "ES", name: "Español" },
  { id: "en", label: "EN", name: "English" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];

const KEY = "atalaya.lang";

export function getLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "es" || v === "en") return v;
  } catch { /* ignore */ }
  return typeof navigator !== "undefined" && !navigator.language.toLowerCase().startsWith("es") ? "en" : "es";
}

export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  location.reload(); // simplest way to re-render every screen in the new language
}

// ---------------- English dictionary (exact, trimmed text) ----------------
const EN: Record<string, string> = {
  // shell
  "terminal de mercados": "market terminal", "personal": "personal", "pública": "public",
  "Mercados": "Markets", "Símbolo": "Symbol", "Tendencia": "Trend", "Riesgo": "Risk", "Analista IA": "AI Analyst",
  "Calculadoras": "Calculators", "Cartera": "Portfolio", "Noticias": "News", "Ayuda": "Help", "Conexiones": "Connections",
  "Símbolo activo": "Active symbol", "Manual": "Manual", "Términos y riesgo": "Terms & risk", "Privacidad": "Privacy",
  "Cookies": "Cookies", "Fuentes de datos": "Data sources", "Reclamos": "Claims",
  "Símbolo o comando: AAPL · NQ · BTC · RIESGO · COMPRAR 10 AAPL": "Symbol or command: AAPL · NQ · BTC · RISK · BUY 10 AAPL",
  "Línea de comandos": "Command line", "Cinta de precios": "Price ticker", "Funciones": "Functions",
  "Bolsa abierta (horario regular, sin feriados)": "Exchange open (regular hours, holidays not included)", "Bolsa cerrada": "Exchange closed", "Tu hora local": "Your local time",
  "Fuentes de datos y API keys": "Data sources and API keys",
  // gate
  "Antes de entrar, lee y acepta estas condiciones": "Before entering, read and accept these conditions",
  "Entiendo que ATALAYA es una herramienta informativa y que nada de lo que muestra (datos, gráficos, análisis técnico, cálculos ni respuestas de la IA) es una recomendación de inversión.":
    "I understand that ATALAYA is an informational tool and that nothing it shows (data, charts, technical analysis, calculations or AI answers) is investment advice.",
  "Entiendo que invertir capital tiene alto riesgo, que puedo perder parte o todo mi dinero, y que asumo toda la responsabilidad por mis decisiones.":
    "I understand that investing capital is high risk, that I may lose part or all of my money, and that I take full responsibility for my decisions.",
  "Entiendo que los datos son de terceros (sus dueños), pueden llegar con retraso o con errores, y no se garantiza que sean exactos ni estén completos.":
    "I understand that the data belongs to third parties (its owners), may be delayed or contain errors, and is not guaranteed to be accurate or complete.",
  "Leí y acepto los Términos de uso, la Política de privacidad y la Política de cookies.": "I have read and accept the Terms of use, the Privacy policy and the Cookie policy.",
  "Términos de uso": "Terms of use", "Acepto y entro": "I accept, enter", "Listo.": "Ready.",
  "Marca las 4 casillas para continuar.": "Tick the 4 boxes to continue.",
  // footer
  "Los datos pertenecen a sus dueños (Yahoo Finance, Binance, BCE, SEC EDGAR, TradingCalc, medios citados) y se muestran solo con fines informativos. Nada aquí es recomendación de inversión. Invertir tiene alto riesgo: cada persona asume el riesgo de su dinero.":
    "Data belongs to its owners (Yahoo Finance, Binance, ECB, SEC EDGAR, TradingCalc, cited media) and is shown for information only. Nothing here is investment advice. Investing is high risk: each person bears the risk of their own money.",
  "Los datos pertenecen a sus dueños (tus proveedores conectados, Binance, BCE, SEC EDGAR, TradingCalc, medios citados) y se muestran solo con fines informativos. Nada aquí es recomendación de inversión. Invertir tiene alto riesgo: cada persona asume el riesgo de su dinero.":
    "Data belongs to its owners (your connected providers, Binance, ECB, SEC EDGAR, TradingCalc, cited media) and is shown for information only. Nothing here is investment advice. Investing is high risk: each person bears the risk of their own money.",
  "Hecho por @elmigrante.digital": "Made by @elmigrante.digital",
  "¿Algún problema con un dato o contenido? Escríbenos y lo resolvemos de buena fe": "Any problem with data or content? Write to us and we'll resolve it in good faith",
  // tags & common
  "EN VIVO": "LIVE", "RETRASO": "DELAYED", "Última actualización": "Last update", "cerrado": "closed", "mercado cerrado": "market closed",
  "Binance, tiempo real": "Binance, real time", "Yahoo Finance, normalmente 10-15 min de retraso": "Yahoo Finance, usually 10-15 min delayed",
  "Cargando…": "Loading…", "Cargando gráfico…": "Loading chart…", "Calculando…": "Calculating…", "Sin conexión con la fuente": "No connection to the source",
  // markets
  "Mi lista": "My list", "VIGILAR TSLA para añadir ·": "WATCH TSLA to add ·", "Instrumento": "Instrument", "Último": "Last", "Var.": "Chg",
  "Rend.": "Yield", "Δ pb": "Δ bp", "Gráfico del día": "Today's chart", "Mayores movimientos del tablero": "Biggest movers on the board",
  "Índices": "Indices", "Futuros": "Futures", "Materias primas": "Commodities", "Divisas": "Currencies", "Cripto": "Crypto",
  "Bonos EE. UU. (rendimiento %)": "US Treasuries (yield %)", "Índices · vía ETF": "Indices · via ETF", "Materias primas · vía ETF": "Commodities · via ETF",
  "Bonos EE. UU. · vía ETF": "US bonds · via ETF", "Índices, futuros y bonos · TradingView": "Indices, futures & bonds · TradingView", "vía TradingView": "via TradingView",
  "No se pudieron cargar los precios:": "Could not load prices:", "Conectar": "Connect",
  "Cripto y divisas funcionan en ATALAYA; índices y materias primas se ven con TradingView. Conecta tu key gratuita de Finnhub para ver":
    "Crypto and currencies work in ATALAYA; indices and commodities are shown with TradingView. Connect your free Finnhub key to see",
  "acciones y ETF en tiempo real": "stocks and ETFs in real time", "dentro de ATALAYA, con tendencia, riesgo e IA.": "inside ATALAYA, with trend, risk and AI.",
  // symbol names
  "Índice dólar": "Dollar index", "Oro": "Gold", "Plata": "Silver", "Petróleo WTI": "WTI crude", "Gas natural": "Natural gas", "Cobre": "Copper",
  "Café": "Coffee", "Cacao": "Cocoa", "Letra 13 sem": "13-week bill", "Nota 5 años": "5-year note", "Nota 10 años": "10-year note", "Bono 30 años": "30-year bond",
  "T-Note 10A": "10Y T-Note", "IPC México": "Mexico IPC", "Oro (GLD)": "Gold (GLD)", "Plata (SLV)": "Silver (SLV)", "Petróleo (USO)": "Oil (USO)",
  "Gas natural (UNG)": "Natural gas (UNG)", "Cobre (CPER)": "Copper (CPER)", "Agrícolas (DBA)": "Agriculture (DBA)", "Europa (VGK)": "Europe (VGK)",
  "Japón (EWJ)": "Japan (EWJ)", "Brasil (EWZ)": "Brazil (EWZ)", "México (EWW)": "Mexico (EWW)", "1-3 años (SHY)": "1-3 years (SHY)",
  "7-10 años (IEF)": "7-10 years (IEF)", "20+ años (TLT)": "20+ years (TLT)", "Alto rendimiento (HYG)": "High yield (HYG)", "Bitcoin (CFD)": "Bitcoin (CFD)",
  // security
  "Añadir a mi lista": "Add to my list", "Quitar de mi lista": "Remove from my list", "Calcular": "Calculate", "Gráfico": "Chart",
  "Fuente del gráfico": "Chart source", "Temporalidad": "Timeframe", "Sin datos para esta temporalidad": "No data for this timeframe",
  "Sesión": "Session", "Apertura": "Open", "Cierre ant.": "Prev. close", "Máximo": "High", "Mínimo": "Low", "Volumen": "Volume",
  "Máx. 52 sem": "52w high", "Mín. 52 sem": "52w low", "Vs. máx. 52s": "Vs 52w high", "mín 52s": "52w low", "máx 52s": "52w high", "del rango": "of range",
  "Orden simulada": "Paper order", "sin dinero real": "no real money", "Cantidad": "Quantity", "Comprar": "Buy", "Vender": "Sell",
  "Noticias del símbolo": "Symbol news", "Sin noticias recientes.": "No recent news.", "Estados financieros · SEC EDGAR": "Financial statements · SEC EDGAR",
  "Consultando la SEC…": "Querying the SEC…", "Solo empresas que reportan a la SEC de EE. UU.": "Only companies that report to the US SEC.",
  "Año calendario (USD)": "Calendar year (USD)", "Cifras anuales en USD": "Annual figures in USD", "Reportes recientes": "Recent filings",
  "Ingresos": "Revenue", "Utilidad operativa": "Operating income", "Utilidad neta": "Net income", "UPA diluida": "Diluted EPS",
  "Caja y equivalentes": "Cash & equivalents", "Activos totales": "Total assets", "Pasivos totales": "Total liabilities", "Patrimonio": "Equity",
  "1 minuto · últimos 5 días": "1 minute · last 5 days", "5 minutos · último mes": "5 minutes · last month", "15 minutos · último mes": "15 minutes · last month",
  "30 minutos · 60 días": "30 minutes · 60 days", "1 hora · 6 meses": "1 hour · 6 months", "4 horas · 1 año": "4 hours · 1 year",
  "Diario · 2 años": "Daily · 2 years", "Semanal · 10 años": "Weekly · 10 years", "Mensual · todo el historial": "Monthly · full history",
  "D": "D", "S": "W", "M": "M",
  // prochart
  "Herramientas de dibujo": "Drawing tools", "Cursor": "Cursor", "Línea de tendencia": "Trend line", "Rayo": "Ray", "Línea horizontal": "Horizontal line",
  "Fibonacci": "Fibonacci", "Regla": "Ruler", "Mover y hacer zoom": "Pan and zoom", "Clic en dos puntos": "Click two points",
  "Línea que se extiende a la derecha. Clic en dos puntos": "Line extending to the right. Click two points",
  "Soporte o resistencia. Un clic": "Support or resistance. One click", "Retroceso: clic en el mínimo y el máximo (o al revés)": "Retracement: click the low and the high (or the reverse)",
  "Mide distancia, % y velas. Clic en dos puntos": "Measures distance, % and bars. Click two points",
  "Deshacer último dibujo": "Undo last drawing", "Deshacer (Ctrl+Z)": "Undo (Ctrl+Z)", "Borrar todos los dibujos": "Delete all drawings", "Borrar todo": "Delete all",
  "Media 20": "MA 20", "Media 50": "MA 50", "Media 200": "MA 200", "Canal de tendencia": "Trend channel", "Máx": "High", "Mín": "Low", "A": "O", "C": "C",
  "velas": "bars", "Gráfico de velas del precio": "Price candlestick chart",
  // trend
  "Lectura técnica de precios pasados por votos de 8 señales. Describe la tendencia de hoy;": "Technical reading of past prices by 8 voting signals. It describes today's trend;",
  "no predice el futuro": "it does not predict the future", "y puede cambiar con la siguiente vela.": "and may change with the next bar.",
  "Consenso ponderado": "Weighted consensus", "Analizando 3 marcos de tiempo…": "Analyzing 3 timeframes…", "Intradía": "Intraday", "Diario": "Daily", "Semanal": "Weekly",
  "ALCISTA": "BULLISH", "BAJISTA": "BEARISH", "LATERAL": "SIDEWAYS", "débil": "weak", "moderada": "moderate", "fuerte": "strong",
  "Alcista": "Bullish", "Bajista": "Bearish", "Ligeramente alcista": "Slightly bullish", "Ligeramente bajista": "Slightly bearish", "Sin dirección clara": "No clear direction",
  "alcista": "bullish", "bajista": "bearish", "lateral": "sideways", "a favor de alza": "for upside", "a favor de baja": "for downside", "neutral": "neutral",
  "Persistente: los movimientos tienden a continuar en la misma dirección": "Persistent: moves tend to continue in the same direction",
  "Revierte a la media: los movimientos tienden a corregirse": "Mean-reverting: moves tend to correct",
  "Cercano al azar: el pasado dice poco del siguiente movimiento": "Close to random: the past says little about the next move",
  "velas de 15-30 min, últimos 5 días · horizonte horas": "15-30 min bars, last 5 days · horizon hours",
  "velas diarias, último año · horizonte días a semanas": "daily bars, last year · horizon days to weeks",
  "velas semanales, últimos 5 años · horizonte meses": "weekly bars, last 5 years · horizon months",
  "Historial insuficiente para este marco.": "Not enough history for this timeframe.",
  "Precio vs media 20": "Price vs MA 20", "Precio vs media 50": "Price vs MA 50", "Media 20 vs media 50": "MA 20 vs MA 50", "Media 50 vs media 200": "MA 50 vs MA 200",
  "MACD (histograma)": "MACD (histogram)", "RSI 14": "RSI 14", "Regresión 20 velas": "20-bar regression", "Posición en el rango 20": "Position in 20-bar range",
  "Tendencia de corto plazo": "Short-term trend", "Tendencia de medio plazo": "Medium-term trend", "Cruce de medias": "Moving-average cross",
  "Régimen de largo plazo": "Long-term regime", "Impulso: la media rápida se aleja o se acerca de la lenta": "Momentum: the fast average moving away from or toward the slow one",
  "Sobrecompra: subida extendida, riesgo de pausa": "Overbought: extended rally, risk of a pause", "Sobreventa: caída extendida, riesgo de rebote": "Oversold: extended drop, risk of a bounce",
  "Zona neutral entre 45 y 55": "Neutral zone between 45 and 55", "Pendiente clara": "Clear slope", "Precio sin dirección clara (R² bajo)": "Price with no clear direction (low R²)",
  "Cerca del máximo o del mínimo reciente": "Near the recent high or low", "20 arriba": "20 above", "20 abajo": "20 below", "cruce dorado": "golden cross", "cruce de la muerte": "death cross",
  "precio": "price", "media 20": "MA 20", "media 50": "MA 50", "- - canal ±2σ extendido 10 velas (si nada cambia)": "- - ±2σ channel extended 10 bars (if nothing changes)",
  "Tendencia del mercado · diario y semanal": "Market trend · daily and weekly", "clic para analizar": "click to analyze",
  "Analizando unos 20 mercados… la primera vez tarda unos segundos.": "Analyzing about 20 markets… the first time takes a few seconds.",
  "Mercado": "Market", "20 días": "20 days", "3 meses": "3 months", "Puntaje de tendencia": "Trend score",
  // risk
  "Bajando un año de precios y calculando con TradingCalc…": "Downloading a year of prices and calculating with TradingCalc…",
  "Rendimiento anualizado": "Annualized return", "Volatilidad anualizada": "Annualized volatility", "Sharpe (Lo, ajustado)": "Sharpe (Lo, adjusted)", "Sortino": "Sortino",
  "Caída máxima": "Max drawdown", "Calmar": "Calmar", "% de días al alza": "% up days", "Mejor día": "Best day", "Peor día": "Worst day", "Asimetría": "Skewness", "Curtosis": "Kurtosis", "PSR": "PSR",
  "Si el último año se repitiera tal cual": "If the last year repeated exactly", "Cuánto se mueve el precio en un año típico": "How much the price moves in a typical year",
  "Rendimiento por unidad de riesgo, corregido por autocorrelación": "Return per unit of risk, corrected for autocorrelation",
  "Como Sharpe, pero solo castiga las caídas": "Like Sharpe, but only penalizes downside", "Peor caída desde un máximo en el periodo": "Worst drop from a peak in the period",
  "Rendimiento anual ÷ caída máxima": "Annual return ÷ max drawdown", "Negativa = caídas fuertes más frecuentes que subidas fuertes": "Negative = sharp drops more frequent than sharp rallies",
  "Alta = días extremos más comunes de lo normal": "High = extreme days more common than normal", "Probabilidad de que el Sharpe real sea mayor que 0": "Probability that the true Sharpe is above 0",
  "Valor en riesgo · 1 día": "Value at risk · 1 day", "Tamaño de la posición (USD)": "Position size (USD)", "Confianza": "Confidence",
  "VaR 95%: en 19 de cada 20 días la pérdida no debería pasar de esa cifra. CVaR: la pérdida promedio en el día malo restante. Supone que el próximo año se parece al último, y casi nunca es así.":
    "VaR 95%: on 19 of every 20 days the loss should not exceed that figure. CVaR: the average loss on the remaining bad day. It assumes next year resembles the last, which is rarely true.",
  "Distribución de retornos diarios": "Distribution of daily returns", "firmado": "signed", "No hay historial suficiente": "Not enough history",
  // calculators
  "Riesgo / beneficio": "Risk / reward", "Tamaño de posición": "Position size", "Opciones · Black-Scholes": "Options · Black-Scholes", "Forex · valor del pip": "Forex · pip value",
  "Cuánto comprar para arriesgar un % fijo de tu cuenta, y qué ganas si llega al objetivo.": "How much to buy to risk a fixed % of your account, and what you make if it hits the target.",
  "Cuántas unidades comprar para no perder más de una cifra en dólares si toca el stop.": "How many units to buy so you lose no more than a dollar amount if the stop is hit.",
  "Precio teórico y griegas de una opción europea. La volatilidad es la implícita que tú supongas.": "Theoretical price and Greeks of a European option. Volatility is the implied volatility you assume.",
  "Lote estándar 100.000 · mini 10.000 · micro 1.000.": "Standard lot 100,000 · mini 10,000 · micro 1,000.",
  "Dirección": "Direction", "Entrada": "Entry", "Stop": "Stop", "Objetivo": "Target", "Cuenta (USD)": "Account (USD)", "Riesgo %": "Risk %", "Apalancamiento": "Leverage",
  "Pérdida máx. (USD)": "Max loss (USD)", "Precio subyacente": "Underlying price", "Strike": "Strike", "Días al vencimiento": "Days to expiry", "Volatilidad %": "Volatility %",
  "Tasa libre de riesgo %": "Risk-free rate %", "Dividendo %": "Dividend %", "Par (BASE/COTIZ.)": "Pair (BASE/QUOTE)", "Unidades": "Units",
  "Compra (long)": "Buy (long)", "Venta (short)": "Sell (short)", "Valor de la posición": "Position value", "Resultado en stop": "P&L at stop", "Resultado en objetivo": "P&L at target",
  "Ratio R:B": "R:R ratio", "Valor (USD)": "Value (USD)", "Distancia al stop %": "Distance to stop %", "Delta call": "Call delta", "Delta put": "Put delta", "Gamma": "Gamma",
  "Vega (por 1%)": "Vega (per 1%)", "Theta call / día": "Call theta / day", "Theta put / día": "Put theta / day", "Tamaño del pip": "Pip size", "Valor del pip (moneda cotizada)": "Pip value (quote currency)",
  "Valores iniciales tomados de": "Initial values taken from", ". Los cálculos los hace TradingCalc, sin comisiones.": ". Calculations by TradingCalc, without fees.",
  // portfolio
  "Resultado total": "Total P&L", "Rentabilidad": "Return", "No realizado": "Unrealized", "Efectivo": "Cash",
  "Precio medio": "Avg price", "Valor": "Value", "Resultado": "P&L", "Peso": "Weight", "Cerrar": "Close", "Historial de órdenes": "Order history",
  "Reiniciar cartera": "Reset portfolio", "¿Borrar todo y volver a $100.000?": "Delete everything and go back to $100,000?", "Sí, reiniciar": "Yes, reset", "No": "No",
  "Todavía no hay órdenes.": "No orders yet.", "COMPRA": "BUY", "VENTA": "SELL", "Sin posiciones. Escribe": "No positions. Type",
  "en la línea de comandos, o usa la caja de órdenes en la ficha de un símbolo.": "in the command line, or use the order box on a symbol page.",
  // news
  "Noticias de mercado": "Market news", "Todas": "All", "Cargando titulares…": "Loading headlines…", "Titulares en inglés, enlazados a su fuente original.": "Headlines in English, linked to their original source.",
  "Fuente": "Source",
  // analyst
  "datos de": "data for", "Nueva conversación": "New conversation", "Tú": "You", "Analista · Nemotron (NVIDIA)": "Analyst · Nemotron (NVIDIA)",
  "Reuniendo datos y pensando…": "Gathering data and thinking…", "Tu pregunta": "Your question",
  "Escribe tu pregunta. Enter envía, Shift+Enter cambia de línea.": "Type your question. Enter sends, Shift+Enter for a new line.",
  "Detener respuesta": "Stop response", "Enviar pregunta": "Send question",
  "La IA puede equivocarse. Sus respuestas son informativas y no son recomendaciones de inversión.": "AI can be wrong. Its answers are informational and are not investment advice.",
  "¿Cómo está el ánimo general del mercado hoy?": "How is overall market sentiment today?",
  "Para usar el Analista IA conecta tu key gratuita de NVIDIA en Conexiones.": "To use the AI Analyst, connect your free NVIDIA key in Connections.",
  // help
  "Comandos": "Commands", "Teclado": "Keyboard", "De dónde salen los datos": "Where the data comes from", "Manual completo": "Full manual", "abrir el manual": "open the manual",
  "Abre la ficha del símbolo (gráfico, sesión, noticias, estados financieros)": "Opens the symbol page (chart, session, news, financial statements)",
  "Busca por nombre; elige con ↑ ↓ y Enter": "Search by name; pick with ↑ ↓ and Enter", "Abre el símbolo directo en la vista de riesgo": "Opens the symbol directly in the risk view",
  "Cambia de vista": "Switches view", "Abre el símbolo directo en Tendencia": "Opens the symbol directly in Trend",
  "Orden simulada al último precio (sin el símbolo usa el activo)": "Paper order at the last price (without a symbol it uses the active one)",
  "Vende de la cartera simulada": "Sells from the paper portfolio", "Añade o quita de tu lista en Mercados": "Adds or removes from your list in Markets",
  "Ir a la línea de comandos": "Go to the command line", "Cambiar de vista (Alt+0 = Conexiones)": "Switch view (Alt+0 = Connections)", "Limpiar la línea de comandos": "Clear the command line",
  "Esta terminal muestra datos. No te dice qué comprar ni vender.": "This terminal shows data. It does not tell you what to buy or sell.",
  // connections
  "Cómo funciona": "How it works", "Modo de esta instalación": "Mode of this installation", "Ver el manual de conexión paso a paso": "See the step-by-step connection manual",
  "conectada": "connected", "conectado": "connected", "sin conectar": "not connected", "sin conexión": "not connected",
  "Crear cuenta y obtener key": "Create account and get key", "Guardar y probar": "Save and test", "Probando…": "Testing…", "Quitar": "Remove",
  "Mostrar key": "Show key", "Ocultar key": "Hide key", "No se pudo probar la conexión": "Could not test the connection",
  "Precios en tiempo real de acciones y ETF de EE. UU., búsqueda y noticias por empresa.": "Real-time prices for US stocks and ETFs, search and company news.",
  "Gratis: 60 consultas por minuto.": "Free: 60 requests per minute.",
  "Gráficos de 1 minuto a mensual para acciones, ETF y divisas; precios de divisas intradía.": "1-minute to monthly charts for stocks, ETFs and currencies; intraday currency prices.",
  "Gratis: 8 consultas por minuto, 800 por día.": "Free: 8 requests per minute, 800 per day.",
  "Historial y gráficos de acciones, ETF y divisas (respaldo si no tienes Twelve Data).": "History and charts for stocks, ETFs and currencies (backup if you don't have Twelve Data).",
  "Gratis: 5 consultas por minuto, datos de fin de día. Los planes pagados suman tiempo real y futuros.": "Free: 5 requests per minute, end-of-day data. Paid plans add real time and futures.",
  "El Analista IA (modelo Nemotron). Tus preguntas se envían a NVIDIA con tu key.": "The AI Analyst (Nemotron model). Your questions are sent to NVIDIA with your key.",
  "Gratis con créditos de prueba para desarrolladores.": "Free with developer trial credits.",
  "Sin ninguna key": "Without any key", "Con tus keys": "With your keys", "Dónde se guardan:": "Where they are stored:", "Futuros (NQ, ES, MNQ)": "Futures (NQ, ES, MNQ)",
  "ves cripto en vivo (Binance), divisas diarias del Banco Central Europeo, estados financieros de la SEC y todas las calculadoras.":
    "you get live crypto (Binance), daily European Central Bank exchange rates, SEC financial statements and all calculators.",
  "ves acciones, ETF, divisas intradía, gráficos completos y el Analista IA. Los datos llegan con tu propia licencia, para tu uso personal.":
    "you get stocks, ETFs, intraday currencies, full charts and the AI Analyst. Data arrives under your own license, for your personal use.",
  "solo en este navegador. Viajan con cada consulta al servidor de ATALAYA, que las reenvía al proveedor y no las guarda ni las registra.":
    "only in this browser. They travel with each request to the ATALAYA server, which forwards them to the provider and neither stores nor logs them.",
  "no están en los planes gratis de estos proveedores.": "are not in these providers' free plans.",
  "Bloomberg no ofrece una API que se pueda conectar a una web: solo funciona con una suscripción a Bloomberg Terminal en la misma computadora.":
    "Bloomberg offers no API that a website can connect to: it only works with a Bloomberg Terminal subscription on the same computer.",
  "Modo": "Mode", "público": "public",
  ": solo fuentes que se pueden mostrar libremente y las keys de cada persona.": ": only sources that may be freely displayed, plus each person's keys.",
  ": además de tus keys usa Yahoo Finance (con retraso) para índices, futuros y materias primas. Es solo para uso propio, no para publicar.":
    ": besides your keys it uses Yahoo Finance (delayed) for indices, futures and commodities. For personal use only, not for publishing.",
  // TradingView notes
  "Gráfico y datos de": "Chart and data by", "Datos de": "Data by", "Cotizaciones de": "Quotes by", "Algunos pueden ir con retraso.": "Some may be delayed.",
  ". Conecta Finnhub para verlas en ATALAYA en tiempo real.": ". Connect Finnhub to see them in ATALAYA in real time.",
  ". Algunos futuros pueden pedir suscripción o mostrarse con retraso. ATALAYA no lee estos datos: las herramientas de Tendencia, Riesgo e IA siguen usando tus otras fuentes.":
    ". Some futures may require a subscription or be delayed. ATALAYA does not read this data: the Trend, Risk and AI tools keep using your other sources.",
  // server messages
  "Para gráficos de acciones y ETF conecta Twelve Data o Polygon en Conexiones (son gratis).": "For stock and ETF charts, connect Twelve Data or Polygon in Connections (they are free).",
  "Para divisas intradía conecta Twelve Data o Polygon (Conexiones).": "For intraday currencies, connect Twelve Data or Polygon (Connections).",
  "Este mercado no está disponible en la versión pública. Prueba con un ETF que lo siga (por ejemplo SPY para el S&P 500).": "This market is not available in the public version. Try an ETF that tracks it (for example SPY for the S&P 500).",
  "Falta el símbolo": "Missing symbol", "Símbolo no encontrado": "Symbol not found",
  "ATALAYA Financial: terminal de mercados en español": "ATALAYA Financial: market terminal in Spanish and English",
  "Precios de cripto, divisas, acciones, ETF e índices; gráficos de 1 minuto a mensual con medias, Bollinger, RSI, MACD, Fibonacci y líneas de tendencia; lectura de tendencia intradía, diaria y semanal; riesgo con VaR y Sharpe; calculadoras de tamaño de posición, riesgo/beneficio, opciones y forex; analista con inteligencia artificial y cartera simulada. Herramienta informativa: no es recomendación de inversión.": "Crypto, currency, stock, ETF and index prices; 1-minute to monthly charts with moving averages, Bollinger, RSI, MACD, Fibonacci and trend lines; intraday, daily and weekly trend readings; risk with VaR and Sharpe; position size, risk/reward, options and forex calculators; AI analyst and paper portfolio. Informational tool: not investment advice.",
  "Manual de uso": "User manual",
  "Términos y aviso de riesgo": "Terms and risk notice",
  "% del rango": "% of range",
  "% por vela": "% per bar",
  "Histograma de retornos diarios con la línea del VaR al 95%": "Histogram of daily returns with the 95% VaR line",
  "Pregunta sobre el mercado o sobre": "Ask about the market or about",
  ". Antes de responder, el analista recibe los precios del tablero, el análisis de tendencia por marco de tiempo, el exponente de Hurst y los titulares recientes.": ". Before answering, the analyst receives the board prices, the trend analysis per timeframe, the Hurst exponent and recent headlines.",
  "Cartera simulada · empieza con $100.000 · realizado": "Paper portfolio · starts at $100,000 · realized",
  "MERC · TEND · RIESGO · IA · CALC · CARTERA · NOT": "MKT · TREND · RISK · AI · CALC · PORT · NEWS",
  "COMPRAR 10 AAPL": "BUY 10 AAPL",
  "VENDER 5 AAPL": "SELL 5 AAPL",
  "VIGILAR TSLA · QUITAR TSLA": "WATCH TSLA · UNWATCH TSLA",
  "NVDA RIESGO": "NVDA RISK",
  "BTC TEND": "BTC TREND",
  "Guía paso a paso de cada pantalla y de cómo conectar APIs, MetaTrader 5 y NinjaTrader:": "Step-by-step guide to every screen and to connecting APIs, MetaTrader 5 and NinjaTrader:",
  "Acciones, ETF y gráficos:": "Stocks, ETFs and charts:",
  "con tus keys de Finnhub, Twelve Data o Polygon (pestaña Conexiones). En la instalación personal, además, Yahoo Finance con retraso.": "with your Finnhub, Twelve Data or Polygon keys (Connections tab). In the personal installation, also delayed Yahoo Finance.",
  "Divisas sin key:": "Currencies without a key:",
  "tipos de referencia diarios del Banco Central Europeo.": "daily European Central Bank reference rates.",
  "Cripto:": "Crypto:",
  "Binance, en tiempo real (pares contra USDT).": "Binance, real time (USDT pairs).",
  "Estados financieros y reportes:": "Financial statements and filings:",
  "SEC EDGAR, empresas de EE. UU.": "SEC EDGAR, US companies.",
  "Cálculos de riesgo y calculadoras:": "Risk calculations and calculators:",
  "TradingCalc, resultados deterministas y firmados.": "TradingCalc, deterministic and signed results.",
  "Cartera simulada:": "Paper portfolio:",
  "se guarda solo en este navegador.": "is stored only in this browser.",
  "NinjaTrader · tu PC": "NinjaTrader · your PC",
  "MetaTrader 5 · tu PC": "MetaTrader 5 · your PC",
  "Precios en vivo de tus futuros (MNQ, NQ, ES…) tomados de tu NinjaTrader. Solo lectura, solo en esta computadora: no envía órdenes ni toca tu cuenta.": "Live prices of your futures (MNQ, NQ, ES…) taken from your NinjaTrader. Read-only, this computer only: it sends no orders and doesn't touch your account.",
  "Descarga": "Download",
  "(no lo descomprimas).": "(don't unzip it).",
  "En NinjaTrader:": "In NinjaTrader:",
  "Herramientas → Importar → Complemento NinjaScript…": "Tools → Import → NinjaScript Add-On…",
  ", elige el .zip y acepta. NinjaTrader lo compila solo.": ", choose the .zip and accept. NinjaTrader compiles it automatically.",
  "En un gráfico de MNQ (y de cada instrumento que quieras): clic derecho →": "On an MNQ chart (and on each instrument you want): right-click →",
  "Indicadores…": "Indicators…",
  "→ agrega": "→ add",
  "→ Aceptar.": "→ OK.",
  "Deja NinjaTrader abierto. Esta tarjeta pasa a": "Keep NinjaTrader open. This card switches to",
  "y los futuros dicen": "and futures show",
  "ATALAYA lee": "ATALAYA reads",
  ". Si cierras NinjaTrader, vuelve sola a los datos con retraso.": ". If you close NinjaTrader, it falls back to delayed data on its own.",
  "Precios en vivo de divisas, oro, plata, petróleo e índices (US100, US500, GER40…) desde tu MetaTrader 5. Solo lectura: no envía órdenes ni lee tu saldo. Usa la librería oficial de MetaQuotes, no un Asesor Experto.": "Live prices of currencies, gold, silver, oil and indices (US100, US500, GER40…) from your MetaTrader 5. Read-only: it sends no orders and doesn't read your balance. It uses MetaQuotes' official library, not an Expert Advisor.",
  "Instala MetaTrader 5 desde": "Install MetaTrader 5 from",
  "y abre una cuenta": "and open a",
  "demo": "demo account",
  "(gratis, sin depósito).": "(free, no deposit).",
  "Con MetaTrader 5 abierto, haz doble clic en": "With MetaTrader 5 open, double-click",
  "(carpeta atalaya-terminal). La primera vez instala el paquete oficial.": "(atalaya-terminal folder). The first time it installs the official package.",
  "Deja esa ventana abierta. Las divisas pasan a": "Keep that window open. Currencies switch to",
  "y aparece un panel con oro, índices y petróleo en Mercados.": "and a panel with gold, indices and oil appears in Markets.",
  "Son precios de tu bróker (CFD): siguen al mercado pero no son idénticos a los futuros de CME. Solo para uso personal.": "These are your broker's prices (CFDs): they track the market but are not identical to CME futures. Personal use only.",
  "API key de": "API key for",
  "conectado ·": "connected ·",
  "instrumento": "instrument",
  "Precios en vivo de divisas, oro, plata, petróleo e índices (US100, US500, GER40…) desde tu MetaTrader 5. Solo lectura: no envía órdenes ni lee tu saldo. Usa la librería oficial de MetaQuotes, no un Asesor Experto. Los datos van de tu PC a tu navegador; no pasan por el servidor de ATALAYA.": "Live prices of currencies, gold, silver, oil and indices (US100, US500, GER40…) from your MetaTrader 5. Read-only: it sends no orders and doesn't read your balance. It uses MetaQuotes' official library, not an Expert Advisor. Data goes from your PC to your browser; it does not pass through the ATALAYA server.",
  "(gratis, sin depósito), o usa la tuya.": "(free, no deposit), or use yours.",
  "Instala": "Install",
  "Python 3": "Python 3",
  "(marca “Add Python to PATH”).": "(tick “Add Python to PATH”).",
  ", descomprímelo y, con MetaTrader 5 abierto, haz doble clic en": ", unzip it and, with MetaTrader 5 open, double-click",
  "Deja esa ventana abierta. Esta tarjeta pasa a": "Keep that window open. This card switches to",
  ", las divisas dicen": ", currencies show",
  "y aparece un panel con tus instrumentos en Mercados.": "and a panel with your instruments appears in Markets.",
  "Funciona en Chrome, Edge y Firefox (si el navegador pide permiso de “acceso a la red local”, acéptalo). Son precios de tu bróker (CFD), no idénticos a los futuros de CME, y solo para tu uso personal.": "Works in Chrome, Edge and Firefox (if the browser asks for “local network access”, allow it). These are your broker's prices (CFDs), not identical to CME futures, and for your personal use only.",
  "Precios en vivo de tus futuros (MNQ, NQ, ES…) tomados de tu NinjaTrader 8. Solo lectura: no envía órdenes ni toca tu cuenta. Los datos van de tu PC a tu navegador; no pasan por el servidor de ATALAYA.": "Live prices of your futures (MNQ, NQ, ES…) taken from your NinjaTrader 8. Read-only: it sends no orders and doesn't touch your account. Data goes from your PC to your browser; it does not pass through the ATALAYA server.",
  "desde tu navegador (Chrome, Edge o Firefox; si pide permiso de “acceso a la red local”, acéptalo). Si cierras NinjaTrader, vuelve sola a los otros datos. Si usas una cuenta de fondeo, confirma antes con tu firma que puedes usar un indicador de solo lectura.": "from your browser (Chrome, Edge or Firefox; if it asks for “local network access”, allow it). If you close NinjaTrader, it falls back to the other data on its own. If you trade a funded account, first confirm with your firm that you may use a read-only indicator.",
  "Fondeo Agent v5": "Fondeo Agent v5",
  "Indicadores ·": "Indicators ·",
  "Índices, materias primas y bonos · TradingView": "Indices, commodities & bonds · TradingView",
  ". Los futuros se muestran con su equivalente de contado o CFD (por ejemplo NQ como Nasdaq 100). ATALAYA no lee estos datos: las herramientas de Tendencia, Riesgo e IA siguen usando tus otras fuentes.": ". Futures are shown through their cash or CFD equivalent (for example NQ as the Nasdaq 100). ATALAYA does not read this data: the Trend, Risk and AI tools keep using your other sources.",
  "Ajustes Fondeo": "Fondeo settings",
  "Ajustes Fondeo Agent": "Fondeo Agent settings",
  "Panel Fondeo Agent": "Fondeo Agent panel",
  "Margen al límite": "Margin to limit",
  "Operaciones hoy": "Trades today",
  "Tamaño": "Size",
  "Stop muy amplio": "Stop too wide",
  "P&L simulado hoy": "Simulated P&L today",
  "Horario de entradas": "Entry window",
  "ABIERTO": "OPEN",
  "CERRADO": "CLOSED",
  "BLOQUEO": "BLOCKED",
  "OK": "OK",
  "Puede operar": "Can trade",
  "SÍ": "YES",
  "Operación": "Trade",
  "LARGO": "LONG",
  "CORTO": "SHORT",
  "Stop actual": "Current stop",
  "Usa una temporalidad intradía (1m a 15m) para ver señales.": "Use an intraday timeframe (1m to 15m) to see signals.",
  "Señales simuladas, solo visuales. No es recomendación.": "Simulated signals, visual only. Not a recommendation.",
  "Mismas reglas que tu indicador de TradingView. Se guardan en este navegador.": "Same rules as your TradingView indicator. Saved in this browser.",
  "Cerrar ajustes": "Close settings",
  "Tamaño de cuenta": "Account size",
  "Trailing DD ($) · 0 = típico": "Trailing DD ($) · 0 = typical",
  "Saldo actual ($)": "Current balance ($)",
  "Saldo máximo ($)": "Peak balance ($)",
  "Colchón mínimo ($)": "Minimum cushion ($)",
  "Riesgo por operación ($)": "Risk per trade ($)",
  "Máx. contratos": "Max contracts",
  "Máx. operaciones/día": "Max trades/day",
  "Pérdida diaria máx. ($)": "Max daily loss ($)",
  "ATR length": "ATR length",
  "ATR × (stop)": "ATR × (stop)",
  "Stop mínimo (pts)": "Minimum stop (pts)",
  "Objetivo (R)": "Target (R)",
  "Breakeven en (R)": "Breakeven at (R)",
  "Bloqueo noticias (min)": "News block (min)",
  "Filtro de noticias (hora de Nueva York)": "News filter (New York time)",
  "Restaurar valores originales": "Restore original values",
  "Stop a breakeven": "Stop to breakeven",
  "Setup largo casi confirmado": "Long setup almost confirmed",
  "Setup corto casi confirmado": "Short setup almost confirmed",
  "Sin entrada: stop muy amplio": "No entry: stop too wide",
  "Sin entrada: poco margen": "No entry: low margin",
  "Obj": "Tgt",
  "Fibonacci: Retroceso: clic en el mínimo y el máximo (o al revés)": "Fibonacci: Retracement: click the low and the high (or the reverse)",
  "Precio de BTC-USD con medias móviles y canal de regresión proyectado": "BTC-USD price with moving averages and projected regression channel",
};

// Text with variable parts (numbers, symbols).
const PATTERNS: [RegExp, (...m: string[]) => string][] = [
  [/^Sin datos propios para (.+?): (.+) Te muestro el gráfico de TradingView\.$/, (_, s, e) => `No own data for ${s}: ${t(e)} Showing the TradingView chart.`],
  [/^Compra simulada: (.+)$/, (_, r) => `Paper buy: ${r}`],
  [/^Venta simulada: (.+)$/, (_, r) => `Paper sell: ${r}`],
  [/^Sin precio para (.+)$/, (_, s) => `No price for ${s}`],
  [/^Efectivo insuficiente: necesitas (.+), tienes (.+)$/, (_, a, b) => `Insufficient cash: you need ${a}, you have ${b}`],
  [/^Solo tienes (.+) de (.+) \(la cartera simulada no permite ventas en corto\)$/, (_, q, s) => `You only hold ${q} of ${s} (the paper portfolio does not allow short selling)`],
  [/^(.+) añadido a tu lista$/, (_, s) => `${s} added to your list`],
  [/^Riesgo · (.+) · (\d+) días$/, (_, s, n) => `Risk · ${s} · ${n} days`],
  [/^Riesgo · (.+)$/, (_, s) => `Risk · ${s}`],
  [/^Posiciones \((\d+)\)$/, (_, n) => `Positions (${n})`],
  [/^Cartera simulada · empieza con \$100\.000 · realizado (.+)$/, (_, r) => `Paper portfolio · starts at $100,000 · realized ${r}`],
  [/^Indicadores · (\d+)$/, (_, n) => `Indicators · ${n}`],
  [/^(\d+) velas$/, (_, n) => `${n} bars`],
  [/^(\d+)% del rango$/, (_, n) => `${n}% of range`],
  [/^ATR (.+)% por vela$/, (_, n) => `ATR ${n}% per bar`],
  [/^Hurst \(TradingCalc\) · (.+)$/, (_, n) => `Hurst (TradingCalc) · ${n}`],
  [/^S (.+) · R (.+)$/, (_, a, b) => `S ${a} · R ${b}`],
  [/^Resume la tendencia de (.+) en los tres marcos de tiempo$/, (_, s) => `Summarize the trend of ${s} across the three timeframes`],
  [/^¿Qué niveles de (.+) conviene vigilar y por qué\?$/, (_, s) => `Which ${s} levels are worth watching, and why?`],
  [/^¿Las noticias recientes de (.+) coinciden con lo que muestra el gráfico\?$/, (_, s) => `Does recent news about ${s} match what the chart shows?`],
  [/^Pega tu key de (.+)$/, (_, p) => `Paste your ${p} key`],
  [/^API key de (.+)$/, (_, p) => `${p} API key`],
  [/^conectado · (\d+) instrumentos?$/, (_, n) => `connected · ${n} instrument${n === "1" ? "" : "s"}`],
  [/^conectado · (.+)$/, (_, s) => `connected · ${s}`],
  [/^Quitar (.+) de la lista$/, (_, s) => `Remove ${s} from the list`],
  [/^Marca las (\d+) casillas para continuar\.$/, (_, n) => `Tick the ${n} boxes to continue.`],
  [/^Mercado cerrado · último dato (.+)$/, (_, d) => `Market closed · last data ${d}`],
  [/^Último dato: (.+)$/, (_, d) => `Last data: ${d}`],
  [/^No pude responder: (.+)$/, (_, e) => `Could not answer: ${t(e)}`],
  [/^No encontré “(.+)”\. (.+)$/, (_, s, e) => `Couldn't find “${s}”. ${t(e)}`],
  [/^Precio en el (\d+)% del rango de 52 semanas$/, (_, n) => `Price at ${n}% of the 52-week range`],
  [/^(LARGO|CORTO) #(\d+) · (.+) (cto|unid\.) · riesgo (.+)$/, (_, d, n, q, u, r) => `${d === "LARGO" ? "LONG" : "SHORT"} #${n} · ${q} ${u === "cto" ? "ct" : "units"} · risk ${r}`],
  [/^(Objetivo|Stop|Breakeven|Fin de horario) ([+-]\$.+)$/, (_, m, r) => `${({ Objetivo: "Target", Stop: "Stop", Breakeven: "Breakeven", "Fin de horario": "End of session" } as Record<string, string>)[m]} ${r}`],
  [/^Cuenta (25K|50K)$/, (_, c) => `Account ${c}`],
  [/^Límite: (.+)$/, (_, v) => `Limit: ${v}`],
  [/^(.+) (cto|unid\.) · riesgo (.+)$/, (_, q, u, r) => `${q} ${u === "cto" ? "ct" : "units"} · risk ${r}`],
  [/^1 pto = (.+)$/, (_, v) => `1 pt = ${v}`],
  [/^Valor del punto \(\$\) · 0 = auto \((.+)\)$/, (_, v) => `Point value ($) · 0 = auto (${v})`],
  [/^Noticia (\d)$/, (_, n) => `News ${n}`],
  [/^Precio de (.+) con medias móviles y canal de regresión proyectado$/, (_, s) => `${s} price with moving averages and projected regression channel`],
  [/^(.+): (Clic en dos puntos|Un clic.*|clic en el segundo punto · Esc cancela)$/, (_, a, b) => `${t(a)}: ${b === "clic en el segundo punto · Esc cancela" ? "click the second point · Esc cancels" : t(b)}`],
];

let current: Lang = "es";
export function t(s: string): string {
  if (current === "es") return s;
  const k = s.trim();
  if (!k) return s;
  const hit = EN[k];
  if (hit != null) return s.replace(k, hit);
  for (const [re, fn] of PATTERNS) {
    const m = k.match(re);
    if (m) return s.replace(k, fn(...m));
  }
  // Compound labels: "Name · SYMBOL", "Label: hint". Translate the parts we know.
  for (const sep of [" · ", ": "]) {
    if (!k.includes(sep)) continue;
    const parts = k.split(sep);
    const tr = parts.map((p) => EN[p] ?? p);
    if (tr.some((p, i) => p !== parts[i])) return s.replace(k, tr.join(sep));
  }
  return s;
}

// ---------------- DOM layer ----------------
const ATTRS = ["placeholder", "title", "aria-label"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE"]);

function translateNode(n: Node) {
  if (n.nodeType === Node.TEXT_NODE) {
    const p = n.parentElement;
    if (p && (SKIP.has(p.tagName) || p.closest("[data-no-translate],.tradingview-widget-container"))) return;
    const v = n.nodeValue ?? "";
    const tr = t(v);
    if (tr !== v) n.nodeValue = tr;
    return;
  }
  if (n.nodeType !== Node.ELEMENT_NODE) return;
  const el = n as Element;
  if (el.closest("[data-no-translate],.tradingview-widget-container")) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v) { const tr = t(v); if (tr !== v) el.setAttribute(a, tr); }
  }
  if (SKIP.has(el.tagName)) return; // never rewrite what people type
  el.childNodes.forEach(translateNode);
}

let started = false;
export function startTranslator() {
  if (started || typeof window === "undefined") return;
  started = true;
  current = getLang();
  document.documentElement.lang = current;
  if (current === "es") return;
  translateNode(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") translateNode(m.target);
      else if (m.type === "attributes") translateNode(m.target);
      else m.addedNodes.forEach(translateNode);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

export const lang = () => current;
