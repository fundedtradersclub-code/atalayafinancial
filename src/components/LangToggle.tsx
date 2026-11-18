"use client";

import { LANGS, getLang, setLang } from "./i18n";

/** ES / EN switch. Labels stay as-is (data-no-translate) so each language names itself. */
export default function LangToggle() {
  const cur = getLang();
  return (
    <div role="group" aria-label="Idioma / Language" data-no-translate className="flex border border-line-strong">
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => l.id !== cur && setLang(l.id)}
          aria-pressed={l.id === cur}
          title={l.name}
          lang={l.id}
          className={`btn h-6 px-1.5 font-cond text-[11px] tracking-wider ${l.id === cur ? "bg-amber text-black" : "text-muted hover:text-text"}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
