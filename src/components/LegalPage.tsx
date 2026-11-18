import Link from "next/link";
import Logo from "./Logo";

export const UPDATED = "18 de noviembre de 2026";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
        <nav className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
          <Link href="/" aria-label="ATALAYA Financial, inicio"><Logo size={28} /></Link>
          <Link href="/terminos" className="text-muted hover:text-text">Términos y riesgo</Link>
          <Link href="/privacidad" className="text-muted hover:text-text">Privacidad</Link>
          <Link href="/cookies" className="text-muted hover:text-text">Cookies</Link>
          <Link href="/fuentes" className="text-muted hover:text-text">Fuentes de datos</Link>
          <Link href="/reclamos" className="text-muted hover:text-text">Reclamos · Claims</Link>
        </nav>
        <h1 className="font-cond text-[26px] font-semibold text-text">{title}</h1>
        <p className="mt-1 text-[12px] text-muted">Última actualización: {UPDATED}</p>
        <article className="mt-6 space-y-4 text-[13px] leading-relaxed text-text/90 [&_h2]:mt-8 [&_h2]:font-cond [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:uppercase [&_h2]:tracking-wider [&_h2]:text-amber [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-text">
          {children}
        </article>
        <footer className="mt-12 border-t border-line pt-4 text-[11px] text-muted">
          Texto base informativo. Si ATALAYA se ofrece al público, conviene que un abogado lo revise según la ley aplicable.
          <a href="https://www.instagram.com/elmigrante.digital/" target="_blank" rel="noreferrer" className="mt-2 block text-center hover:text-amber">
            Hecho por @elmigrante.digital
          </a>
        </footer>
      </div>
    </div>
  );
}
