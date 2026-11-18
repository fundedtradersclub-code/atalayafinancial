// ATALAYA Financial mark: a watchtower with its beacon lit, over a rising market line.

export function LogoMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M7 54 18 47.5l9 3.5 10-7 8 3 12-9" fill="none" stroke="var(--up)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 25H9M45 25h10" stroke="var(--amber)" strokeWidth="2.8" strokeLinecap="round" opacity=".5" />
      <path d="M21.5 19 32 8.5 42.5 19z" fill="var(--amber)" />
      <rect x="23" y="20.5" width="18" height="9" rx="1" fill="var(--bg)" stroke="var(--amber)" strokeWidth="3.4" />
      <circle cx="32" cy="25" r="2.4" fill="var(--amber)" />
      <path d="M25 30 19 54M39 30l6 24M23.2 41h17.6M25 30l15.4 11M39 30 23.6 41" stroke="var(--amber)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ size = 26, sub = true }: { size?: number; sub?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="font-cond text-[15px] font-semibold tracking-[0.2em] text-amber">ATALAYA</span>
        {sub && <span className="mt-0.5 font-cond text-[9px] uppercase tracking-[0.42em] text-muted">Financial</span>}
      </span>
    </span>
  );
}
