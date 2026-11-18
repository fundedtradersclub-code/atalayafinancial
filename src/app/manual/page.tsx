import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  alternates: { canonical: "/manual", languages: { es: "/manual", en: "/manual/en" } },
  title: "Manual de uso · ATALAYA",
  description: "Cómo usar ATALAYA: pantallas, gráficos, tendencia, riesgo, analista IA, cartera simulada y cómo conectar APIs, MetaTrader 5 y NinjaTrader.",
};

const TOC: [string, string][] = [
  ["inicio", "1. Primeros pasos"],
  ["comandos", "2. Línea de comandos y teclado"],
  ["etiquetas", "3. Qué significan las etiquetas"],
  ["mercados", "4. Mercados"],
  ["simbolo", "5. Símbolo y gráfico"],
  ["tendencia", "6. Tendencia"],
  ["riesgo", "7. Riesgo"],
  ["ia", "8. Analista IA"],
  ["calc", "9. Calculadoras"],
  ["cartera", "10. Cartera simulada"],
  ["noticias", "11. Noticias"],
  ["apis", "12. Conectar APIs (Finnhub, Twelve Data, Polygon, NVIDIA)"],
  ["mt5", "13. Conectar MetaTrader 5"],
  ["ninja", "14. Conectar NinjaTrader"],
  ["privacidad", "15. Privacidad y riesgo"],
  ["faq", "16. Preguntas frecuentes"],
];

function H({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-6 border-b border-line pb-1 pt-10 font-cond text-[17px] font-semibold uppercase tracking-wider text-amber">
      {children}
    </h2>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-line-strong bg-panel px-1.5 py-0.5 text-[12px] text-amber">{children}</kbd>;
}

function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return <div className={`border-l-2 bg-panel px-3 py-2 ${tone === "warn" ? "border-down" : "border-amber"}`}>{children}</div>;
}

