// Shared between server and client. Yahoo-style symbols; crypto "-USD" pairs are
// served live from Binance, everything else from Yahoo (delayed).

export type Group = { id: string; title: string; symbols: { s: string; name: string }[] };

export const GROUPS: Group[] = [
  {
    id: "idx",
    title: "Índices",
    symbols: [
      { s: "^GSPC", name: "S&P 500" },
      { s: "^NDX", name: "Nasdaq 100" },
      { s: "^DJI", name: "Dow Jones" },
      { s: "^RUT", name: "Russell 2000" },
      { s: "^VIX", name: "VIX" },
      { s: "^STOXX50E", name: "Euro Stoxx 50" },
      { s: "^GDAXI", name: "DAX" },
      { s: "^FTSE", name: "FTSE 100" },
      { s: "^N225", name: "Nikkei 225" },
      { s: "^HSI", name: "Hang Seng" },
      { s: "^BVSP", name: "Bovespa" },
      { s: "^MXX", name: "IPC México" },
    ],
  },
  {
    id: "fut",
    title: "Futuros",
    symbols: [
      { s: "ES=F", name: "E-mini S&P" },
      { s: "NQ=F", name: "E-mini Nasdaq" },
      { s: "YM=F", name: "E-mini Dow" },
      { s: "RTY=F", name: "E-mini Russell" },
      { s: "ZN=F", name: "T-Note 10A" },
      { s: "6E=F", name: "Euro FX" },
    ],
  },
  {
    id: "cmd",
    title: "Materias primas",
    symbols: [
      { s: "GC=F", name: "Oro" },
      { s: "SI=F", name: "Plata" },
      { s: "CL=F", name: "Petróleo WTI" },
      { s: "BZ=F", name: "Brent" },
      { s: "NG=F", name: "Gas natural" },
      { s: "HG=F", name: "Cobre" },
      { s: "KC=F", name: "Café" },
      { s: "CC=F", name: "Cacao" },
    ],
  },
  {
    id: "fx",
    title: "Divisas",
    symbols: [
      { s: "DX-Y.NYB", name: "Índice dólar" },
      { s: "EURUSD=X", name: "EUR/USD" },
      { s: "GBPUSD=X", name: "GBP/USD" },
      { s: "USDJPY=X", name: "USD/JPY" },
      { s: "USDMXN=X", name: "USD/MXN" },
      { s: "USDCOP=X", name: "USD/COP" },
      { s: "USDBRL=X", name: "USD/BRL" },
      { s: "USDPEN=X", name: "USD/PEN" },
    ],
  },
  {
    id: "cry",
    title: "Cripto",
    symbols: [
      { s: "BTC-USD", name: "Bitcoin" },
      { s: "ETH-USD", name: "Ethereum" },
      { s: "SOL-USD", name: "Solana" },
      { s: "XRP-USD", name: "XRP" },
      { s: "BNB-USD", name: "BNB" },
      { s: "DOGE-USD", name: "Dogecoin" },
    ],
  },
  {
    id: "bnd",
    title: "Bonos EE. UU. (rendimiento %)",
    symbols: [
      { s: "^IRX", name: "Letra 13 sem" },
      { s: "^FVX", name: "Nota 5 años" },
      { s: "^TNX", name: "Nota 10 años" },
      { s: "^TYX", name: "Bono 30 años" },
    ],
  },
];

