import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidad" }, title: "Política de privacidad · ATALAYA" };

export default function Page() {
  return (
    <LegalPage title="Política de privacidad">
      <p className="text-[12px]"><a href="#en" className="text-info underline">English version ↓</a></p>

      <p>ATALAYA no pide registro, nombre, correo ni datos de pago.</p>

      <h2>Qué se guarda y dónde</h2>
      <ul>
        <li>
          <strong>En tu navegador (almacenamiento local):</strong> tu lista de símbolos, la cartera simulada, la última vista abierta, tus dibujos en los
          gráficos y la fecha en que aceptaste estas condiciones. No sale de tu dispositivo y puedes borrarlo limpiando los datos del sitio.
        </li>
        <li>
          <strong>Consultas de mercado:</strong> cuando pides un precio o un gráfico, el servidor de ATALAYA consulta a la fuente correspondiente con el
          símbolo pedido. No se envían datos personales.
        </li>
        <li>
          <strong>Tus API keys (Finnhub, Twelve Data, Polygon, NVIDIA):</strong> se guardan solo en tu navegador. Viajan con cada consulta al servidor
          de ATALAYA, que las usa para pedir los datos al proveedor en tu nombre y no las guarda ni las registra. Puedes borrarlas en Conexiones.
        </li>
        <li>
          <strong>MetaTrader 5 y NinjaTrader:</strong> si conectas tus programas de trading, tu navegador lee sus precios directamente en tu
          computadora (127.0.0.1). Esos datos no salen de tu equipo ni pasan por el servidor de ATALAYA.
        </li>
        <li>
          <strong>Analista IA:</strong> el texto de tus preguntas y los datos de mercado del símbolo activo se envían a NVIDIA para generar la respuesta.
          No escribas datos personales ni financieros privados en el chat.
        </li>
        <li>
          <strong>Registros técnicos:</strong> el proveedor de alojamiento puede registrar datos técnicos básicos (como dirección IP y hora de acceso) por
          seguridad y funcionamiento.
        </li>
      </ul>

      <h2>Tus derechos</h2>
      <p>
        Conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador, puedes pedir acceso, rectificación o eliminación de los datos
        personales que pudieran tratarse. Como ATALAYA no guarda cuentas de usuario, lo habitual es que no exista ningún dato tuyo en sus servidores.
      </p>
      <hr className="my-10 border-line" />
      <section id="en" lang="en" className="space-y-4">
        <h2>English · Privacy policy</h2>
        <p>ATALAYA does not ask for registration, name, email or payment details.</p>
        <h2>What is stored and where</h2>
        <ul>
          <li><strong>In your browser (local storage):</strong> your symbol list, the paper portfolio, the last view, your chart drawings, your API keys, your language and the date you accepted these terms. It does not leave your device and you can delete it by clearing the site data.</li>
          <li><strong>Market queries:</strong> when you request a price or a chart, the ATALAYA server queries the relevant source with the requested symbol. No personal data is sent.</li>
          <li><strong>Your API keys (Finnhub, Twelve Data, Polygon, NVIDIA):</strong> stored only in your browser. They travel with each request to the ATALAYA server, which uses them to request data from the provider on your behalf and neither stores nor logs them. You can delete them in Connections.</li>
          <li><strong>MetaTrader 5 and NinjaTrader:</strong> if you connect your trading software, your browser reads its prices directly on your computer (127.0.0.1). That data never leaves your device or passes through the ATALAYA server.</li>
          <li><strong>AI Analyst:</strong> the text of your questions and the market data of the active symbol are sent to NVIDIA to generate the answer. Do not write personal or private financial data in the chat.</li>
          <li><strong>Technical logs:</strong> the hosting provider may record basic technical data (such as IP address and access time) for security and operation.</li>
        </ul>
        <h2>Your rights</h2>
        <p>Under Ecuador&apos;s Organic Law on Personal Data Protection you may request access, correction or deletion of any personal data that may be processed. Since ATALAYA keeps no user accounts, there is usually no data about you on its servers.</p>
      </section>
    </LegalPage>
  );
}
