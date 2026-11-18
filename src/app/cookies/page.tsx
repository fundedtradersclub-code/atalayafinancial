import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/cookies" }, title: "Política de cookies · ATALAYA" };

export default function Page() {
  return (
    <LegalPage title="Política de cookies">
      <p className="text-[12px]"><a href="#en" className="text-info underline">English version ↓</a></p>

      <p>
        <strong>ATALAYA no usa cookies de publicidad, de analítica ni de rastreo</strong>, y no comparte tu navegación con redes sociales ni anunciantes.
      </p>

      <h2>Almacenamiento local</h2>
      <p>En lugar de cookies, el sitio usa el almacenamiento local del navegador (localStorage), que es técnicamente necesario para recordar:</p>
      <ul>
        <li>que aceptaste los términos, para no pedírtelo cada vez;</li>
        <li>tu lista de símbolos, la cartera simulada, tus dibujos en los gráficos y tus API keys;</li>
        <li>la última pantalla y el símbolo que tenías abiertos.</li>
      </ul>
      <p>
        Esta información se queda en tu dispositivo. Puedes borrarla desde la configuración de tu navegador (datos del sitio). Si la borras, se te
        pedirá aceptar los términos de nuevo.
      </p>

      <h2>Sitios externos</h2>
      <p>Las noticias y los reportes enlazan a sitios de terceros (medios, SEC). Al abrirlos, esos sitios aplican sus propias políticas de cookies.</p>

      <h2>Cambios</h2>
      <p>Si en el futuro se agregan cookies de analítica, se informará aquí y se pedirá tu consentimiento antes de activarlas.</p>
      <hr className="my-10 border-line" />
      <section id="en" lang="en" className="space-y-4">
        <h2>English · Cookie policy</h2>
        <p><strong>ATALAYA does not use advertising, analytics or tracking cookies</strong>, and does not share your browsing with social networks or advertisers.</p>
        <h2>Local storage</h2>
        <p>Instead of cookies, the site uses the browser&apos;s local storage, which is technically necessary to remember:</p>
        <ul>
          <li>that you accepted the terms, so you are not asked every time;</li>
          <li>your symbol list, the paper portfolio, your chart drawings, your API keys and your language;</li>
          <li>the last screen and symbol you had open.</li>
        </ul>
        <p>This information stays on your device. You can delete it in your browser settings (site data). If you delete it, you will be asked to accept the terms again.</p>
        <h2>External sites</h2>
        <p>News, filings and TradingView widgets link to or load third-party sites, which apply their own cookie policies.</p>
        <h2>Changes</h2>
        <p>If analytics cookies are added in the future, this page will say so and your consent will be requested before enabling them.</p>
      </section>
    </LegalPage>
  );
}
