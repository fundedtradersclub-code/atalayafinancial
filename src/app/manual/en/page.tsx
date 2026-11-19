import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  alternates: { canonical: "/manual/en", languages: { es: "/manual", en: "/manual/en" } },
  title: "User manual · ATALAYA",
  description: "How to use ATALAYA: screens, charts, trend, risk, AI analyst, paper portfolio, and how to connect APIs, MetaTrader 5 and NinjaTrader.",
};

// Same anchors as the Spanish manual so deep links (#apis, #mt5…) work in both languages.
const TOC: [string, string][] = [
  ["inicio", "1. Getting started"],
  ["comandos", "2. Command line and keyboard"],
  ["etiquetas", "3. What the labels mean"],
  ["mercados", "4. Markets"],
  ["simbolo", "5. Symbol and chart"],
  ["fondeo", "6. Fondeo Agent v5 indicator"],
  ["tendencia", "7. Trend"],
  ["riesgo", "8. Risk"],
  ["ia", "9. AI Analyst"],
  ["calc", "10. Calculators"],
  ["cartera", "11. Paper portfolio"],
  ["noticias", "12. News"],
  ["apis", "13. Connect APIs (Finnhub, Twelve Data, Polygon, NVIDIA)"],
  ["mt5", "14. Connect MetaTrader 5"],
  ["ninja", "15. Connect NinjaTrader"],
  ["privacidad", "16. Privacy and risk"],
  ["faq", "17. Frequently asked questions"],
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-6 border-b border-line pb-1 pt-10 font-cond text-[17px] font-semibold uppercase tracking-wider text-amber">
      {children}
    </h2>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-line-strong bg-panel px-1.5 py-0.5 text-[12px] text-amber">{children}</kbd>;
}

function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return <div className={`border-l-2 bg-panel px-3 py-2 ${tone === "warn" ? "border-down" : "border-amber"}`}>{children}</div>;
}

