// "Fondeo Agent v5" — port of the user's own Pine Script indicator (mnq-fondeo-agent.pine)
// to ATALAYA's chart. Same rules: VWAP + overnight range bias, confirmation candle with volume,
// entry window, news blackout, ATR stop, R target, breakeven, end-of-session exit, account guard.
// Visual only: it never sends orders.
import type { Candle } from "./market";

export type FondeoSettings = {
  cuenta: "25K" | "50K";
  ddManual: number;
  saldoActual: number;
  saldoMaximo: number;
  colchonMin: number;
  riskDollars: number;
  maxContratos: number;
  maxTradesDay: number;
  perdidaDiaMax: number;
  atrLength: number;
  atrMultiplier: number;
  stopMinPts: number;
  objetivoR: number;
  breakevenR: number;
  puntoValor: number; // 0 = automatic from the symbol
  volLength: number;
  newsFilter: boolean;
  newsMinutes: number;
  news: string[]; // "YYYY-MM-DDTHH:MM" in New York time
};

export const FONDEO_DEFAULTS: FondeoSettings = {
  cuenta: "25K", ddManual: 0, saldoActual: 25000, saldoMaximo: 25000, colchonMin: 300,
  riskDollars: 150, maxContratos: 3, maxTradesDay: 3, perdidaDiaMax: 300,
  atrLength: 14, atrMultiplier: 1.4, stopMinPts: 8, objetivoR: 1.5, breakevenR: 1.0,
  puntoValor: 0, volLength: 20,
  newsFilter: true, newsMinutes: 20, news: ["2026-11-10T08:30", "2026-12-04T08:30", "2026-12-09T14:00"],
};

/** Dollar value of one point per contract for common futures; 1 for anything else (stocks, crypto, ETFs). */
export function autoPointValue(symbol: string): number {
  const root = symbol.replace(/=F$/, "").toUpperCase();
  return ({ MNQ: 2, NQ: 20, MES: 5, ES: 50, MYM: 0.5, YM: 5, M2K: 5, RTY: 50, MGC: 10, GC: 100, MCL: 100, CL: 1000 } as Record<string, number>)[root] ?? 1;
}

export type FondeoMarker = { time: number; above: boolean; shape: "arrowUp" | "arrowDown" | "circle"; color: string; text: string };
export type FondeoResult = {
  lines: Record<"vwap" | "onHigh" | "onLow" | "prevHigh" | "prevLow" | "entry" | "stop" | "target", (number | null)[]>;
  markers: FondeoMarker[];
  inWindow: boolean[];
  panel: {
    cuenta: string; limite: number; margen: number; margenOk: boolean; tradesHoy: number; maxTrades: number;
    contratos: number; riesgo: number; tamanoOk: boolean; pnlHoy: number; limiteDiario: boolean;
    enEntradas: boolean; enNoticia: boolean; puedeOperar: boolean; operacion: string; stop: number | null; breakeven: boolean;
    puntoValor: number; intradia: boolean; unidad: string;
  };
};