export default function Manual() {
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <Link href="/" aria-label="ATALAYA Financial, inicio"><Logo size={34} /></Link>
          <p className="mt-2 text-[12px] text-muted">Manual de uso</p>
          <div role="group" aria-label="Idioma / Language" className="mt-3 flex w-fit border border-line-strong text-[11px]">
            <span aria-current="page" className="bg-amber px-2 py-0.5 text-black">Español</span>
            <Link href="/manual/en" hrefLang="en" lang="en" className="px-2 py-0.5 text-muted hover:text-text">English</Link>
          </div>
          <nav aria-label="Contenido" className="mt-4">
            <ol className="space-y-1 text-[12px]">
              {TOC.map(([id, t]) => (
                <li key={id}><a href={`#${id}`} className="text-muted hover:text-amber">{t}</a></li>
              ))}
            </ol>
          </nav>
          <Link href="/" className="btn mt-6 inline-block border border-amber px-3 py-1.5 font-cond text-[12px] uppercase tracking-wider text-amber hover:bg-amber hover:text-black">
            Abrir la terminal
          </Link>
        </aside>

        <article className="max-w-[720px] space-y-3 text-[13.5px] leading-relaxed text-text/90 [&_li]:ml-5 [&_ol>li]:list-decimal [&_strong]:text-text [&_ul>li]:list-disc">
          <h1 className="font-cond text-[30px] font-semibold text-text">Manual de ATALAYA Financial</h1>
          <p>
            ATALAYA es una terminal de mercados: reúne precios, gráficos, análisis técnico, riesgo, calculadoras, noticias y un analista con IA en una sola
            pantalla, al estilo de las terminales profesionales. <strong>Muestra datos; no te dice qué comprar ni vender.</strong>
          </p>

          <H id="inicio">1. Primeros pasos</H>
          <ol>
            <li>La primera vez verás una ventana con 4 condiciones (no es asesoría, invertir tiene riesgo, los datos son de terceros, términos). Márcalas y pulsa <strong>Acepto y entro</strong>.</li>
            <li>Arriba está la <strong>línea de comandos</strong>: escribe un símbolo o un comando y pulsa Enter.</li>
            <li>Debajo, la <strong>cinta de precios</strong> (pásale el mouse para pausarla; clic en un precio para abrirlo).</li>
            <li>Las <strong>pestañas</strong> numeradas son las pantallas. El número es su atajo de teclado (Alt + número).</li>
            <li>A la derecha, los <strong>relojes</strong> de Nueva York, Londres, Tokio y tu hora. El punto verde indica bolsa abierta.</li>
            <li>Abajo, el aviso legal y los enlaces a Términos, Privacidad, Cookies, Fuentes y este manual.</li>
          </ol>
          <Note>Tu lista de símbolos, la cartera simulada, tus dibujos y tus API keys se guardan <strong>solo en tu navegador</strong>. Si cambias de navegador o borras los datos del sitio, empiezas de cero.</Note>

          <H id="comandos">2. Línea de comandos y teclado</H>
          <ul>
            <li><K>AAPL</K> <K>NQ</K> <K>BTC</K> <K>ORO</K> <K>EURUSD</K>: abre la ficha del símbolo.</li>
            <li><K>apple</K>, <K>tesla</K>: busca por nombre; elige con ↑ ↓ y Enter.</li>
            <li><K>NVDA RIESGO</K> o <K>BTC TEND</K>: abre el símbolo directo en esa pantalla.</li>
            <li><K>MERC</K> <K>TEND</K> <K>RIESGO</K> <K>IA</K> <K>CALC</K> <K>CARTERA</K> <K>NOT</K> <K>AYUDA</K> <K>CONEXIONES</K>: cambia de pantalla.</li>
            <li><K>COMPRAR 10 AAPL</K> · <K>VENDER 5 AAPL</K>: órdenes en la cartera simulada (dinero ficticio).</li>
            <li><K>VIGILAR TSLA</K> · <K>QUITAR TSLA</K>: añade o quita de tu lista.</li>
          </ul>
          <p>Atajos: <K>/</K> o <K>Ctrl+K</K> va a la línea de comandos · <K>Alt+1</K>…<K>Alt+9</K> y <K>Alt+0</K> cambian de pantalla · <K>Esc</K> limpia.</p>

          <H id="etiquetas">3. Qué significan las etiquetas</H>
          <ul>
            <li><span className="text-up">● EN VIVO</span>: precio en tiempo real (cripto de Binance, acciones con tu key de Finnhub).</li>
            <li><span className="text-up">● METATRADER 5</span> / <span className="text-up">● NINJATRADER</span>: precio en vivo desde tu propio programa de trading (solo instalación personal).</li>
            <li><span className="text-muted">RETRASO</span>: el dato puede llegar 10-15 minutos tarde, o es un dato diario.</li>
            <li>🌙 luna y fila atenuada: ese mercado está <strong>cerrado</strong> (sin datos nuevos hace más de 30 min). No es que la app esté congelada.</li>
            <li>Destello <span className="text-up">verde</span> o <span className="text-down">rojo</span> en un precio: acaba de subir o bajar.</li>
            <li>La hora junto a cada panel es la de su última actualización.</li>
          </ul>

          <H id="mercados">4. Mercados</H>
          <p>
            Tablero con <strong>Mi lista</strong> y grupos de índices, futuros, materias primas, divisas, cripto y bonos. Cada fila muestra último precio,
            variación del día y un mini gráfico de la sesión. Clic en una fila para abrir su ficha; la ✕ quita un símbolo de tu lista. El panel
            <strong> Mayores movimientos</strong> ordena el tablero por % de cambio. Se actualiza cada 10 segundos (cripto cada 5; con MetaTrader o
            NinjaTrader conectados, cada segundo).
          </p>
          <p>En la versión pública, los índices y materias primas se muestran a través de <strong>ETF</strong> que los siguen (SPY = S&amp;P 500, GLD = oro…), y hay un panel de TradingView con índices, futuros y bonos.</p>

          <H id="simbolo">5. Símbolo y gráfico</H>
          <ul>
            <li><strong>Cabecera</strong>: precio (se actualiza cada pocos segundos), variación, fuente, y botones a Riesgo y Calcular. La ★ lo añade a tu lista.</li>
            <li><strong>Temporalidad</strong>: 1m, 5m, 15m, 30m, 1H, 4H, D (diario), S (semanal), M (mensual).</li>
            <li><strong>ATALAYA / TradingView</strong>: alterna entre nuestro gráfico (con tus dibujos e indicadores) y el gráfico oficial de TradingView. Si un mercado no tiene datos propios, se abre TradingView solo.</li>
            <li><strong>Indicadores</strong> (botón “Indicadores”): volumen, medias 20/50/200, EMA 21, Bollinger, canal de tendencia automático (regresión de 50 velas ±2σ, proyectado 10 velas), RSI 14 y MACD en paneles debajo.</li>
            <li><strong>Herramientas de dibujo</strong> (barra izquierda): cursor, línea de tendencia (2 clics), rayo (2 clics, se extiende a la derecha), línea horizontal (1 clic, soporte/resistencia), Fibonacci (clic en el mínimo y el máximo) y regla (mide distancia, % y número de velas). Deshacer: <K>Ctrl+Z</K>. Borrar todo: goma. Cancelar: <K>Esc</K>. Los dibujos se guardan por símbolo.</li>
            <li><strong>Zoom y desplazamiento</strong>: rueda del mouse y arrastrar, con la herramienta Cursor. El zoom se conserva cuando llegan datos nuevos.</li>
            <li><strong>Sesión</strong>: apertura, cierre anterior, máximo, mínimo, volumen, rango de 52 semanas y dónde está el precio dentro de ese rango.</li>
            <li><strong>Orden simulada</strong>: compra o vende con dinero ficticio al último precio.</li>
            <li><strong>Estados financieros · SEC</strong> (acciones de EE. UU.): ingresos, utilidades, UPA, caja, activos, pasivos y patrimonio de los últimos 4 años, más los reportes recientes (10-K, 10-Q, 8-K…) con enlace al documento original.</li>
          </ul>

          <H id="tendencia">6. Tendencia</H>
          <p>
            Lee la tendencia del símbolo en tres marcos de tiempo: <strong>Intradía</strong> (horas), <strong>Diario</strong> (días a semanas) y
            <strong> Semanal</strong> (meses). En cada uno votan 8 señales clásicas: precio contra medias 20 y 50, cruce de medias 20/50 y 50/200,
            MACD, RSI, pendiente de regresión y posición en el rango reciente. El resultado va de <span className="text-down">−100 (bajista)</span> a
            <span className="text-up"> +100 (alcista)</span>; entre −35 y +35 es lateral.
          </p>
          <ul>
            <li><strong>Consenso ponderado</strong>: combina los tres marcos (el semanal pesa más).</li>
            <li><strong>Hurst</strong> (TradingCalc): mayor a 0,55 = los movimientos tienden a continuar; menor a 0,45 = tienden a corregirse; cerca de 0,5 = azar.</li>
            <li>Cada tarjeta muestra el gráfico con medias, soporte (S), resistencia (R) y el canal proyectado “si nada cambia”, y la lista de señales con su voto (+, −, ·).</li>
            <li><strong>Tendencia del mercado</strong>: tabla con unos 20 mercados y su puntaje diario y semanal. Clic para analizar uno.</li>
          </ul>
          <Note tone="warn">Describe precios pasados. No predice el futuro y puede cambiar con la siguiente vela.</Note>

          <H id="riesgo">7. Riesgo</H>
          <p>Con un año de retornos diarios reales del símbolo, TradingCalc calcula: rendimiento y volatilidad anualizados, Sharpe (corregido), Sortino, caída máxima, Calmar, % de días al alza, mejor y peor día, asimetría, curtosis y PSR.</p>
          <p>En <strong>Valor en riesgo</strong> escribe el tamaño de tu posición: verás cuánto podrías perder en un día malo (VaR 95% y 99%) y la pérdida promedio en esos días (CVaR). El histograma muestra cómo se reparten los retornos diarios.</p>

          <H id="ia">8. Analista IA</H>
          <p>
            Haz preguntas en español (“¿Qué niveles de NQ conviene vigilar?”). Antes de responder, el analista recibe los datos de la pantalla: precios del
            tablero, tendencia por marco de tiempo, Hurst y titulares del símbolo. Desmarca “datos de …” para preguntar en general. Enter envía;
            Shift+Enter cambia de línea; el cuadrado detiene la respuesta.
          </p>
          <p>Necesita una key de NVIDIA (gratis): ver sección 12. La IA puede equivocarse; verifica cualquier dato.</p>

          <H id="calc">9. Calculadoras</H>
          <ul>
            <li><strong>Riesgo / beneficio</strong>: unidades a comprar arriesgando un % de tu cuenta, y resultado en el stop y en el objetivo.</li>
            <li><strong>Tamaño de posición</strong>: unidades para no perder más de una cifra en dólares.</li>
            <li><strong>Opciones · Black-Scholes</strong>: precio teórico de call y put y sus griegas.</li>
            <li><strong>Forex · valor del pip</strong>: lote estándar 100.000, mini 10.000, micro 1.000.</li>
          </ul>
          <p>Los valores iniciales se toman del símbolo activo. Los cálculos los hace TradingCalc, sin comisiones.</p>

          <H id="cartera">10. Cartera simulada</H>
          <p>
            Empiezas con $100.000 ficticios. Compra y vende desde la ficha del símbolo o con <K>COMPRAR 10 AAPL</K>. Verás patrimonio, resultado total y
            no realizado, efectivo, posiciones con su peso y el historial de órdenes. “Cerrar” vende toda la posición; “Reiniciar cartera” vuelve a
            $100.000. Solo compras (sin ventas en corto), sin comisiones ni deslizamiento.
          </p>

          <H id="noticias">11. Noticias</H>
          <p>Titulares de MarketWatch y CNBC (en inglés), filtrables por fuente y enlazados a la nota original. En la ficha de cada símbolo hay noticias específicas de esa empresa.</p>

          <H id="apis">12. Conectar APIs (Finnhub, Twelve Data, Polygon, NVIDIA)</H>
          <p>Sin ninguna key ya tienes cripto en vivo, divisas diarias del BCE, estados financieros de la SEC y todas las calculadoras. Con tus keys (todas tienen plan gratis):</p>
          <ul>
            <li><strong>Finnhub</strong> (empieza por esta): precios de acciones y ETF de EE. UU. <strong>en tiempo real</strong>, búsqueda y noticias por empresa.</li>
            <li><strong>Twelve Data</strong>: gráficos de 1 minuto a mensual y divisas intradía.</li>
            <li><strong>Polygon</strong>: historial para gráficos (el plan gratis trae datos del día anterior).</li>
            <li><strong>NVIDIA</strong>: el Analista IA.</li>
          </ul>
          <ol>
            <li>Abre la pestaña <strong>0 · Conexiones</strong> (o <K>Alt+0</K>, o el botón “Conectar” del tablero).</li>
            <li>En el proveedor, pulsa <strong>Crear cuenta y obtener key</strong> y regístrate gratis.</li>
            <li>Copia tu <strong>API key</strong> desde el panel del proveedor.</li>
            <li>Pégala en ATALAYA y pulsa <strong>Guardar y probar</strong>. Si aparece ✓ en verde, quedó conectada.</li>
            <li>Para quitarla, borra el campo y pulsa <strong>Quitar</strong>.</li>
          </ol>
          <Note>Tus keys se guardan solo en tu navegador. Viajan con cada consulta al servidor de ATALAYA, que pide los datos al proveedor en tu nombre y no las guarda. Los futuros de CME (NQ, ES, MNQ) no están en los planes gratis.</Note>

          <H id="mt5">13. Conectar MetaTrader 5</H>
          <p>
            Trae a ATALAYA precios <strong>en vivo</strong> de divisas, oro, plata e índices (US100/USTEC, US500, US30, DE40, JPN225…) desde tu
            MetaTrader 5. Funciona en la <strong>instalación personal</strong> (ATALAYA corriendo en tu propia PC con Windows). Es <strong>solo
            lectura</strong>: no envía órdenes, no lee tu saldo ni tus posiciones y no usa Asesores Expertos (EA).
          </p>
          <p><strong>Lo que necesitas:</strong> Windows, MetaTrader 5 y Python 3 (gratis en python.org; al instalar marca “Add Python to PATH”).</p>
          <ol>
            <li>Descarga MetaTrader 5 desde <a href="https://www.metatrader5.com/es/download" target="_blank" rel="noreferrer" className="text-info underline">metatrader5.com</a> e instálalo.</li>
            <li>Ábrelo y crea una <strong>cuenta demo</strong> (Archivo → Abrir una cuenta → MetaQuotes-Demo, o la demo de tu bróker). Es gratis y sin depósito. También sirve tu cuenta real, porque el puente solo lee precios.</li>
            <li>Deja MetaTrader 5 <strong>abierto y con sesión iniciada</strong>.</li>
            <li>En la carpeta de ATALAYA haz doble clic en <strong>INICIAR-METATRADER5.bat</strong>. La primera vez instala el paquete oficial de MetaQuotes (tarda un minuto).</li>
            <li>La ventana negra debe decir <em>“MetaTrader 5 conectado (…). Instrumentos: N”</em>. <strong>Déjala abierta</strong> mientras uses ATALAYA (puedes minimizarla).</li>
            <li>En ATALAYA, la tarjeta <strong>MetaTrader 5 · tu PC</strong> de Conexiones dirá “conectado”. Las divisas pasan a <span className="text-up">METATRADER 5</span> y en Mercados aparece un panel con los instrumentos de tu bróker. Sus gráficos, tendencia y riesgo también usan esos datos.</li>
          </ol>
          <p><strong>Si algo falla:</strong></p>
          <ul>
            <li><em>“No pude conectar con MetaTrader 5”</em>: abre MetaTrader 5 e inicia sesión, luego vuelve a abrir el .bat.</li>
            <li><em>“python no se reconoce”</em>: instala Python desde python.org marcando “Add Python to PATH” y reinicia la PC.</li>
            <li><strong>Falta un instrumento</strong> (por ejemplo el petróleo): tu bróker no lo ofrece con un nombre conocido. Algunas demos no tienen petróleo como CFD.</li>
            <li><strong>Precios quietos</strong>: fuera de horario (fin de semana, o entre las 16:00 y las 17:00 de Ecuador para varios índices) el bróker no cotiza.</li>
            <li>Si cierras MetaTrader o la ventana negra, ATALAYA vuelve sola a los datos con retraso.</li>
          </ul>
          <Note tone="warn">Son precios de tu bróker (CFD): siguen al mercado pero no son idénticos a los futuros de CME (por ejemplo, US100 frente a NQ puede diferir algunos puntos). Úsalos como referencia para tu uso personal; no se pueden publicar.</Note>

          <H id="ninja">14. Conectar NinjaTrader</H>
          <p>Trae tus futuros (MNQ, NQ, ES…) en vivo desde NinjaTrader 8. Solo instalación personal y solo lectura.</p>
          <Note tone="warn">Si usas una cuenta de fondeo (Apex u otra), <strong>confirma primero con su soporte</strong> que puedes usar un indicador personalizado de solo lectura. ATALAYA no envía órdenes, pero las reglas son de cada firma.</Note>
          <ol>
            <li>Descarga <a href="/ninjatrader/AtalayaBridge-NinjaTrader.zip" download className="text-info underline">AtalayaBridge-NinjaTrader.zip</a> (no lo descomprimas).</li>
            <li>En NinjaTrader: <strong>Herramientas → Importar → Complemento NinjaScript…</strong>, elige el .zip y acepta. Si pregunta por reemplazar, di Sí.</li>
            <li>Si la importación da error: <strong>Nuevo → Editor NinjaScript</strong> → carpeta Indicators → doble clic en AtalayaBridge → <K>F5</K> para compilar.</li>
            <li>En un gráfico de cada instrumento: clic derecho → <strong>Indicadores…</strong> → agrega <strong>AtalayaBridge</strong> → Aceptar.</li>
            <li>Deja NinjaTrader abierto. En Conexiones, “NinjaTrader · tu PC” dirá “conectado” y los futuros mostrarán <span className="text-up">NINJATRADER</span>.</li>
          </ol>
          <p>Verificación: en NinjaTrader abre <strong>Nuevo → NinjaScript Output</strong>; debe decir “AtalayaBridge: publicando precios en http://127.0.0.1:8777/quotes”.</p>

          <H id="privacidad">15. Privacidad y riesgo</H>
          <ul>
            <li>ATALAYA no pide registro ni datos personales, y no usa cookies de publicidad ni de rastreo.</li>
            <li>MetaTrader y NinjaTrader solo se comunican dentro de tu propia computadora; nadie desde internet puede leerlos.</li>
            <li>Los datos pertenecen a sus dueños y se muestran solo con fines informativos.</li>
            <li><strong>Nada en ATALAYA es recomendación de inversión. Invertir tiene alto riesgo: cada persona asume el riesgo de su dinero.</strong></li>
          </ul>
          <p>
            Más detalle: <Link href="/terminos" className="text-info underline">Términos y riesgo</Link> · <Link href="/privacidad" className="text-info underline">Privacidad</Link> ·{" "}
            <Link href="/cookies" className="text-info underline">Cookies</Link> · <Link href="/fuentes" className="text-info underline">Fuentes de datos</Link>.
          </p>

          <H id="faq">16. Preguntas frecuentes</H>
          <p><strong>¿Por qué un precio no se mueve?</strong> Lo más común: ese mercado está cerrado (verás la luna 🌙), o el dato viene con retraso o es diario. Para tiempo real conecta Finnhub, MetaTrader 5 o NinjaTrader.</p>
          <p><strong>¿Puedo conectar Bloomberg?</strong> No. Su API solo funciona con una suscripción a Bloomberg Terminal en la misma computadora; no existe una key para webs.</p>
          <p><strong>¿Y TradingView o investing.com?</strong> TradingView se muestra con sus gráficos oficiales (botón TradingView en la ficha). Extraer datos de TradingView o investing.com viola sus condiciones, así que no se hace.</p>
          <p><strong>¿Por qué los futuros de MetaTrader no coinciden con los de NinjaTrader?</strong> MetaTrader muestra CFD de tu bróker; NinjaTrader, el futuro de CME. Siguen al mismo mercado con pequeñas diferencias.</p>
          <p><strong>¿Se pierde mi cartera si cierro la página?</strong> No, queda guardada en tu navegador. Sí se pierde si borras los datos del sitio o cambias de navegador.</p>

          <p className="pt-10 text-center text-[11px] text-muted">
            <a href="https://www.instagram.com/elmigrante.digital/" target="_blank" rel="noreferrer" className="hover:text-amber">Hecho por @elmigrante.digital</a>
          </p>
        </article>
      </div>
    </div>
  );
}
