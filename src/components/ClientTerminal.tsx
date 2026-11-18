"use client";

import dynamic from "next/dynamic";
import { LogoMark } from "./Logo";
import { startTranslator } from "./i18n";

// Apply the chosen interface language before the terminal paints.
if (typeof window !== "undefined") startTranslator();

// The terminal reads localStorage (watchlist, paper portfolio) on first render,
// so it renders in the browser only.
const Terminal = dynamic(() => import("./Terminal"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center"><LogoMark size={56} className="opacity-80" /></div>
  ),
});

export default function ClientTerminal() {
  return <Terminal />;
}
