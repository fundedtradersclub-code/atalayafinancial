import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/terminos" }, title: "Términos de uso y aviso de riesgo · ATALAYA" };

export default function Page() {
  return (
    <LegalPage title="Términos de uso y aviso de riesgo">
      <p className="text-[12px]"><a href="#en" className="text-info underline">English version ↓</a></p>

      <p>Al usar ATALAYA aceptas estas condiciones. Si no estás de acuerdo, no uses el sitio.</p>

      <h2>1. Qué es ATALAYA</h2>
      <p>
        ATALAYA es una herramienta informativa y educativa que reúne datos de mercado de terceros, cálculos y lecturas técnicas automáticas. No es un
        bróker, no ejecuta operaciones reales, no administra dinero y no presta servicios de asesoría de inversión.
      </p>

      <h2>2. No es recomendación de inversión</h2>
      <p>
        <strong>Nada de lo que muestra ATALAYA es una recomendación, oferta o invitación a comprar o vender ningún activo.</strong> Esto incluye precios,
        gráficos, indicadores, herramientas de dibujo, la pantalla de Tendencia, los puntajes alcista o bajista, los cálculos de riesgo, las
        calculadoras, la cartera simulada y las respuestas del Analista IA. Las lecturas técnicas describen precios pasados y no predicen el futuro.
      </p>

      <h2>3. Riesgo de inversión</h2>
      <ul>
        <li>Invertir capital tiene <strong>alto riesgo</strong>. Puedes perder parte o la totalidad de tu dinero y, con apalancamiento, más de lo invertido.</li>
        <li>Los resultados pasados no garantizan resultados futuros.</li>
        <li>Cada persona es la única responsable de sus decisiones de inversión y asume el riesgo de su propio dinero.</li>
        <li>Antes de invertir, considera tu situación y, si lo necesitas, consulta a un asesor financiero autorizado en tu país.</li>
      </ul>

      <h2>4. Datos de terceros</h2>
      <p>
        Los datos pertenecen a sus respectivos dueños (ver <a className="text-info underline" href="/fuentes">Fuentes de datos</a>). Se muestran solo
        con fines informativos, pueden llegar con retraso, tener errores o interrumpirse, y no se garantiza que sean exactos, completos ni oportunos.
        No los uses como única base para decidir.
      </p>

      <h2>5. Inteligencia artificial</h2>
      <p>El Analista IA genera texto de forma automática con un modelo de NVIDIA y puede equivocarse o inventar información. Verifica cualquier dato antes de usarlo.</p>

      <h2>6. Cartera simulada</h2>
      <p>
        La cartera usa dinero ficticio y precios aproximados, sin comisiones, deslizamiento ni restricciones reales del mercado. Sus resultados no
        representan lo que pasaría operando de verdad.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida que permita la ley, los responsables de ATALAYA no responden por pérdidas, daños o perjuicios, directos o indirectos,
        derivados del uso del sitio, de los datos, de interrupciones del servicio o de decisiones tomadas con base en su contenido. El sitio se ofrece
        tal cual, sin garantías.
      </p>

      <h2>8. Uso permitido</h2>
      <p>Uso personal y no comercial. No está permitido extraer datos en masa, revenderlos ni redistribuirlos, ni usar el sitio para fines ilícitos.</p>

      <h2>9. Cambios</h2>
      <p>Estas condiciones pueden cambiar. Si el cambio es importante, se te pedirá aceptarlas otra vez al entrar.</p>

      <h2>10. Reclamos</h2>
      <p>Si algo del sitio te causa un problema o crees que infringe un derecho, escríbenos primero: ver <a className="text-info underline" href="/reclamos">Reclamos y avisos</a>. Nos comprometemos a responder y a buscar una solución amistosa.</p>

      <h2>11. Ley aplicable</h2>
      <p>Se rigen por las leyes de la República del Ecuador.</p>
      <hr className="my-10 border-line" />
      <section id="en" lang="en" className="space-y-4">
        <h2>English · Terms of use & risk notice</h2>
        <p>By using ATALAYA you accept these terms. If you do not agree, do not use the site.</p>
        <h2>1. What ATALAYA is</h2>
        <p>ATALAYA is an informational and educational tool that gathers third-party market data, calculations and automated technical readings. It is not a broker, does not execute real trades, does not manage money and does not provide investment advisory services.</p>
        <h2>2. Not investment advice</h2>
        <p><strong>Nothing shown on ATALAYA is a recommendation, offer or solicitation to buy or sell any asset.</strong> This includes prices, charts, indicators, drawing tools, the Trend screen, bullish or bearish scores, risk calculations, calculators, the paper portfolio and the AI Analyst&apos;s answers. Technical readings describe past prices and do not predict the future.</p>
        <h2>3. Investment risk</h2>
        <ul>
          <li>Investing capital is <strong>high risk</strong>. You may lose part or all of your money and, with leverage, more than you invested.</li>
          <li>Past performance does not guarantee future results.</li>
          <li>Each person is solely responsible for their investment decisions and bears the risk of their own money.</li>
          <li>Before investing, consider your situation and, if needed, consult a licensed financial adviser in your country.</li>
        </ul>
        <h2>4. Third-party data</h2>
        <p>Data belongs to its respective owners (see <a className="text-info underline" href="/fuentes">Data sources</a>). It is shown for information only, may be delayed, contain errors or be interrupted, and is not guaranteed to be accurate, complete or timely. Do not use it as your only basis for decisions.</p>
        <h2>5. Artificial intelligence</h2>
        <p>The AI Analyst generates text automatically with an NVIDIA model and may be wrong or make up information. Verify any data before using it.</p>
        <h2>6. Paper portfolio</h2>
        <p>The portfolio uses fictitious money and approximate prices, without fees, slippage or real market constraints. Its results do not represent what would happen in real trading.</p>
        <h2>7. Limitation of liability</h2>
        <p>To the fullest extent permitted by law, those responsible for ATALAYA are not liable for losses, damages or harm, direct or indirect, arising from the use of the site, its data, service interruptions or decisions based on its content. The site is provided as is, without warranties.</p>
        <h2>8. Permitted use</h2>
        <p>Personal, non-commercial use. Bulk data extraction, resale or redistribution, and any unlawful use, are not permitted.</p>
        <h2>9. Changes</h2>
        <p>These terms may change. If a change is material, you will be asked to accept them again when you enter.</p>
        <h2>10. Claims</h2>
        <p>If something on the site causes you a problem or you believe it infringes a right, please write to us first: see <a className="text-info underline" href="/reclamos">Claims &amp; notices</a>. We commit to respond and seek an amicable solution.</p>
        <h2>11. Governing law</h2>
        <p>These terms are governed by the laws of the Republic of Ecuador. If the versions differ, the Spanish version prevails.</p>
      </section>
    </LegalPage>
  );
}