// Public build: no Yahoo, so indices/commodities/bonds are shown through ETFs that track them
// (covered by free Finnhub / Twelve Data / Polygon plans), FX from the ECB without a key.
export const PUBLIC_GROUPS: Group[] = [
  { id: "idx", title: "Índices · vía ETF", symbols: [
    { s: "SPY", name: "S&P 500 (SPY)" }, { s: "QQQ", name: "Nasdaq 100 (QQQ)" }, { s: "DIA", name: "Dow Jones (DIA)" },
    { s: "IWM", name: "Russell 2000 (IWM)" }, { s: "VGK", name: "Europa (VGK)" }, { s: "EWJ", name: "Japón (EWJ)" },
    { s: "FXI", name: "China (FXI)" }, { s: "EWZ", name: "Brasil (EWZ)" }, { s: "EWW", name: "México (EWW)" },
  ] },
  { id: "cmd", title: "Materias primas · vía ETF", symbols: [
    { s: "GLD", name: "Oro (GLD)" }, { s: "SLV", name: "Plata (SLV)" }, { s: "USO", name: "Petróleo (USO)" },
    { s: "UNG", name: "Gas natural (UNG)" }, { s: "CPER", name: "Cobre (CPER)" }, { s: "DBA", name: "Agrícolas (DBA)" },
  ] },
  { id: "fx", title: "Divisas", symbols: [
    { s: "EURUSD=X", name: "EUR/USD" }, { s: "GBPUSD=X", name: "GBP/USD" }, { s: "USDJPY=X", name: "USD/JPY" },
    { s: "USDMXN=X", name: "USD/MXN" }, { s: "USDBRL=X", name: "USD/BRL" }, { s: "USDCHF=X", name: "USD/CHF" },
  ] },
  GROUPS.find((g) => g.id === "cry")!,
  { id: "bnd-etf", title: "Bonos EE. UU. · vía ETF", symbols: [
    { s: "SHY", name: "1-3 años (SHY)" }, { s: "IEF", name: "7-10 años (IEF)" }, { s: "TLT", name: "20+ años (TLT)" }, { s: "HYG", name: "Alto rendimiento (HYG)" },
  ] },
];

export const NAMES: Record<string, string> = Object.fromEntries(
  [...GROUPS, ...PUBLIC_GROUPS].flatMap((g) => g.symbols.map((x) => [x.s, x.name])),
);

export const TAPE = ["^GSPC", "^NDX", "^DJI", "NQ=F", "ES=F", "BTC-USD", "ETH-USD", "GC=F", "CL=F", "EURUSD=X", "USDJPY=X", "^TNX", "^VIX"];
export const PUBLIC_TAPE = ["BTC-USD", "ETH-USD", "SOL-USD", "SPY", "QQQ", "GLD", "EURUSD=X", "USDJPY=X", "XRP-USD", "TLT"];

export const groupsFor = (mode: "personal" | "public") => (mode === "public" ? PUBLIC_GROUPS : GROUPS);
export const tapeFor = (mode: "personal" | "public") => (mode === "public" ? PUBLIC_TAPE : TAPE);

// Command-bar shortcuts. Anything not here falls through to symbol search.
export const ALIASES: Record<string, string> = {
  SPX: "^GSPC", SP500: "^GSPC", NDX: "^NDX", NASDAQ: "^NDX", DOW: "^DJI", DJI: "^DJI", VIX: "^VIX",
  ES: "ES=F", NQ: "NQ=F", MNQ: "MNQ=F", MES: "MES=F", YM: "YM=F", RTY: "RTY=F",
  ORO: "GC=F", GOLD: "GC=F", PLATA: "SI=F", SILVER: "SI=F", WTI: "CL=F", OIL: "CL=F", PETROLEO: "CL=F", BRENT: "BZ=F",
  BTC: "BTC-USD", ETH: "ETH-USD", SOL: "SOL-USD", XRP: "XRP-USD", BNB: "BNB-USD", DOGE: "DOGE-USD",
  EURUSD: "EURUSD=X", GBPUSD: "GBPUSD=X", USDJPY: "USDJPY=X", USDMXN: "USDMXN=X", DXY: "DX-Y.NYB",
  US10Y: "^TNX", TNX: "^TNX", US30Y: "^TYX", US5Y: "^FVX",
};

const CRYPTO = new Set(["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "AVAX", "LINK", "LTC", "DOT", "TRX", "SHIB", "PEPE", "SUI", "TON"]);

/** BTC-USD → BTCUSDT when Binance carries it, else null. */
export function binancePair(symbol: string): string | null {
  const m = /^([A-Z0-9]+)-USD$/.exec(symbol);
  return m && CRYPTO.has(m[1]) ? `${m[1]}USDT` : null;
}

export function isYield(symbol: string) {
  return ["^IRX", "^FVX", "^TNX", "^TYX"].includes(symbol);
}

export function decimalsFor(symbol: string, price: number) {
  if (symbol.endsWith("=X")) return price > 20 ? 3 : 5;
  if (price >= 10) return 2;
  if (price >= 1) return 4;
  if (price >= 0.01) return 4;
  return 6;
}
