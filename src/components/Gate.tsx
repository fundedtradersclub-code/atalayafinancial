"use client";

import Logo from "./Logo";
import LangToggle from "./LangToggle";
import { lang } from "./i18n";

import { useState } from "react";

// Bump when the terms change materially: everyone must accept again.
export const TERMS_VERSION = "2026-11-18";
const KEY = "atalaya.terms";

export function hasAccepted(): boolean {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null")?.v === TERMS_VERSION;
  } catch {
    return false;
  }
}

const CHECKS = [
  "Entiendo que ATALAYA es una herramienta informativa y que nada de lo que muestra (datos, gráficos, análisis técnico, cálculos ni respuestas de la IA) es una recomendación de inversión.",
  "Entiendo que invertir capital tiene alto riesgo, que puedo perder parte o todo mi dinero, y que asumo toda la responsabilidad por mis decisiones.",
  "Entiendo que los datos son de terceros (sus dueños), pueden llegar con retraso o con errores, y no se garantiza que sean exactos ni estén completos.",
  "Leí y acepto los Términos de uso, la Política de privacidad y la Política de cookies.",
];

export default function Gate({ onAccept }: { onAccept: () => void }) {
  const [ok, setOk] = useState<boolean[]>(CHECKS.map(() => false));
  const all = ok.every(Boolean);
  const accept = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ v: TERMS_VERSION, at: new Date().toISOString() })); } catch { /* still let them in this session */ }
    onAccept();
  };
  return (
    <div className="grid h-full place-items-center overflow-auto bg-bg p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="gate-title" className="view-in w-full max-w-[620px] border border-amber-dim bg-panel">
        <header className="border-b border-line bg-panel-2 px-4 py-3">
          <div className="flex items-center justify-between gap-3"><Logo size={34} /><LangToggle /></div>
          <h1 id="gate-title" className="mt-3 text-[16px]">Antes de entrar, lee y acepta estas condiciones</h1>
        </header>
        <div className="space-y-2 p-4">
          {CHECKS.map((c, i) => (
            <label key={i} className="flex cursor-pointer gap-3 border border-line p-3 transition-[border-color] duration-150 has-[:checked]:border-amber-dim">
              <input
                type="checkbox"
                checked={ok[i]}
                onChange={(e) => setOk((o) => o.map((x, k) => (k === i ? e.target.checked : x)))}
                className="mt-0.5 size-4 shrink-0 accent-[var(--amber)]"
              />
              <span className="text-[12.5px] leading-relaxed">{c}</span>
            </label>
          ))}
          <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[12px]">
            <a href={"/terminos" + (lang() === "en" ? "#en" : "")} target="_blank" className="text-info underline-offset-2 hover:underline">Términos de uso</a>
            <a href={"/privacidad" + (lang() === "en" ? "#en" : "")} target="_blank" className="text-info underline-offset-2 hover:underline">Privacidad</a>
            <a href={"/cookies" + (lang() === "en" ? "#en" : "")} target="_blank" className="text-info underline-offset-2 hover:underline">Cookies</a>
            <a href={"/fuentes" + (lang() === "en" ? "#en" : "")} target="_blank" className="text-info underline-offset-2 hover:underline">Fuentes de datos</a>
          </p>
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <span className="text-[11px] text-muted">{all ? "Listo." : `Marca las ${CHECKS.length} casillas para continuar.`}</span>
          <button onClick={accept} disabled={!all} className="btn h-10 bg-amber px-5 font-cond text-[13px] font-semibold uppercase tracking-wider text-black disabled:opacity-35">
            Acepto y entro
          </button>
        </footer>
      </div>
    </div>
  );
}
