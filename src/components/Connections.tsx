"use client";

import { useState } from "react";
import { Check, ExternalLink, Eye, EyeOff, X } from "lucide-react";
import { useEffect } from "react";
import { PROVIDERS, type ProviderId, apiFetch, getKeys, setKey } from "./keys";
import { NINJA_URL, ninja } from "./ninja";
import { useMt5 } from "./mt5client";
import { lang } from "./i18n";
import { Panel, inputCls } from "./ui";

type Status = { ok: boolean; message: string } | null;

export default function Connections({ mode }: { mode: "personal" | "public" }) {
  const [saved, setSaved] = useState(getKeys);
  return (
    <div className="grid gap-1.5 sm:gap-2 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-1.5 sm:gap-2">
        <Mt5Card />
        <NinjaCard />
        {PROVIDERS.map((p) => (
          <ProviderCard key={p.id} p={p} value={saved[p.id] ?? ""} onSaved={() => setSaved(getKeys())} />
        ))}
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <a href={(lang() === "en" ? "/manual/en" : "/manual") + "#apis"} target="_blank" className="btn block border border-amber px-3 py-2 text-center font-cond text-[12px] uppercase tracking-wider text-amber hover:bg-amber hover:text-black">
          Ver el manual de conexión paso a paso
        </a>
        <Panel title="Cómo funciona" className="shrink-0">
          <ul className="space-y-2 p-3 text-[12px] leading-relaxed text-muted">
            <li><span className="text-text">Sin ninguna key</span> ves cripto en vivo (Binance), divisas diarias del Banco Central Europeo, estados financieros de la SEC y todas las calculadoras.</li>
            <li><span className="text-text">Con tus keys</span> ves acciones, ETF, divisas intradía, gráficos completos y el Analista IA. Los datos llegan con tu propia licencia, para tu uso personal.</li>
            <li><span className="text-text">Dónde se guardan:</span> solo en este navegador. Viajan con cada consulta al servidor de ATALAYA, que las reenvía al proveedor y no las guarda ni las registra.</li>
            <li><span className="text-text">Futuros (NQ, ES, MNQ)</span> no están en los planes gratis de estos proveedores.</li>
            <li>Bloomberg no ofrece una API que se pueda conectar a una web: solo funciona con una suscripción a Bloomberg Terminal en la misma computadora.</li>
          </ul>
        </Panel>
        <Panel title="Modo de esta instalación" className="shrink-0">
          <p className="p-3 text-[12px] leading-relaxed text-muted">
            {mode === "personal" ? (
              <>Modo <span className="text-amber">personal</span>: además de tus keys usa Yahoo Finance (con retraso) para índices, futuros y materias primas. Es solo para uso propio, no para publicar.</>
            ) : (
              <>Modo <span className="text-amber">público</span>: solo fuentes que se pueden mostrar libremente y las keys de cada persona.</>
            )}
          </p>
        </Panel>
      </div>
    </div>
  );
}

