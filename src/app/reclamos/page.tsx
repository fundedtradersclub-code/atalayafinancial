import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/reclamos" },
  title: "Reclamos y avisos · Claims & notices · ATALAYA",
  description: "Cómo presentar un reclamo o aviso sobre contenido o datos en ATALAYA Financial. How to file a claim or notice about content or data on ATALAYA Financial.",
};

const CONTACT = "https://www.instagram.com/elmigrante.digital/";

export default function Page() {
  return (
    <LegalPage title="Reclamos y avisos · Claims & notices">
      <p className="text-muted">
        Esta página está en español y en inglés. <span lang="en">This page is available in Spanish and English; the English version is below.</span>
      </p>

      {/* ---------------- ESPAÑOL ---------------- */}
      <section lang="es" aria-labelledby="es" className="space-y-4">
        <h2 id="es">Español</h2>
        <p>
          Queremos resolver cualquier problema <strong>de buena fe, rápido y sin conflictos</strong>. Si crees que algo en ATALAYA infringe tus derechos, una
          licencia, una marca o una ley, o simplemente te causa un problema, escríbenos antes de tomar otra acción: lo revisamos y, si corresponde, lo
          corregimos o retiramos.
        </p>

        <h2>Quién puede presentar un reclamo</h2>
        <ul>
          <li>Dueños o licenciantes de datos, contenidos, software o marcas que aparezcan en el sitio.</li>
          <li>Personas usuarias del sitio.</li>
          <li>Autoridades o sus representantes.</li>
        </ul>

        <h2>Qué incluir</h2>
        <ul>
          <li>Tu nombre u organización y un medio de contacto.</li>
          <li>Qué contenido, dato o función es el problema, con su enlace o una descripción para ubicarlo.</li>
          <li>El derecho, licencia o norma que consideras afectado, y por qué.</li>
          <li>Qué solución pides (por ejemplo: retirar un dato, citar la fuente de otra forma, cambiar un texto).</li>
          <li>Una declaración de que actúas de buena fe y de que la información es correcta.</li>
        </ul>

        <h2>Cómo presentarlo</h2>
        <p>
          Envía un mensaje directo a <a href={CONTACT} target="_blank" rel="noreferrer" className="text-info underline">@elmigrante.digital en Instagram</a> con el asunto
          “Reclamo ATALAYA”. Si no puedes usar ese canal, indícalo en tu mensaje y acordamos otro.
        </p>

        <h2>Nuestro compromiso</h2>
        <ul>
          <li><strong>Acuse de recibo</strong> en un máximo de 5 días hábiles.</li>
          <li><strong>Medida preventiva:</strong> si el reclamo es razonable, podemos desactivar el contenido o la fuente de datos mientras lo revisamos.</li>
          <li><strong>Respuesta</strong> con la decisión y lo que haremos, normalmente en 15 días hábiles.</li>
          <li><strong>Fuentes de datos:</strong> si un proveedor nos pide dejar de mostrar sus datos o cambiar cómo se citan, lo haremos.</li>
          <li>Retirar o cambiar contenido para resolver un reclamo no significa reconocer responsabilidad.</li>
        </ul>

        <h2>Solución amistosa</h2>
        <p>
          Las partes se comprometen a intentar primero un <strong>acuerdo directo</strong> y, si no se logra en 30 días, una <strong>mediación</strong> antes de
          iniciar cualquier acción judicial, salvo que la ley exija otra cosa. Se aplica la ley de la República del Ecuador, sin perjuicio de los derechos
          que la ley de tu país te reconozca.
        </p>

        <h2>Recordatorio</h2>
        <p>
          ATALAYA es una herramienta informativa. Los datos pertenecen a sus dueños y nada de lo que muestra es una recomendación de inversión. Ver{" "}
          <a href="/terminos" className="text-info underline">Términos</a> y <a href="/fuentes" className="text-info underline">Fuentes de datos</a>.
        </p>
      </section>

      <hr className="my-10 border-line" />

      {/* ---------------- ENGLISH ---------------- */}
      <section lang="en" aria-labelledby="en" className="space-y-4">
        <h2 id="en">English</h2>
        <p>
          We want to resolve any issue <strong>in good faith, quickly and without conflict</strong>. If you believe something on ATALAYA infringes your rights,
          a license, a trademark or a law, or simply causes you a problem, please contact us before taking any other action: we will review it and, where
          appropriate, correct or remove it.
        </p>

        <h2>Who may file a claim</h2>
        <ul>
          <li>Owners or licensors of data, content, software or trademarks shown on the site.</li>
          <li>Users of the site.</li>
          <li>Authorities or their representatives.</li>
        </ul>

        <h2>What to include</h2>
        <ul>
          <li>Your name or organization and a way to contact you.</li>
          <li>Which content, data or feature is the problem, with its link or a description to locate it.</li>
          <li>The right, license or rule you believe is affected, and why.</li>
          <li>The remedy you request (for example: remove a data item, credit the source differently, change a text).</li>
          <li>A statement that you are acting in good faith and that the information is accurate.</li>
        </ul>

        <h2>How to file it</h2>
        <p>
          Send a direct message to <a href={CONTACT} target="_blank" rel="noreferrer" className="text-info underline">@elmigrante.digital on Instagram</a> with the subject
          “ATALAYA claim”. If you cannot use that channel, say so in your message and we will agree on another one.
        </p>

        <h2>Our commitment</h2>
        <ul>
          <li><strong>Acknowledgment</strong> within 5 business days.</li>
          <li><strong>Interim measure:</strong> if the claim is reasonable, we may disable the content or data source while we review it.</li>
          <li><strong>Response</strong> with our decision and next steps, normally within 15 business days.</li>
          <li><strong>Data sources:</strong> if a provider asks us to stop displaying its data or to change how it is credited, we will do so.</li>
          <li>Removing or changing content to settle a claim is not an admission of liability.</li>
        </ul>

        <h2>Amicable resolution</h2>
        <p>
          The parties agree to first attempt a <strong>direct settlement</strong> and, if none is reached within 30 days, <strong>mediation</strong> before starting any
          court action, unless the law requires otherwise. The laws of the Republic of Ecuador apply, without prejudice to any rights granted to you by the
          laws of your country.
        </p>

        <h2>Reminder</h2>
        <p>
          ATALAYA is an informational tool. Data belongs to its owners and nothing shown is investment advice. See the{" "}
          <a href="/terminos" className="text-info underline">Terms</a> and <a href="/fuentes" className="text-info underline">Data sources</a>.
        </p>
      </section>
    </LegalPage>
  );
}