export default function ManualEn() {
  return (
    <div className="h-full overflow-auto" lang="en">
      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <Link href="/" aria-label="ATALAYA Financial, home"><Logo size={34} /></Link>
          <p className="mt-2 text-[12px] text-muted">User manual</p>
          <div role="group" aria-label="Idioma / Language" className="mt-3 flex w-fit border border-line-strong text-[11px]">
            <Link href="/manual" hrefLang="es" lang="es" className="px-2 py-0.5 text-muted hover:text-text">Español</Link>
            <span aria-current="page" className="bg-amber px-2 py-0.5 text-black">English</span>
          </div>
          <nav aria-label="Contents" className="mt-4">
            <ol className="space-y-1 text-[12px]">
              {TOC.map(([id, t]) => (
                <li key={id}><a href={`#${id}`} className="text-muted hover:text-amber">{t}</a></li>
              ))}
            </ol>
          </nav>
          <Link href="/" className="btn mt-6 inline-block border border-amber px-3 py-1.5 font-cond text-[12px] uppercase tracking-wider text-amber hover:bg-amber hover:text-black">
            Open the terminal
          </Link>
        </aside>

        <article className="max-w-[720px] space-y-3 text-[13.5px] leading-relaxed text-text/90 [&_li]:ml-5 [&_ol>li]:list-decimal [&_strong]:text-text [&_ul>li]:list-disc">
          <h1 className="font-cond text-[30px] font-semibold text-text">ATALAYA Financial manual</h1>
          <p>
            ATALAYA is a market terminal: it brings prices, charts, technical analysis, risk, calculators, news and an AI analyst together on one screen,
            in the style of professional terminals. <strong>It shows data; it does not tell you what to buy or sell.</strong>
          </p>
          <p className="text-[12px] text-muted">
            Tip: switch the terminal to English with the <strong>ES / EN</strong> selector next to the logo. Your choice is remembered in this browser.
          </p>

          <H id="inicio">1. Getting started</H>
          <ol>
            <li>The first time, a window shows 4 conditions (not advice, investing is risky, data belongs to third parties, terms). Tick them and press <strong>I accept, enter</strong>.</li>
            <li>At the top is the <strong>command line</strong>: type a symbol or a command and press Enter.</li>
            <li>Below it, the <strong>price ticker</strong> (hover to pause it; click a price to open it).</li>
            <li>The numbered <strong>tabs</strong> are the screens. The number is its keyboard shortcut (Alt + number).</li>
            <li>On the right, the <strong>clocks</strong> for New York, London, Tokyo and your local time. A green dot means the exchange is open.</li>
            <li>At the bottom, the legal notice and links to Terms, Privacy, Cookies, Sources, Claims and this manual.</li>
          </ol>
          <Note>Your symbol list, paper portfolio, drawings, API keys and language are stored <strong>only in your browser</strong>. If you switch browsers or clear the site data, you start from scratch.</Note>

          <H id="comandos">2. Command line and keyboard</H>
          <ul>
            <li><K>AAPL</K> <K>NQ</K> <K>BTC</K> <K>GOLD</K> <K>EURUSD</K>: opens the symbol page.</li>
            <li><K>apple</K>, <K>tesla</K>: searches by name; pick with ↑ ↓ and Enter.</li>
            <li><K>NVDA RISK</K> or <K>BTC TREND</K>: opens the symbol directly on that screen.</li>
            <li><K>MKT</K> <K>TREND</K> <K>RISK</K> <K>AI</K> <K>CALC</K> <K>PORT</K> <K>NEWS</K> <K>HELP</K> <K>KEYS</K>: switches screens. The Spanish commands (MERC, TEND, RIESGO, IA, CARTERA, NOT, AYUDA, CONEXIONES) also work.</li>
            <li><K>BUY 10 AAPL</K> · <K>SELL 5 AAPL</K>: orders in the paper portfolio (fictitious money).</li>
            <li><K>WATCH TSLA</K> · <K>UNWATCH TSLA</K>: adds or removes from your list.</li>
          </ul>
          <p>Shortcuts: <K>/</K> or <K>Ctrl+K</K> jumps to the command line · <K>Alt+1</K>…<K>Alt+9</K> and <K>Alt+0</K> switch screens · <K>Esc</K> clears.</p>

          <H id="etiquetas">3. What the labels mean</H>
          <ul>
            <li><span className="text-up">● LIVE</span>: real-time price (crypto from Binance, stocks with your Finnhub key).</li>
            <li><span className="text-up">● METATRADER 5</span> / <span className="text-up">● NINJATRADER</span>: live price from your own trading software, read on your computer (in the public site and in the personal installation).</li>
            <li><span className="text-muted">DELAYED</span>: the data may arrive 10-15 minutes late, or is a daily figure.</li>
            <li>🌙 moon and dimmed row: that market is <strong>closed</strong> (no new data for over 30 minutes). The app is not frozen.</li>
            <li>A <span className="text-up">green</span> or <span className="text-down">red</span> flash on a price: it just ticked up or down.</li>
            <li>The time next to each panel is its last update.</li>
          </ul>

          <H id="mercados">4. Markets</H>
          <p>
            A board with <strong>My list</strong> and groups for indices, futures, commodities, currencies, crypto and bonds. Each row shows the last price,
            the day&apos;s change and a mini chart of the session. Click a row to open its page; the ✕ removes a symbol from your list. The
            <strong> Biggest movers</strong> panel sorts the board by % change. It refreshes every 10 seconds (crypto every 5; with MetaTrader or NinjaTrader
            connected, every second).
          </p>
          <p>In the public version, indices and commodities are shown through <strong>ETFs</strong> that track them (SPY = S&amp;P 500, GLD = gold…), plus a TradingView panel with indices, commodities and bonds.</p>

          <H id="simbolo">5. Symbol and chart</H>
          <ul>
            <li><strong>Header</strong>: price (refreshes every few seconds), change, source, and buttons to Risk and Calculate. The ★ adds it to your list.</li>
            <li><strong>Timeframe</strong>: 1m, 5m, 15m, 30m, 1H, 4H, D (daily), W (weekly), M (monthly).</li>
            <li><strong>ATALAYA / TradingView</strong>: switches between our chart (with your drawings and indicators) and the official TradingView chart. If a market has no data of our own, TradingView opens automatically.</li>
            <li><strong>Indicators</strong> (the “Indicators” button): volume, MA 20/50/200, EMA 21, Bollinger, automatic trend channel (50-bar regression ±2σ, projected 10 bars), RSI 14 and MACD in panes below.</li>
            <li><strong>Drawing tools</strong> (left toolbar): cursor, trend line (2 clicks), ray (2 clicks, extends to the right), horizontal line (1 click, support/resistance), Fibonacci (click the low and the high) and ruler (measures distance, % and number of bars). Undo: <K>Ctrl+Z</K>. Delete all: eraser. Cancel: <K>Esc</K>. Drawings are saved per symbol.</li>
            <li><strong>Zoom and scroll</strong>: mouse wheel and drag, with the Cursor tool. Your zoom is kept when new data arrives.</li>
            <li><strong>Session</strong>: open, previous close, high, low, volume, 52-week range and where the price sits within it.</li>
            <li><strong>Paper order</strong>: buy or sell with fictitious money at the last price.</li>
            <li><strong>Financial statements · SEC</strong> (US stocks): revenue, earnings, EPS, cash, assets, liabilities and equity for the last 4 years, plus recent filings (10-K, 10-Q, 8-K…) linked to the original document.</li>
          </ul>

          <H id="fondeo">6. Fondeo Agent v5 indicator</H>
          <p>
            This is ATALAYA&apos;s version of the <strong>MNQ Fondeo Agent</strong> indicator (a TradingView Pine Script), built for trading Nasdaq futures
            under the rules of a funded account. It uses the same rules as the original. <strong>It is visual only</strong>: it simulates entries and exits on
            the chart, sends no orders and connects to no account.
          </p>
          <p><strong>How to turn it on:</strong></p>
          <ol>
            <li>Open the symbol (for example <K>MNQ</K> or <K>NQ</K>) and pick an intraday timeframe: <strong>1m, 5m or 15m</strong>.</li>
            <li>Press <strong>Indicators</strong> and tick <strong>Fondeo Agent v5</strong>.</li>
            <li>A <strong>Fondeo settings</strong> button appears so you can enter your account and risk.</li>
          </ol>
          <p><strong>What it draws:</strong></p>
          <ul>
            <li><span style={{ color: "#fde047" }}>Yellow line</span>: session VWAP.</li>
            <li><span className="up">ON H</span> / <span className="down">ON L</span>: overnight session high and low (18:00 to 09:30 New York), fixed for the day.</li>
            <li>Faint dashed lines: previous day&apos;s high and low.</li>
            <li>Soft blue band: entry window, 09:30 to 11:45 New York.</li>
            <li>Arrows: <span className="up">LONG</span> or <span className="down">SHORT</span> (shown as LARGO / CORTO), with trade number, size and risk.</li>
            <li>With an open trade: grey entry line, <span className="down">red stop</span> and <span style={{ color: "#a3e635" }}>green target</span>.</li>
            <li>Circles: exit (Target, Stop, Breakeven or End of session, with the result in dollars), “Stop to breakeven”, “Setup almost confirmed” and “No entry” (when the signal does not fit your risk or the account margin).</li>
          </ul>
          <p><strong>Entry rules</strong> (same as the Pine script):</p>
          <ul>
            <li><strong>Long</strong>: the close is above VWAP and above the overnight high, and the candle is bullish, closes above the previous candle&apos;s high and has volume above the 20-bar average.</li>
            <li><strong>Short</strong>: the reverse (below VWAP and below the overnight low, bearish candle breaking the previous low with volume).</li>
            <li>Only from 09:30 to 11:45 New York, outside the news window (±20 minutes), with fewer than 3 trades that day, before the maximum daily loss and with no other open trade.</li>
            <li>Closed candles only: the candle still forming never opens or closes a trade.</li>
          </ul>
          <p><strong>Simulated management:</strong> stop = the larger of ATR(14) × 1.4 and 8 points · target = 1.5R · the stop moves to breakeven at 1R · forced exit at 16:00 · if the stop and target are both hit in the same candle, the stop counts (the conservative choice).</p>
          <p><strong>Control panel</strong> (top right of the chart): account limit, margin to the limit, trades today, size and risk, simulated P&amp;L for the day, entry window, news block, whether it may trade, current trade and current stop.</p>
          <p><strong>Settings:</strong> account size (25K or 50K), trailing drawdown, current and peak balance, minimum cushion, risk per trade, maximum contracts and trades per day, maximum daily loss, ATR, minimum stop, target, breakeven, point value and news times (New York time). They are saved in your browser; “Restore original values” goes back to the Pine defaults.</p>
          <p><strong>Size:</strong> for futures, whole contracts by point value (MNQ $2, NQ $20, MES $5, ES $50…). For stocks, ETFs and crypto, fractional units.</p>
          <p><strong>Data:</strong> with MNQ/NQ it needs candles: in the personal installation they come from Yahoo (delayed), with the live price from NinjaTrader if connected. In the public version futures have no free candles: use it with crypto or ETFs (with your Twelve Data or Polygon key).</p>
          <Note tone="warn">Educational simulation: it does not guarantee results and is not a recommendation. It sends no orders, so it is not automated trading; still, check your funded-account firm&apos;s rules.</Note>

          <H id="tendencia">7. Trend</H>
          <p>
            Reads the symbol&apos;s trend on three timeframes: <strong>Intraday</strong> (hours), <strong>Daily</strong> (days to weeks) and
            <strong> Weekly</strong> (months). On each one, 8 classic signals vote: price vs the 20 and 50 averages, the 20/50 and 50/200 crosses, MACD, RSI,
            regression slope and position within the recent range. The result runs from <span className="text-down">−100 (bearish)</span> to
            <span className="text-up"> +100 (bullish)</span>; between −35 and +35 is sideways.
          </p>
          <ul>
            <li><strong>Weighted consensus</strong>: combines the three timeframes (weekly weighs most).</li>
            <li><strong>Hurst</strong> (TradingCalc): above 0.55 = moves tend to continue; below 0.45 = they tend to correct; near 0.5 = random.</li>
            <li>Each card shows the chart with averages, support (S), resistance (R) and the channel projected “if nothing changes”, and the list of signals with their vote (+, −, ·).</li>
            <li><strong>Market trend</strong>: a table with about 20 markets and their daily and weekly score. Click one to analyze it.</li>
          </ul>
          <Note tone="warn">It describes past prices. It does not predict the future and may change with the next bar.</Note>

          <H id="riesgo">8. Risk</H>
          <p>Using a year of the symbol&apos;s real daily returns, TradingCalc computes: annualized return and volatility, Sharpe (corrected), Sortino, max drawdown, Calmar, % up days, best and worst day, skewness, kurtosis and PSR.</p>
          <p>Under <strong>Value at risk</strong>, enter your position size: you&apos;ll see how much you could lose on a bad day (VaR 95% and 99%) and the average loss on those days (CVaR). The histogram shows how daily returns are distributed.</p>

          <H id="ia">9. AI Analyst</H>
          <p>
            Ask questions in English or Spanish (“Which NQ levels are worth watching?”). Before answering, the analyst receives the data on screen: board prices,
            trend per timeframe, Hurst and the symbol&apos;s headlines. Untick “data for …” to ask in general. Enter sends; Shift+Enter adds a line; the
            square stops the answer. It answers in the language you selected.
          </p>
          <p>It needs an NVIDIA key (free): see section 13. AI can be wrong; verify any data.</p>

          <H id="calc">10. Calculators</H>
          <ul>
            <li><strong>Risk / reward</strong>: units to buy risking a % of your account, and the result at the stop and at the target.</li>
            <li><strong>Position size</strong>: units so you lose no more than a dollar amount.</li>
            <li><strong>Options · Black-Scholes</strong>: theoretical call and put price and their Greeks.</li>
            <li><strong>Forex · pip value</strong>: standard lot 100,000, mini 10,000, micro 1,000.</li>
          </ul>
          <p>Initial values come from the active symbol. Calculations are done by TradingCalc, without fees.</p>

          <H id="cartera">11. Paper portfolio</H>
          <p>
            You start with a fictitious $100,000. Buy and sell from the symbol page or with <K>BUY 10 AAPL</K>. You&apos;ll see equity, total and unrealized
            P&amp;L, cash, positions with their weight and the order history. “Close” sells the whole position; “Reset portfolio” goes back to $100,000.
            Long only (no short selling), no fees or slippage.
          </p>

          <H id="noticias">12. News</H>
          <p>Headlines from MarketWatch and CNBC, filterable by source and linked to the original article. Each symbol page has news specific to that company.</p>

          <H id="apis">13. Connect APIs (Finnhub, Twelve Data, Polygon, NVIDIA)</H>
          <p>Without any key you already get live crypto, daily ECB exchange rates, SEC financial statements and all calculators. With your own keys (all have a free plan):</p>
          <ul>
            <li><strong>Finnhub</strong> (start with this one): <strong>real-time</strong> prices for US stocks and ETFs, search and company news.</li>
            <li><strong>Twelve Data</strong>: 1-minute to monthly charts and intraday currencies.</li>
            <li><strong>Polygon</strong>: history for charts (the free plan has previous-day data).</li>
            <li><strong>NVIDIA</strong>: the AI Analyst.</li>
          </ul>
          <ol>
            <li>Open the <strong>0 · Connections</strong> tab (or <K>Alt+0</K>, or the “Connect” button on the board).</li>
            <li>On the provider, press <strong>Create account and get key</strong> and sign up for free.</li>
            <li>Copy your <strong>API key</strong> from the provider&apos;s dashboard.</li>
            <li>Paste it in ATALAYA and press <strong>Save and test</strong>. A green ✓ means it is connected.</li>
            <li>To remove it, clear the field and press <strong>Remove</strong>.</li>
          </ol>
          <Note>Your keys are stored only in your browser. They travel with each request to the ATALAYA server, which requests the data from the provider on your behalf and does not store them. CME futures (NQ, ES, MNQ) are not in the free plans.</Note>

          <H id="mt5">14. Connect MetaTrader 5</H>
          <p>
            Brings <strong>live</strong> prices for currencies, gold, silver and indices (US100/USTEC, US500, US30, DE40, JPN225…) from your MetaTrader 5 into
            ATALAYA. It works in the <strong>public site</strong> and in the personal installation: your browser reads your own MetaTrader inside your
            computer, and the data <strong>does not go through the ATALAYA server</strong>. It is <strong>read-only</strong>: it sends no
            orders, does not read your balance or positions and does not use Expert Advisors (EAs).
          </p>
          <p><strong>What you need:</strong> Windows, MetaTrader 5, Python 3 (free at python.org; when installing, tick “Add Python to PATH”) and Chrome, Edge or Firefox. Safari does not allow this connection.</p>
          <ol>
            <li>Download MetaTrader 5 from <a href="https://www.metatrader5.com/en/download" target="_blank" rel="noreferrer" className="text-info underline">metatrader5.com</a> and install it.</li>
            <li>Open it and create a <strong>demo account</strong> (File → Open an account → MetaQuotes-Demo, or your broker&apos;s demo). It is free with no deposit. Your real account also works, since the bridge only reads prices.</li>
            <li>Keep MetaTrader 5 <strong>open and logged in</strong>.</li>
            <li>Download <a href="/metatrader/AtalayaMT5Bridge.zip" download className="text-info underline">AtalayaMT5Bridge.zip</a> (also from Connections), unzip it anywhere and double-click <strong>INICIAR-METATRADER5.bat</strong>. The first time it installs MetaQuotes&apos; official package (takes a minute). In the personal installation the same file is in the ATALAYA folder.</li>
            <li>The black window should say <em>“MetaTrader 5 conectado (…). Instrumentos: N”</em>. <strong>Keep it open</strong> while you use ATALAYA (you can minimize it).</li>
            <li>Open ATALAYA on the same computer. If the browser asks for <strong>“local network access”</strong>, allow it. The <strong>MetaTrader 5 · your PC</strong> card in Connections will say “connected”, currencies switch to <span className="text-up">METATRADER 5</span> and a panel with your broker&apos;s instruments appears in Markets, with live price and chart.</li>
          </ol>
          <p><strong>If something fails:</strong></p>
          <ul>
            <li><em>“No pude conectar con MetaTrader 5”</em> (could not connect): open MetaTrader 5 and log in, then run the .bat again.</li>
            <li><em>“python is not recognized”</em>: install Python from python.org ticking “Add Python to PATH” and restart the PC.</li>
            <li><strong>An instrument is missing</strong> (for example oil): your broker doesn&apos;t offer it under a known name. Some demos have no oil CFD.</li>
            <li><strong>Prices not moving</strong>: outside trading hours (weekends, or around the daily break for several indices) the broker doesn&apos;t quote.</li>
            <li>If you close MetaTrader or the black window, ATALAYA falls back to delayed data on its own.</li>
            <li><strong>Still “not connected”</strong>: check that the black window says “Publicando en http://127.0.0.1:8778”, that you allowed local network access and that you are not using Safari. Reload the page.</li>
            <li>In the public site, <strong>Trend</strong> and <strong>Risk</strong> are not available for MetaTrader instruments (they are computed on the server, which cannot see your PC). Price, chart and the Fondeo Agent indicator do work.</li>
          </ul>
          <Note tone="warn">These are your broker&apos;s prices (CFDs): they track the market but are not identical to CME futures (for example, US100 vs NQ can differ by a few points). Use them as a reference for personal use; they may not be published.</Note>

          <H id="ninja">15. Connect NinjaTrader</H>
          <p>
            Brings your futures (MNQ, NQ, ES…) live from NinjaTrader 8. It works in the <strong>public site</strong> and in the personal installation: your
            browser reads your own NinjaTrader inside your computer and the data does not go through the ATALAYA server. Read-only. You need Windows,
            NinjaTrader 8 and Chrome, Edge or Firefox (Safari does not allow this connection).
          </p>
          <Note tone="warn">If you trade a funded account (Apex or another), <strong>check with their support first</strong> that you may use a custom read-only indicator. ATALAYA sends no orders, but the rules belong to each firm.</Note>
          <ol>
            <li>Download <a href="/ninjatrader/AtalayaBridge-NinjaTrader.zip" download className="text-info underline">AtalayaBridge-NinjaTrader.zip</a> (don&apos;t unzip it).</li>
            <li>In NinjaTrader: <strong>Tools → Import → NinjaScript Add-On…</strong>, choose the .zip and accept. If asked to replace a file, say Yes.</li>
            <li>If the import fails: <strong>New → NinjaScript Editor</strong> → Indicators folder → double-click AtalayaBridge → <K>F5</K> to compile.</li>
            <li>On a chart of each instrument: right-click → <strong>Indicators…</strong> → add <strong>AtalayaBridge</strong> → OK.</li>
            <li>Keep NinjaTrader open and open ATALAYA on the same computer. If the browser asks for <strong>“local network access”</strong>, allow it.</li>
            <li>In Connections, “NinjaTrader · your PC” will say “connected”; in Markets the <strong>NinjaTrader · your PC</strong> panel lists your instruments, and futures show <span className="text-up">NINJATRADER</span>.</li>
          </ol>
          <p>
            What you&apos;ll see: each instrument&apos;s live price in Markets, in your list and in its page header, and the chart&apos;s last candle moving with it.
            NinjaTrader shares prices, not candles: in the public site a future&apos;s chart is shown with TradingView (as the cash Nasdaq 100), and in the
            personal installation with Yahoo&apos;s candles.
          </p>
          <p>Check: in NinjaTrader open <strong>New → NinjaScript Output</strong>; it should say “AtalayaBridge: publicando precios en http://127.0.0.1:8777/quotes”.</p>

          <H id="privacidad">16. Privacy and risk</H>
          <ul>
            <li>ATALAYA asks for no registration or personal data, and uses no advertising or tracking cookies.</li>
            <li>MetaTrader and NinjaTrader only communicate inside your own computer; nobody on the internet can read them.</li>
            <li>Data belongs to its owners and is shown for information only.</li>
            <li><strong>Nothing on ATALAYA is investment advice. Investing is high risk: each person bears the risk of their own money.</strong></li>
          </ul>
          <p>
            More detail: <Link href="/terminos#en" className="text-info underline">Terms &amp; risk</Link> · <Link href="/privacidad#en" className="text-info underline">Privacy</Link> ·{" "}
            <Link href="/cookies#en" className="text-info underline">Cookies</Link> · <Link href="/fuentes#en" className="text-info underline">Data sources</Link> ·{" "}
            <Link href="/reclamos#en" className="text-info underline">Claims</Link>.
          </p>

          <H id="faq">17. Frequently asked questions</H>
          <p><strong>Why isn&apos;t a price moving?</strong> Most often the market is closed (you&apos;ll see the moon 🌙), or the data is delayed or daily. For real time, connect Finnhub, MetaTrader 5 or NinjaTrader.</p>
          <p><strong>Can I connect Bloomberg?</strong> No. Its API only works with a Bloomberg Terminal subscription on the same computer; there is no key for websites.</p>
          <p><strong>What about TradingView or investing.com?</strong> TradingView is shown with its official charts (TradingView button on the symbol page). Extracting data from TradingView or investing.com breaks their terms, so it is not done.</p>
          <p><strong>Why don&apos;t MetaTrader futures match NinjaTrader?</strong> MetaTrader shows your broker&apos;s CFDs; NinjaTrader shows the CME future. They track the same market with small differences.</p>
          <p><strong>Is my portfolio lost if I close the page?</strong> No, it stays saved in your browser. It is lost if you clear the site data or switch browsers.</p>

          <p className="pt-10 text-center text-[11px] text-muted">
            <a href="https://www.instagram.com/elmigrante.digital/" target="_blank" rel="noreferrer" className="hover:text-amber">Made by @elmigrante.digital</a>
          </p>
        </article>
      </div>
    </div>
  );
}
