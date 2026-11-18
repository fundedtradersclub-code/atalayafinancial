"use client";

import { mergeNinja, ninja } from "./ninja";

// Visitor API keys live only in this browser (localStorage). They ride along on each
// request to ATALAYA's own server, which forwards them to the provider and keeps nothing.

export const PROVIDERS = [
  {
    id: "finnhub", name: "Finnhub", signup: "https://finnhub.io/register",
    gives: "Precios en tiempo real de acciones y ETF de EE. UU., búsqueda y noticias por empresa.",
    free: "Gratis: 60 consultas por minuto.",
  },
  {
    id: "twelvedata", name: "Twelve Data", signup: "https://twelvedata.com/register",
    gives: "Gráficos de 1 minuto a mensual para acciones, ETF y divisas; precios de divisas intradía.",
    free: "Gratis: 8 consultas por minuto, 800 por día.",
  },
  {
    id: "polygon", name: "Polygon", signup: "https://polygon.io/dashboard/signup",
    gives: "Historial y gráficos de acciones, ETF y divisas (respaldo si no tienes Twelve Data).",
    free: "Gratis: 5 consultas por minuto, datos de fin de día. Los planes pagados suman tiempo real y futuros.",
  },
  {
    id: "nvidia", name: "NVIDIA", signup: "https://build.nvidia.com/",
    gives: "El Analista IA (modelo Nemotron). Tus preguntas se envían a NVIDIA con tu key.",
    free: "Gratis con créditos de prueba para desarrolladores.",
  },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];
const KEY = "atalaya.keys";

export function getKeys(): Partial<Record<ProviderId, string>> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

export function setKey(id: ProviderId, value: string) {
  const k = getKeys();
  if (value.trim()) k[id] = value.trim(); else delete k[id];
  try { localStorage.setItem(KEY, JSON.stringify(k)); } catch { /* private mode */ }
  window.dispatchEvent(new Event("atalaya-keys"));
}

/** fetch() for our own /api routes, carrying the visitor's keys as headers. */
export async function apiFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  for (const [id, v] of Object.entries(getKeys())) if (v) headers.set(`x-key-${id}`, v);
  const res = await fetch(url, { ...init, headers });
  // Personal build: NinjaTrader prices (if the bridge is running) replace delayed futures quotes.
  if (url.startsWith("/api/quotes") && res.ok && ninja()) {
    const rows = await res.json();
    return new Response(JSON.stringify(Array.isArray(rows) ? mergeNinja(rows) : rows), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return res;
}

export const hasKey = (id: ProviderId) => !!getKeys()[id];