// New York wall-clock parts for a UTC timestamp (seconds).
const nyFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
function ny(t: number) {
  const p = Object.fromEntries(nyFmt.formatToParts(new Date(t * 1000)).map((x) => [x.type, x.value]));
  const h = Number(p.hour) % 24;
  return { mins: h * 60 + Number(p.minute), date: `${p.year}-${p.month}-${p.day}` };
}
/** Futures trading day: starts at 18:00 New York (an 18:30 Monday bar belongs to Tuesday). */
function tradingDay(t: number) {
  const { mins, date } = ny(t);
  if (mins < 18 * 60) return date;
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
/** "YYYY-MM-DDTHH:MM" in New York time -> UTC seconds (DST-aware). */
function nyToUtc(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 1000;
  const shown = ny(guess);
  const wanted = +m[4] * 60 + +m[5];
  let diff = wanted - shown.mins;
  if (diff > 720) diff -= 1440;
  if (diff < -720) diff += 1440;
  return guess + diff * 60;
}

export function runFondeo(c: Candle[], symbol: string, s: FondeoSettings): FondeoResult {
  const n = c.length;
  const pv = s.puntoValor > 0 ? s.puntoValor : autoPointValue(symbol);
  // Futures size in whole contracts (as in the Pine script); stocks, ETFs and crypto in fractional units.
  const futuro = s.puntoValor > 0 || autoPointValue(symbol) !== 1;
  const unidad = futuro ? "cto" : "unid.";
  const step = n > 1 ? c[n - 1].time - c[n - 2].time : 0;
  const intradia = step > 0 && step < 3600 * 4;
  const lines: FondeoResult["lines"] = { vwap: [], onHigh: [], onLow: [], prevHigh: [], prevLow: [], entry: [], stop: [], target: [] };
  const markers: FondeoMarker[] = [];
  const inWindow: boolean[] = [];

  // ATR (Wilder) and volume SMA
  const atr: number[] = [];
  let atrAcc = 0;
  c.forEach((x, i) => {
    const tr = i === 0 ? x.high - x.low : Math.max(x.high - x.low, Math.abs(x.high - c[i - 1].close), Math.abs(x.low - c[i - 1].close));
    if (i < s.atrLength) { atrAcc += tr; atr.push(atrAcc / (i + 1)); } else atr.push((atr[i - 1] * (s.atrLength - 1) + tr) / s.atrLength);
  });
  const volAvg: number[] = [];
  let vs = 0;
  c.forEach((x, i) => { vs += x.volume; if (i >= s.volLength) vs -= c[i - s.volLength].volume; volAvg.push(vs / Math.min(i + 1, s.volLength)); });

  const news = s.newsFilter ? s.news.map(nyToUtc).filter((x): x is number => x != null) : [];
  const block = s.newsMinutes * 60;

  // Account guard (same formulas as the Pine script)
  const ddLimite = s.ddManual > 0 ? s.ddManual : s.cuenta === "25K" ? 1500 : 2500;
  const umbralDD = s.saldoMaximo - ddLimite;
  const margenDD = s.saldoActual - umbralDD;

  let day = "", pvSum = 0, vSum = 0;
  let onH: number | null = null, onL: number | null = null, onHF: number | null = null, onLF: number | null = null;
  let wasNight = false;
  const dayHL = new Map<string, { h: number; l: number }>();
  let prevH: number | null = null, prevL: number | null = null;
  let tradesHoy = 0, pnlHoy = 0;
  let pos = 0, ent = 0, stopIni = 0, stopAct = 0, obj = 0, ctos = 0, be = false;
  let last = { enEntradas: false, enNoticia: false, puede: false, tamanoOk: false, margenOk: false, ctosCalc: 0, riesgoTotal: 0, setupL: false, setupC: false };

  for (let i = 0; i < n; i++) {
    const x = c[i];
    const { mins } = ny(x.time);
    const td = tradingDay(x.time);
    const enEntradas = intradia && mins >= 570 && mins < 705; // 09:30-11:45
    const enGestion = intradia && mins >= 570 && mins < 960; // 09:30-16:00
    const enNocturna = mins >= 1080 || mins < 570; // 18:00-09:30
    inWindow.push(enEntradas);

    if (td !== day) {
      if (day) { const hl = dayHL.get(day); if (hl) { prevH = hl.h; prevL = hl.l; } }
      day = td; pvSum = 0; vSum = 0; tradesHoy = 0; pnlHoy = 0;
    }
    const hl = dayHL.get(td);
    dayHL.set(td, hl ? { h: Math.max(hl.h, x.high), l: Math.min(hl.l, x.low) } : { h: x.high, l: x.low });

    // Session VWAP (hlc3), reset each trading day
    const typ = (x.high + x.low + x.close) / 3;
    pvSum += typ * (x.volume || 1); vSum += x.volume || 1;
    const vwap = pvSum / vSum;

    // Overnight range, frozen when the night session ends
    if (enNocturna && !wasNight) { onH = x.high; onL = x.low; }
    else if (enNocturna) { onH = Math.max(onH ?? x.high, x.high); onL = Math.min(onL ?? x.low, x.low); }
    if (!enNocturna && wasNight) { onHF = onH; onLF = onL; }
    wasNight = enNocturna;

    // Like barstate.isconfirmed: the bar still forming never opens or closes a trade.
    const confirmed = i < n - 1;
    const enNoticia = news.some((t) => Math.abs(x.time - t) <= block);
    const stopDist = Math.max(atr[i] * s.atrMultiplier, s.stopMinPts);
    const riesgoPorCto = stopDist * pv;
    const ctosCalc = futuro
      ? Math.min(s.maxContratos, Math.floor(s.riskDollars / riesgoPorCto))
      : Math.floor((s.riskDollars / riesgoPorCto) * 10000) / 10000;
    const riesgoTotal = ctosCalc * riesgoPorCto;
    const tamanoOk = futuro ? ctosCalc >= 1 : ctosCalc > 0;
    const margenOk = margenDD - riesgoTotal >= s.colchonMin;

    // Manage the open simulated trade (stop wins if both are touched in the same bar)
    if (pos !== 0 && confirmed) {
      let closed = false, motivo = "", salida = x.close;
      if (pos === 1) {
        if (x.low <= stopAct) { closed = true; salida = stopAct; motivo = be ? "Breakeven" : "Stop"; }
        else if (x.high >= obj) { closed = true; salida = obj; motivo = "Objetivo"; }
      } else {
        if (x.high >= stopAct) { closed = true; salida = stopAct; motivo = be ? "Breakeven" : "Stop"; }
        else if (x.low <= obj) { closed = true; salida = obj; motivo = "Objetivo"; }
      }
      if (!closed && !enGestion) { closed = true; salida = x.close; motivo = "Fin de horario"; }
      if (closed) {
        const res = (salida - ent) * pos * ctos * pv;
        pnlHoy += res;
        markers.push({ time: x.time, above: pos === 1, shape: "circle", color: res > 0 ? "#3ddc84" : res < 0 ? "#ff5c4d" : "#918b7c", text: `${motivo} ${res >= 0 ? "+" : "-"}$${Math.abs(res).toFixed(0)}` });
        pos = 0; be = false;
      } else if (s.breakevenR > 0 && !be) {
        const r = Math.abs(ent - stopIni);
        if ((pos === 1 && x.high >= ent + r * s.breakevenR) || (pos === -1 && x.low <= ent - r * s.breakevenR)) {
          stopAct = ent; be = true;
          markers.push({ time: x.time, above: pos === 1, shape: "circle", color: "#6cb8ff", text: "Stop a breakeven" });
        }
      }
    }

    const prev = c[i - 1];
    const sesgoL = x.close > vwap && onHF != null && x.close > onHF;
    const sesgoC = x.close < vwap && onLF != null && x.close < onLF;
    const confL = !!prev && x.close > x.open && x.close > prev.high && x.volume > volAvg[i];
    const confC = !!prev && x.close < x.open && x.close < prev.low && x.volume > volAvg[i];
    const limiteDiario = s.perdidaDiaMax > 0 && pnlHoy <= -s.perdidaDiaMax;
    const puede = confirmed && enEntradas && !enNoticia && tradesHoy < s.maxTradesDay && !limiteDiario && pos === 0;
    const senalL = puede && sesgoL && confL && tamanoOk && margenOk;
    const senalC = puede && sesgoC && confC && tamanoOk && margenOk;
    const bloqueada = puede && ((sesgoL && confL) || (sesgoC && confC)) && !(tamanoOk && margenOk);
    const setupL = puede && sesgoL && !!prev && x.close > x.open && x.close > prev.high * 0.999 && x.volume > volAvg[i] * 0.9 && !confL;
    const setupC = puede && sesgoC && !!prev && x.close < x.open && x.close < prev.low * 1.001 && x.volume > volAvg[i] * 0.9 && !confC;

    if (senalL || senalC) {
      pos = senalL ? 1 : -1; ent = x.close; stopIni = x.close - pos * stopDist; stopAct = stopIni;
      obj = x.close + pos * stopDist * s.objetivoR; ctos = ctosCalc; be = false; tradesHoy++;
      markers.push({ time: x.time, above: pos === -1, shape: pos === 1 ? "arrowUp" : "arrowDown", color: pos === 1 ? "#3ddc84" : "#ff5c4d", text: `${pos === 1 ? "LARGO" : "CORTO"} #${tradesHoy} · ${ctos} ${unidad} · riesgo $${(ctos * riesgoPorCto).toFixed(0)}` });
    } else if (bloqueada) {
      markers.push({ time: x.time, above: true, shape: "circle", color: "#918b7c", text: !tamanoOk ? "Sin entrada: stop muy amplio" : "Sin entrada: poco margen" });
    } else if (setupL) {
      markers.push({ time: x.time, above: false, shape: "circle", color: "#2dd4bf", text: "Setup largo casi confirmado" });
    } else if (setupC) {
      markers.push({ time: x.time, above: true, shape: "circle", color: "#fb923c", text: "Setup corto casi confirmado" });
    }

    lines.vwap.push(intradia ? vwap : null);
    lines.onHigh.push(intradia ? onHF : null);
    lines.onLow.push(intradia ? onLF : null);
    lines.prevHigh.push(intradia ? prevH : null);
    lines.prevLow.push(intradia ? prevL : null);
    lines.entry.push(pos !== 0 ? ent : null);
    lines.stop.push(pos !== 0 ? stopAct : null);
    lines.target.push(pos !== 0 ? obj : null);
    // The panel shows the live state, including the bar still forming.
    const puedeAhora = enEntradas && !enNoticia && tradesHoy < s.maxTradesDay && !limiteDiario && pos === 0;
    last = { enEntradas, enNoticia, puede: puedeAhora, tamanoOk, margenOk, ctosCalc, riesgoTotal, setupL, setupC };
  }

  return {
    lines, markers, inWindow,
    panel: {
      cuenta: s.cuenta, limite: umbralDD, margen: margenDD, margenOk: last.margenOk, tradesHoy, maxTrades: s.maxTradesDay,
      contratos: last.ctosCalc, riesgo: last.riesgoTotal, tamanoOk: last.tamanoOk, pnlHoy,
      limiteDiario: s.perdidaDiaMax > 0 && pnlHoy <= -s.perdidaDiaMax,
      enEntradas: last.enEntradas, enNoticia: last.enNoticia, puedeOperar: last.puede && last.tamanoOk && last.margenOk,
      operacion: pos === 1 ? "LARGO" : pos === -1 ? "CORTO" : last.setupL ? "Setup L" : last.setupC ? "Setup C" : "—",
      stop: pos !== 0 ? stopAct : null, breakeven: be, puntoValor: pv, intradia, unidad,
    },
  };
}
