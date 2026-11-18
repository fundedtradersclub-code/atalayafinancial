import { ImageResponse } from "next/og";

export const alt = "ATALAYA Financial · terminal de mercados en español";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Share preview: the watchtower mark, the name and what it does.
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 64, padding: "0 90px", background: "#050505", color: "#ebe5d6", fontFamily: "monospace" }}>
        <svg width="300" height="300" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="12" fill="#0c0c0b" />
          <path d="M7 54 18 47.5l9 3.5 10-7 8 3 12-9" fill="none" stroke="#3ddc84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 25H9M45 25h10" stroke="#ffb224" strokeWidth="2.4" strokeLinecap="round" opacity=".5" />
          <path d="M21.5 19 32 8.5 42.5 19z" fill="#ffb224" />
          <rect x="23" y="20.5" width="18" height="9" rx="1" fill="#0c0c0b" stroke="#ffb224" strokeWidth="3" />
          <circle cx="32" cy="25" r="2.2" fill="#ffb224" />
          <path d="M25 30 19 54M39 30l6 24M23.2 41h17.6M25 30l15.4 11M39 30 23.6 41" stroke="#ffb224" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: 14, color: "#ffb224" }}>ATALAYA</div>
          <div style={{ fontSize: 30, letterSpacing: 18, color: "#918b7c", marginTop: 4 }}>FINANCIAL</div>
          <div style={{ fontSize: 34, marginTop: 40, lineHeight: 1.35, maxWidth: 640 }}>Terminal de mercados en español: gráficos, tendencia, riesgo e IA.</div>
          <div style={{ fontSize: 24, marginTop: 24, color: "#3ddc84" }}>Gratis · cripto en vivo · conecta tus propias APIs</div>
        </div>
      </div>
    ),
    size,
  );
}
