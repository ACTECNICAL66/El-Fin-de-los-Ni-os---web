import { useEffect } from "react";
import { Link } from "react-router";
import {
  Cpu,
  CircuitBoard,
  Gauge,
  Radio,
  Sun,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ArrowUpRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import HardwareDiagram from "@/components/HardwareDiagram";
import ControlPanelDemo from "@/components/ControlPanelDemo";
import { SectionHeading } from "@/components/sections/shared";
import { asset } from "@/lib/utils";

const componentes = [
  { cantidad: "1", nombre: "ESP32-S3", detalle: "Microcontrolador WiFi/Bluetooth dual-core 240 MHz, 8 MB flash" },
  { cantidad: "1", nombre: "HC-SR04", detalle: "Sensor ultrasónico de nivel, 2–400 cm, 5 V" },
  { cantidad: "1", nombre: "YF-S201", detalle: "Caudalímetro 1–30 L/min, factor K 7,5 pulsos/L" },
  { cantidad: "1", nombre: "DS18B20", detalle: "Temperatura digital OneWire; error -127 → código -999" },
  { cantidad: "1", nombre: "SEN0189 / TSW-20M", detalle: "Turbidez (0–1000 NTU) y TDS/calidad de agua" },
  { cantidad: "1", nombre: "Servo SG90 + electroválvula", detalle: "Compuerta: solenoide 12 V normalmente cerrada" },
  { cantidad: "1", nombre: "Buzzer + LED + pulsador", detalle: "Alerta sonora 1200/800 Hz, estado y control físico" },
  { cantidad: "2", nombre: "TDA2822", detalle: "Comparadores del seguidor solar analógico" },
  { cantidad: "2", nombre: "TIP42", detalle: "Transistores PNP para motores de los ejes X/Y" },
  { cantidad: "4", nombre: "LDR + resistencias 10 kΩ", detalle: "Divisores de tensión para detectar posición solar" },
  { cantidad: "1", nombre: "Panel 6 V / 1 W + TP4056 + 18650", detalle: "Alimentación solar y batería de reserva 3,7 V / 2600 mAh" },
];

const endpoints = [
  { ruta: "/", descripcion: "Devuelve la página HTML del panel (generada por paginaHTML())" },
  { ruta: "/data", descripcion: "JSON con distancia, caudal, temperatura, TDS, turbidez y volumenTotal" },
  { ruta: "/toggleCompuerta", descripcion: "Invierte el estado del servo/compuerta y responde OK" },
  { ruta: "/toggleX · /toggleY", descripcion: "Activa o desactiva los módulos analógicos del seguidor solar" },
];

const roadmap = [
  {
    icon: CheckCircle2,
    estado: "Realizado (simulación / laboratorio)",
    titulo: "Diseño de circuitos",
    texto: "Circuito de compuerta en Tinkercad y Proteus; seguidor solar analógico de dos ejes con LDR. Firmware C++ con servidor web embebido y panel HTML/CSS/JS.",
    tono: "text-emerald-300",
  },
  {
    icon: CheckCircle2,
    estado: "Realizado (sin sensores conectados)",
    titulo: "Prueba de la interfaz",
    texto: "El informe aclara que las capturas de la web se tomaron con el MCU sin nada conectado para verificar la interfaz y el manejo de errores.",
    tono: "text-emerald-300",
  },
  {
    icon: Clock3,
    estado: "Pendiente",
    titulo: "Calibración e instalación",
    texto: "Calibración trimestral con patrones, gabinete estanco IP65, watchdog y alimentación estabilizada antes de cualquier serie continua.",
    tono: "text-amber-300",
  },
  {
    icon: Clock3,
    estado: "Pendiente",
    titulo: "Piloto de campo y conexión al análisis",
    texto: "Prueba de 6–12 meses y fallback LoRaWAN/4G ante cortes de WiFi; el contraste con la estación real del Observatorio Córdoba ya está publicado en /#enso.",
    tono: "text-amber-300",
  },
];

export default function Monitoreo() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-nasa-dark">
      <Navigation />
      <main className="pt-28 pb-16">
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-water-300 text-sm font-medium mb-3">
                <CircuitBoard className="w-4 h-4" /> Electrónica + aplicación de monitoreo
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-white">
                Nodo ESP32 y panel hídrico
              </h1>
              <p className="text-white/65 leading-relaxed max-w-3xl mt-4">
                Traducción a la web de las secciones 5, 6, 8 y 9.3 del informe:
                qué componentes se diseñaron, cómo funciona el firmware y qué
                mostraría la aplicación de monitoreo. Se ubica{" "}
                <strong className="text-white">después del análisis estadístico</strong>,
                porque todavía no produce series utilizables para la gestión.
              </p>
            </div>
            <Link to="/" className="btn-secondary inline-flex shrink-0">
              <ArrowLeft className="w-4 h-4" /> Volver al análisis
            </Link>
          </div>

          <div role="note" className="mt-7 rounded-xl border border-amber-300/25 bg-amber-300/5 px-5 py-4 text-sm text-amber-100/85 leading-relaxed flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
            <p>
              <strong className="text-amber-200">Estado real: prototipo de laboratorio y maqueta.</strong>{" "}
              Los circuitos se simularon y la interfaz se probó con el
              microcontrolador sin sensores conectados. No hay nodos instalados
              en cuencas, no hay telemetría en vivo y los valores del panel de
              abajo son ilustrativos. Ningún dato de esta página se usa en las
              42 tendencias ni en el mapa comparativo.
            </p>
          </div>
        </section>

        {/* Diagrama */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <div className="glass-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="font-display text-xl font-semibold text-white">Arquitectura del prototipo</h2>
              <span className="text-xs font-mono text-white/40">Diseño · informe secciones 5–6</span>
            </div>
            <HardwareDiagram />
          </div>
        </section>

        {/* BOM + firmware */}
        <section className="max-w-7xl mx-auto px-6 mb-10 grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="glass-card p-6">
            <SectionHeading icon={Gauge} title="Componentes del diseño" />
            <p className="text-sm text-white/55 -mt-4 mb-5">
              Listado según materiales y presupuesto del informe (sección 8). El
              presupuesto estimado allí corresponde a precios marzo–octubre 2025;
              se mantiene como referencia histórica, no como cotización 2026.
            </p>
            <div className="overflow-x-auto custom-scrollbar max-h-[430px] rounded-lg border border-white/[0.07]">
              <table className="w-full min-w-[520px] text-sm border-collapse">
                <thead className="sticky top-0 bg-[#0a1a30]">
                  <tr className="text-white/40 text-xs uppercase tracking-wider">
                    <th className="text-left py-2.5 px-3">Cant.</th>
                    <th className="text-left py-2.5 px-3">Componente</th>
                    <th className="text-left py-2.5 px-3">Especificación</th>
                  </tr>
                </thead>
                <tbody>
                  {componentes.map(c => (
                    <tr key={c.nombre} className="border-t border-white/[0.06]">
                      <td className="py-2.5 px-3 font-mono text-water-300/80 whitespace-nowrap">{c.cantidad}</td>
                      <td className="py-2.5 px-3 text-white/80 whitespace-nowrap">{c.nombre}</td>
                      <td className="py-2.5 px-3 text-white/55">{c.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-white/45">
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> Arduino IDE 2.3.6</span>
              <span className="flex items-center gap-1.5"><CircuitBoard className="w-3.5 h-3.5" /> Proteus 8.17 SP2</span>
              <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5" /> Tinkercad (circuito inicial)</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-5 h-5 text-water-400" />
                <h2 className="font-display text-lg font-semibold text-white">Firmware y comunicación</h2>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                ESP32 en modo Access Point (<code className="text-water-300">MedidorPRO</code>),
                servidor <code className="text-water-300">WebServer</code> en puerto 80.
                El navegador consulta <code className="text-water-300">/data</code> cada
                2 segundos y actualiza el DOM sin recargar la página.
              </p>
              <div className="space-y-2 mb-4">
                {endpoints.map(e => (
                  <div key={e.ruta} className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-2">
                    <p className="font-mono text-xs text-water-300">{e.ruta}</p>
                    <p className="text-xs text-white/50 mt-0.5">{e.descripcion}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-black/30 border border-white/10 p-3 font-mono text-[11px] text-white/65 leading-relaxed">
                {"{ \"distancia\": 128.4, \"caudal\": 12.4,"}
                <br />
                {'  "temperatura": -999.0, "volumenTotal": 1284.6 }'}
              </div>
              <p className="text-xs text-white/45 mt-3 leading-relaxed">
                El firmware usa <code>-999.0</code> como código de error cuando el
                DS18B20 devuelve <code>-127</code>; la interfaz muestra "ERROR" y
                lo registra en la barra de notificaciones. El lazo principal usa{" "}
                <code>millis()</code> en lugar de <code>delay()</code> para no
                bloquear <code>server.handleClient()</code>.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-eco-400" />
                <h2 className="font-display text-lg font-semibold text-white">Qué falta para ser monitoreo real</h2>
              </div>
              <ul className="space-y-2 text-sm text-white/60 list-disc pl-4 leading-relaxed">
                <li>Sensores calibrados conectados y registro continuo con marca de tiempo.</li>
                <li>Gabinete IP65, watchdog, respaldo de energía y almacenamiento local.</li>
                <li>Conectividad rural con fallback LoRaWAN / 4G.</li>
                <li>Contraste de campo continuo con varios pluviómetros, además de la serie histórica ya integrada del Observatorio Córdoba.</li>
                <li>Piloto de campo de 6–12 meses (riesgo tecnológico del informe, 10.4.2).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Panel de monitoreo (demo V4) */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Panel de control interactivo</h2>
              <p className="text-xs text-white/45 mt-1">Versión V4 integrada al diseño del sitio, a partir del HTML V3 del equipo.</p>
            </div>
            <Link to="/panel" className="btn-secondary inline-flex">
              Abrir pantalla completa <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <ControlPanelDemo />
        </section>

        {/* Hoja de ruta */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <SectionHeading icon={Clock3} title="Del prototipo al campo" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roadmap.map(paso => (
              <div key={paso.titulo} className="glass-card p-5">
                <paso.icon className={`w-5 h-5 mb-3 ${paso.tono}`} />
                <p className={`text-[10px] uppercase tracking-wider mb-2 ${paso.tono}`}>{paso.estado}</p>
                <h3 className="font-display font-semibold text-white mb-2">{paso.titulo}</h3>
                <p className="text-xs text-white/55 leading-relaxed">{paso.texto}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Recursos */}
        <section className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6 items-center">
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src={asset("/sensor-esp32.jpg")} alt="Ilustración conceptual de un nodo ESP32 con sensores" className="w-full h-56 object-cover" />
              <p className="text-xs text-white/40 px-4 py-3 bg-white/[0.03]">Ilustración conceptual, no fotografía del prototipo.</p>
            </div>
            <div className="glass-card p-6">
              <h2 className="font-display text-xl font-semibold text-white mb-3">Fuentes y descargas</h2>
              <p className="text-sm text-white/60 leading-relaxed mb-5">
                Todo lo descrito aquí proviene del informe del proyecto
                (secciones 5 "Circuitos / Programación", 6 "Programación / Página
                web", 8 "Materiales" y 9.3 "Diseño del sistema de monitoreo
                electrónico") y del repositorio.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="https://docs.google.com/document/d/11dXRoOLjMCFvs1rITCMewpi3_DfsOlHDD8drtrgiccY/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/75"
                >
                  <ExternalLink className="w-4 h-4" /> Informe completo
                </a>
                <a
                  href="https://drive.google.com/file/d/1gDedyEV_ftD4zLbC15I4TpdL7YI0SRrP/view?usp=drive_link"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/75"
                >
                  <Download className="w-4 h-4" /> Código .INO del prototipo
                </a>
                <Link to="/" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-water-500/15 border border-water-400/30 hover:bg-water-500/25 text-water-200">
                  <ArrowLeft className="w-4 h-4" /> Ver análisis y sus límites
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