function ProviderCard({ p, value, onSaved }: { p: (typeof PROVIDERS)[number]; value: string; onSaved: () => void }) {
  const [v, setV] = useState(value);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const connected = !!value;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setKey(p.id as ProviderId, v);
    onSaved();
    if (!v.trim()) { setStatus(null); return; }
    setBusy(true);
    try {
      const r = await apiFetch("/api/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: p.id }) });
      setStatus(await r.json());
    } catch {
      setStatus({ ok: false, message: "No se pudo probar la conexión" });
    } finally { setBusy(false); }
  };

  return (
    <Panel
      title={p.name}
      right={connected ? <span className="flex items-center gap-1 text-up"><Check size={12} aria-hidden="true" />conectada</span> : <span>sin conectar</span>}
    >
      <form onSubmit={save} className="grid gap-2 p-3">
        <p className="text-[12px]">{p.gives}</p>
        <p className="text-[11px] text-muted">
          {p.free}{" "}
          <a href={p.signup} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-info hover:underline">
            Crear cuenta y obtener key <ExternalLink size={11} aria-hidden="true" />
          </a>
        </p>
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">API key de {p.name}</span>
            <input
              type={show ? "text" : "password"}
              value={v}
              onChange={(e) => setV(e.target.value)}
              placeholder={`Pega tu key de ${p.name}`}
              autoComplete="off"
              spellCheck={false}
              className={`${inputCls} pr-10`}
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar key" : "Mostrar key"} className="btn absolute right-0 top-0 grid size-9 place-items-center text-muted hover:text-text">
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </label>
          <button type="submit" disabled={busy} className="btn h-9 border border-amber px-3 font-cond text-[12px] uppercase tracking-wider text-amber hover:bg-amber hover:text-black disabled:opacity-50">
            {busy ? "Probando…" : v.trim() ? "Guardar y probar" : "Quitar"}
          </button>
        </div>
        {status && (
          <p className={`flex items-center gap-1.5 text-[12px] ${status.ok ? "text-up" : "text-down"}`} aria-live="polite">
            {status.ok ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
            {status.message}
          </p>
        )}
      </form>
    </Panel>
  );
}

function NinjaCard() {
  const [snap, setSnap] = useState(ninja);
  useEffect(() => {
    const on = () => setSnap(ninja());
    window.addEventListener("atalaya-ninja", on);
    return () => window.removeEventListener("atalaya-ninja", on);
  }, []);
  const syms = snap ? Object.entries(snap.quotes) : [];
  return (
    <Panel
      title="NinjaTrader · tu PC"
      right={snap ? <span className="flex items-center gap-1 text-up"><Check size={12} aria-hidden="true" />conectado · {syms.length} instrumento{syms.length === 1 ? "" : "s"}</span> : <span>sin conexión</span>}
    >
      <div className="grid gap-2 p-3 text-[12px]">
        <p>Precios en vivo de tus futuros (MNQ, NQ, ES…) tomados de tu NinjaTrader 8. Solo lectura: no envía órdenes ni toca tu cuenta. Los datos van de tu PC a tu navegador; no pasan por el servidor de ATALAYA.</p>
        {syms.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            {syms.map(([k, q]) => <li key={k}><span className="text-amber">{q.name || k}</span> {q.last}</li>)}
          </ul>
        )}
        <ol className="ml-4 list-decimal space-y-1 text-[11.5px] text-muted">
          <li>Descarga <a href="/ninjatrader/AtalayaBridge-NinjaTrader.zip" download className="text-info hover:underline">AtalayaBridge-NinjaTrader.zip</a> (no lo descomprimas).</li>
          <li>En NinjaTrader: <span className="text-text">Herramientas → Importar → Complemento NinjaScript…</span>, elige el .zip y acepta. Solo una vez.</li>
          <li>Cierra y vuelve a abrir NinjaTrader. El complemento arranca solo con MNQ, NQ, MES, ES, oro, petróleo y más: no hace falta ningún gráfico.</li>
          <li>Esta tarjeta pasa a <span className="text-up">conectado</span> y los futuros dicen <span className="text-up">NINJATRADER</span>.</li>
        </ol>
        <p className="text-[11px] text-muted">ATALAYA lee {NINJA_URL} desde tu navegador (Chrome, Edge o Firefox; si pide permiso de “acceso a la red local”, acéptalo). Si cierras NinjaTrader, vuelve sola a los otros datos. Si usas una cuenta de fondeo, confirma antes con tu firma que puedes usar un indicador de solo lectura.</p>
      </div>
    </Panel>
  );
}

function Mt5Card() {
  const snap = useMt5();
  const syms = snap ? Object.entries(snap.quotes) : [];
  return (
    <Panel
      title="MetaTrader 5 · tu PC"
      right={snap ? <span className="flex items-center gap-1 text-up"><Check size={12} aria-hidden="true" />conectado · {snap.server}</span> : <span>sin conexión</span>}
    >
      <div className="grid gap-2 p-3 text-[12px]">
        <p>Precios en vivo de divisas, oro, plata, petróleo e índices (US100, US500, GER40…) desde tu MetaTrader 5. Solo lectura: no envía órdenes ni lee tu saldo. Usa la librería oficial de MetaQuotes, no un Asesor Experto. Los datos van de tu PC a tu navegador; no pasan por el servidor de ATALAYA.</p>
        {syms.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {syms.map(([s, q]) => <li key={s}><span className="text-amber">{q.name}</span> <span className="text-muted">{q.broker}</span></li>)}
          </ul>
        )}
        <ol className="ml-4 list-decimal space-y-1 text-[11.5px] text-muted">
          <li>Instala MetaTrader 5 desde <a href="https://www.metatrader5.com/es/download" target="_blank" rel="noreferrer" className="text-info hover:underline">metatrader5.com</a> y abre una cuenta <span className="text-text">demo</span> (gratis, sin depósito), o usa la tuya.</li>
          <li>Descarga <a href="/metatrader/AtalayaMT5Bridge.zip" download className="text-info hover:underline">AtalayaMT5Bridge.zip</a> (23 MB, no necesita Python), descomprímelo y, con MetaTrader 5 abierto, haz doble clic en <span className="text-text">AtalayaMT5Bridge.exe</span>.</li>
          <li>Si Windows dice “Windows protegió su PC” (el programa no tiene firma digital): <span className="text-text">Más información → Ejecutar de todas formas</span>.</li>
          <li>Deja esa ventana abierta. Esta tarjeta pasa a <span className="text-up">conectado</span>, las divisas dicen <span className="text-up">METATRADER 5</span> y aparece un panel con tus instrumentos en Mercados.</li>
        </ol>
        <p className="text-[11px] text-muted">Funciona en Chrome, Edge y Firefox (si el navegador pide permiso de “acceso a la red local”, acéptalo). Son precios de tu bróker (CFD), no idénticos a los futuros de CME, y solo para tu uso personal. ¿Prefieres no usar un .exe? Descarga la <a href="/metatrader/AtalayaMT5Bridge-python.zip" download className="text-info hover:underline">versión con Python</a> (código abierto, requiere Python 3).</p>
      </div>
    </Panel>
  );
}
