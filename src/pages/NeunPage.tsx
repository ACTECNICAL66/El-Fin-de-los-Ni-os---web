import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ExternalLink,
  Download,
  AlertTriangle,
  Cpu,
  Compass,
  Radar,
  Thermometer,
  ShieldAlert,
  Play,
  Layers,
  CheckCircle2,
  Clock3,
  Sparkles,
  Target,
  Mountain,
  Waves,
  MapPin,
  ScanSearch,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { asset } from "@/lib/utils";

type MissionPreset = {
  id: "talud" | "alcantarilla" | "transecta" | "sentry";
  tag: string;
  titulo: string;
  vinculoDatos: string;
  descripcion: string;
  sensores: string;
  modoRobot: string;
};

const misionesHidro: MissionPreset[] = [
  {
    id: "talud",
    tag: "Post-sequía (−26 % en 2020–2023)",
    titulo: "Inspección de taludes y grietas de desecación",
    vinculoDatos: "Conecta con el déficit hídrico documentado en los 7 puntos de Córdoba.",
    descripcion:
      "Camina sobre coronamientos pedregosos y márgenes agrietadas donde un vehículo con ruedas patina, midiendo pendiente real y asentamientos antes del llenado.",
    sensores: "MPU6050 (pitch/roll clínico) + TCRT5000 (borde)",
    modoRobot: "WALK_FWD · inclinación activa",
  },
  {
    id: "alcantarilla",
    tag: "Pre-El Niño (+17,3 mm/mes)",
    titulo: "Reconocimiento de alcantarillas y descargadores",
    vinculoDatos: "Conecta con la atribución ONI / Niño 3.4 de meses más lluviosos.",
    descripcion:
      "Ingresa en conductos, aliviaderos y galerías techadas sin señal GPS donde el dron AG-01 no puede volar, detectando obstrucciones por sedimento o ramas.",
    sensores: "HC-SR04 (ultrasonido) + Faros + NeoPixel 8×8",
    modoRobot: "CRAWL · chasis bajo (−29 mm)",
  },
  {
    id: "transecta",
    tag: "Contraste de grilla (~50 km) y EVA",
    titulo: "Transectas terrestres (Ground-Truthing)",
    vinculoDatos: "Conecta con el límite espacial de NASA POWER y el borde de Cuenca 1 (1167 m).",
    descripcion:
      "Recorre la ribera marcando waypoints georreferenciados y midiendo temperatura/humedad al ras del suelo para contrastar el calentamiento (+0,41 °C/década en CS).",
    sensores: "AHT10 (temp/humedad) + GPS NEO-6M",
    modoRobot: "EXPLORE · registro por tramos",
  },
  {
    id: "sentry",
    tag: "Cuencas serranas · respuesta rápida",
    titulo: "Centinela temporal de crecidas y mula de datos",
    vinculoDatos: "Conecta con la falta de conectividad rural señalada en /monitoreo.",
    descripcion:
      "Se posiciona temporalmente sobre roca firme con el torso elevado al máximo para vigilar subidas bruscas del pelo de agua o recolectar datos WiFi de nodos fijos aislados.",
    sensores: "ESP32-S3 WiFi + HC-SR04 + Buzzer de alerta",
    modoRobot: "SENTRY · despeje máximo (+48 mm)",
  },
];

const mapeoHardware = [
  {
    modulo: "Locomoción 12-DOF (PCA9685 + 12 servos)",
    especificacion: "4 patas × 3 ejes (Coxa 32 mm, Fémur 60 mm, Tibia 90 mm), IK analítica C²",
    usoHidrico: "Desplazamiento sobre escollera, barro seco, escalones y pendientes de ribera sin compactar ni deslizar.",
  },
  {
    modulo: "IMU MPU6050 (I2C 0x68)",
    especificacion: "Acelerómetro + giroscopio de 6 ejes con compensación postural",
    usoHidrico: "Inclinómetro de taludes, detección de deformación en márgenes de micro-represas y autoestabilización.",
  },
  {
    modulo: "Ultrasonido HC-SR04 (GPIO 10/11)",
    especificacion: "Rango 2–400 cm (mismo sensor base del nodo hídrico fijo)",
    usoHidrico: "Detección de taponamientos dentro de alcantarillas y medición puntual de distancia al pelo de agua.",
  },
  {
    modulo: "Sensor higrotérmico AHT10 (I2C 0x38)",
    especificacion: "Temperatura y humedad relativa digital a ras de suelo",
    usoHidrico: "Microclima de ribera para contrastar la señal regional de temperatura media (+0,41 °C/década).",
  },
  {
    modulo: "GPS NEO-6M + IR TCRT5000",
    especificacion: "Trazas/waypoints satelitales y sensor infrarrojo de escalón",
    usoHidrico: "Georreferenciación del contorno húmedo real (validación EVA) y freno automático ante barrancos.",
  },
  {
    modulo: "ESP32-S3 + NeoPixel 8×8 + Buzzer",
    especificacion: "Dual-core 240 MHz, AP/STA HTTP JSON, iluminación y alerta",
    usoHidrico: "Iluminación interna en galerías oscuras, baliza visual/sonora en crecidas y enlace con nodos hídricos.",
  },
];

export default function NeunPage() {
  const [viewerTab, setViewerTab] = useState<"simulador" | "panel">("simulador");
  const [activeMission, setActiveMission] = useState<MissionPreset["id"]>("talud");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const controlUrl = asset("/neun/index.html");
  const simulatorUrl = asset("/neun/simulador.html");
  const firmwareUrl = asset("/neun/arana_robot.ino");
  const spiderSilverUrl = asset("/neun/spider_mark.png");
  const spiderGradientUrl = asset("/neun/spider_bg.png");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const triggerMissionInViewer = (preset: MissionPreset["id"]) => {
    setActiveMission(preset);
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(
        { source: "el-fin-de-los-ninos-neun", type: "mission", preset },
        "*"
      );
    }
  };

  const currentSrc =
    viewerTab === "simulador"
      ? `${simulatorUrl}?mission=${activeMission}`
      : `${controlUrl}?mission=${activeMission}`;

  return (
    <div className="neun-page min-h-screen bg-nasa-dark">
      <Navigation />

      <main className="pt-28 pb-16">
        {/* Cabecera */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.04] border border-water-400/25 p-2.5 flex items-center justify-center shrink-0 shadow-lg shadow-water-500/10">
                <img
                  src={spiderSilverUrl}
                  alt="Emblema metálico del proyecto NEUN"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-water-300 text-xs sm:text-sm font-medium mb-2">
                  <Cpu className="w-4 h-4" />
                  <span>Proyecto articulado IPET N°66 · Adaptación terrestre para cuencas</span>
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold text-white leading-tight">
                  NEUN · Explorador Cuadrúpedo H1
                </h1>
                <p className="text-white/65 leading-relaxed max-w-3xl mt-3">
                  Adaptación del robot cuadrúpedo <strong className="text-white">NEUN</strong>{" "}
                  (Electrónica Digital III · IPET N°66 Dr. José Antonio Balseiro) al problema
                  hídrico de <strong className="text-white">El Fin de los Niños</strong>:
                  inspección a ras de suelo en taludes agrietados por sequía, conductos sin GPS
                  antes de eventos El Niño y validación terrestre donde ni el nodo fijo ni el
                  dron aéreo pueden operar.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={controlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-water-400/35 bg-water-500/15 px-4 py-2.5 text-sm font-medium text-water-200 hover:bg-water-500/25 transition-colors"
              >
                Abrir Centro NEUN completo <ExternalLink className="w-4 h-4" />
              </a>
              <Link to="/" className="btn-secondary inline-flex">
                <ArrowLeft className="w-4 h-4" /> Volver al análisis
              </Link>
            </div>
          </div>

          {/* Nota de rigor y estado real */}
          <div
            role="note"
            className="mt-7 rounded-xl border border-amber-300/25 bg-amber-300/5 px-5 py-4 text-sm text-amber-100/85 leading-relaxed flex gap-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
            <div>
              <strong className="text-amber-200">
                Estado real: prototipo mecatrónico escolar + réplica reproducible 3D (sin campañas de cuenca).
              </strong>{" "}
              A diferencia del dron conceptual <code>AG-01</code>, NEUN cuenta con firmware{" "}
              <code>ESP32-S3</code> verificado, cinemática inversa de 12 servos y panel de control
              desarrollados en el IPET N°66. En esta página se ejecuta en{" "}
              <strong className="text-amber-200">simulación local explícita</strong> y su adaptación
              hidrológica es una propuesta de transferencia tecnológica:{" "}
              <strong className="text-amber-200">
                ningún dato del robot participa en las 42 tendencias NASA POWER ni en las 504 pruebas ENSO.
              </strong>
            </div>
          </div>

          {/* Comparación de escalas dentro del proyecto */}
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/45 uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5 text-water-400" /> Escala puntual fija
              </div>
              <p className="text-sm font-semibold text-white mb-1">Nodo Hídrico ESP32 (/monitoreo)</p>
              <p className="text-xs text-white/60 leading-relaxed">
                Mide nivel, caudal y turbidez en una única sección de compuerta o canal.
              </p>
            </div>
            <div className="glass-card p-4 border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/45 uppercase tracking-wider mb-1">
                <Compass className="w-3.5 h-3.5 text-amber-300" /> Escala aérea (concepto)
              </div>
              <p className="text-sm font-semibold text-white mb-1">Dron Aqua-Guardian AG-01 (/drone)</p>
              <p className="text-xs text-white/60 leading-relaxed">
                Vista general de espejos abiertos; no ingresa en túneles, alcantarillas ni bajo monte cerrado.
              </p>
            </div>
            <div className="glass-card p-4 border-water-400/30 bg-water-500/[0.06]">
              <div className="flex items-center gap-2 text-xs text-water-300 uppercase tracking-wider mb-1">
                <Radar className="w-3.5 h-3.5 text-water-300" /> Escala terrestre escarpada
              </div>
              <p className="text-sm font-semibold text-white mb-1">Araña NEUN-H1 (este apartado)</p>
              <p className="text-xs text-white/70 leading-relaxed">
                Camina sobre roca, taludes agrietados y desagües techados llevando IMU, ultrasonido, AHT10 y GPS.
              </p>
            </div>
          </div>

          {/* Ficha breve para presentar el proyecto */}
          <section id="ficha-proyecto" className="mt-6 rounded-2xl border border-water-300/20 bg-gradient-to-br from-[#0c2236] via-[#0b1728] to-[#101323] p-6 md:p-7 shadow-xl shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 text-water-300 text-[11px] font-mono uppercase tracking-[.16em] mb-2">
                  <Sparkles className="w-4 h-4" /> Ficha de presentación · Coolest Projects Argentina
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                  Una araña robótica para mirar más de cerca las cuencas
                </h2>
                <p className="mt-3 text-sm md:text-base text-white/75 leading-relaxed">
                  <strong className="text-white">NEUN</strong> es un cuadrúpedo escolar del IPET N°66 con 12 servos,
                  ESP32-S3 y sensores de orientación y distancia. La propuesta es adaptarlo para reconocer a ras del suelo
                  márgenes, drenajes y sectores donde una estación fija o un dron tienen límites. Esta web permite explorar
                  sus movimientos y cargar una malla 3D; las misiones ambientales son todavía una propuesta, no resultados
                  de una campaña de campo.
                </p>
              </div>
              <a href="#neun-demo" className="inline-flex items-center gap-2 rounded-xl border border-water-300/30 bg-water-400/10 px-4 py-3 text-sm font-semibold text-water-100 hover:bg-water-400/20 transition-colors">
                <Play className="w-4 h-4" /> Ver demostración
              </a>
            </div>
            <div className="mt-6 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[.045] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-200/80">Base construida</p>
                <p className="mt-1 text-sm font-semibold text-white">Robot escolar + control</p>
                <p className="mt-1 text-xs text-white/55 leading-relaxed">Electrónica, firmware y cinemática de 12 articulaciones como punto de partida.</p>
              </div>
              <div className="rounded-xl border border-water-300/15 bg-water-300/[.045] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-water-200/80">Aporte propuesto</p>
                <p className="mt-1 text-sm font-semibold text-white">Reconocimiento del entorno</p>
                <p className="mt-1 text-xs text-white/55 leading-relaxed">Combinar relieve, proximidad, microclima y ubicación para complementar otros puntos de observación.</p>
              </div>
              <div className="rounded-xl border border-amber-300/15 bg-amber-300/[.045] p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-amber-100/80">Próxima evidencia clave</p>
                <p className="mt-1 text-sm font-semibold text-white">Prueba real documentada</p>
                <p className="mt-1 text-xs text-white/55 leading-relaxed">Video del robot operando, sensores contrastados y datos de una prueba segura en terreno.</p>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-2 border-t border-white/[.08] pt-4 text-[11px] leading-relaxed text-white/45">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-water-300" />
              Esta ficha organiza la presentación del proyecto; no es una acreditación, evaluación ni aval oficial del certamen.
            </p>
          </section>
        </section>

        {/* Objetivo ampliado: lectura de los alrededores */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <div className="glass-card p-6 md:p-7 border-water-400/20 bg-water-500/[0.035]">
            <div className="max-w-4xl mb-5">
              <div className="flex items-center gap-2 text-water-300 text-xs font-mono uppercase tracking-wider mb-2">
                <ScanSearch className="w-4 h-4" /> Objetivo ampliado
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                Analizar el entorno, no solo el recorrido del robot
              </h2>
              <p className="text-sm text-white/65 leading-relaxed mt-2">
                NEUN se plantea como una plataforma de reconocimiento local que aporta contexto a la cuenca:
                relieve y estabilidad de márgenes, drenajes y obstáculos, microclima de ribera y ubicación de
                observaciones. El visor admite cargar un archivo STL local para revisar geometrías del robot o del terreno.
                La lectura ambiental que ves aquí es una propuesta de análisis; no equivale a un levantamiento de
                campo ni a una clasificación automática del terreno.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                {
                  icon: Mountain,
                  title: "Relieve y taludes",
                  value: "MPU6050 + modelo STL",
                  detail: "Orientación del chasis y revisión visual de pendientes, escalones y geometrías cargadas.",
                },
                {
                  icon: Waves,
                  title: "Drenajes y agua",
                  value: "HC-SR04 + inspección cercana",
                  detail: "Distancia a superficies, obstrucciones y cambios locales; no mide caudal por sí solo.",
                },
                {
                  icon: ScanSearch,
                  title: "Suelo y microclima",
                  value: "AHT10 + observación",
                  detail: "Temperatura y humedad ambiente simuladas en esta réplica, a complementar con sensores calibrados.",
                },
                {
                  icon: MapPin,
                  title: "Ubicación y transecta",
                  value: "GPS NEO-6M",
                  detail: "Waypoints y recorrido de reconocimiento; bajo techos o sin fijación satelital puede perder señal.",
                },
              ].map(layer => (
                <article key={layer.title} className="rounded-xl border border-white/10 bg-[#07101d]/65 p-4">
                  <layer.icon className="w-5 h-5 text-water-300 mb-3" />
                  <h3 className="text-sm font-semibold text-white">{layer.title}</h3>
                  <p className="text-[11px] font-mono text-water-200/80 mt-1">{layer.value}</p>
                  <p className="text-xs text-white/55 leading-relaxed mt-2">{layer.detail}</p>
                </article>
              ))}
            </div>
            <p className="text-[11px] text-amber-100/70 border-t border-white/[0.08] mt-5 pt-4 leading-relaxed">
              <strong className="text-amber-200">Límite de la versión preliminar:</strong> los valores del centro de control
              son una réplica simulada; el archivo STL permite revisar una malla 3D local, pero no se genera todavía un
              mapa GIS, una nube de puntos ni una evaluación hidrológica automática del área.
            </p>
          </div>
        </section>

        {/* Misiones hidrológicas interactivas */}
        <section className="max-w-7xl mx-auto px-6 mb-10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                Objetivos de NEUN dentro de El Fin de los Niños
              </h2>
              <p className="text-sm text-white/60 mt-1">
                Tocá cualquiera de las cuatro misiones para enviar la rutina correspondiente al
                simulador 3D de abajo.
              </p>
            </div>
            <span className="text-xs font-mono text-water-300/80">
              4 misiones · basadas en el hardware actual de NEUN
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {misionesHidro.map(m => {
              const selected = activeMission === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => triggerMissionInViewer(m.id)}
                  className={`neun-mission-card text-left glass-card p-5 transition-all border ${
                    selected ? "is-active" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-water-500/15 border border-water-400/25 text-water-300">
                      {m.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-eco-300">
                      <Play className="w-3.5 h-3.5" />
                      {selected ? "Misión activa en visor" : "Probar en 3D"}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-1.5">
                    {m.titulo}
                  </h3>
                  <p className="text-xs text-water-200/80 mb-2">{m.vinculoDatos}</p>
                  <p className="text-sm text-white/65 leading-relaxed mb-3">{m.descripcion}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/[0.07] text-xs text-white/50 font-mono">
                    <span>{m.sensores}</span>
                    <span className="text-amber-200/85">{m.modoRobot}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Visor interactivo embebido (Simulador 3D / Centro de Control NEUN) */}
        <section
          id="neun-demo"
          className="max-w-[1600px] mx-auto px-3 sm:px-6 mb-12 scroll-mt-24"
          aria-label="Réplica interactiva del robot NEUN"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-0 mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-white/[0.04] border border-white/10 p-1">
              <button
                type="button"
                onClick={() => setViewerTab("simulador")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  viewerTab === "simulador"
                    ? "bg-water-500/25 text-water-200 border border-water-400/35"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Simulador 3D Articulado (recomendado)
              </button>
              <button
                type="button"
                onClick={() => setViewerTab("panel")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  viewerTab === "panel"
                    ? "bg-water-500/25 text-water-200 border border-water-400/35"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Centro de Control NEUN v2.6 completo
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <a
                href={simulatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white/65 hover:text-water-300 transition-colors"
              >
                Simulador 3D en pestaña nueva <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-white/20">·</span>
              <a
                href={controlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white/65 hover:text-water-300 transition-colors"
              >
                Panel completo en pestaña nueva <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#080b13] shadow-2xl shadow-black/40">
            <iframe
              ref={iframeRef}
              key={viewerTab}
              src={currentSrc}
              title="Réplica interactiva 3D del robot cuadrúpedo NEUN"
              className="block h-[82vh] min-h-[700px] w-full border-0 bg-[#080b13]"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </section>

        {/* Tabla de correspondencia Hardware NEUN -> Aplicación Hídrica */}
        <section className="max-w-7xl mx-auto px-6 mb-12 grid lg:grid-cols-[1.35fr_0.65fr] gap-6 items-start">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2.5 mb-2">
              <Thermometer className="w-5 h-5 text-water-400" />
              <h2 className="font-display text-xl font-bold text-white">
                Cómo se reutiliza la electrónica de NEUN sin rediseñar el chasis
              </h2>
            </div>
            <p className="text-sm text-white/55 mb-5">
              Cada subsistema de <code>arana_robot.cpp</code> cumple una función directa al
              trasladarse del aula de robótica a una micro-cuenca serrana.
            </p>

            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-white/[0.08]">
              <table className="w-full min-w-[580px] text-sm border-collapse">
                <thead className="bg-[#0a1a30] text-white/45 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left py-2.5 px-3.5">Subsistema NEUN</th>
                    <th className="text-left py-2.5 px-3.5">Hardware real</th>
                    <th className="text-left py-2.5 px-3.5">Función en El Fin de los Niños</th>
                  </tr>
                </thead>
                <tbody>
                  {mapeoHardware.map(item => (
                    <tr key={item.modulo} className="border-t border-white/[0.06]">
                      <td className="py-3 px-3.5 font-medium text-water-200">{item.modulo}</td>
                      <td className="py-3 px-3.5 text-xs font-mono text-white/55">
                        {item.especificacion}
                      </td>
                      <td className="py-3 px-3.5 text-white/70 leading-relaxed">
                        {item.usoHidrico}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Identidad visual + hoja de ruta corta + descargas */}
          <div className="space-y-5">
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={spiderGradientUrl}
                  alt="Logo original NEUN degradado"
                  className="w-11 h-11 object-contain rounded-lg bg-black/40 p-1.5 border border-white/10"
                />
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/45">
                    Sinergia institucional
                  </p>
                  <h3 className="font-display font-semibold text-white">
                    Mismo colegio, dos escalas
                  </h3>
                </div>
              </div>
              <p className="text-xs text-white/60 leading-relaxed mb-4">
                Ambos desarrollos pertenecen al <strong className="text-white/85">IPET N°66</strong>{" "}
                y comparten microcontrolador (<code>ESP32-S3</code>), arquitectura de servidor web
                asíncrono y filosofía de código abierto reproducible.
              </p>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2 text-emerald-300/90">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Ya resuelto:</strong> cinemática IK 3-DOF, 19 modos, modelo binario{" "}
                    <code>NEUN3D03</code> y firmware unificado C++.
                  </span>
                </div>
                <div className="flex items-start gap-2 text-amber-200/90">
                  <Clock3 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Próximo paso para campo:</strong> sellado contra polvo/salpicaduras en
                    patas, fundas de silicona en servos y sonda inferior de humedad/TDS abatible
                    con <code>SLEEP</code> (<code>body_z = -1</code>).
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-water-400" />
                <h3 className="font-display font-semibold text-white text-sm">
                  Archivos reproducibles incluidos
                </h3>
              </div>
              <div className="flex flex-col gap-2.5 text-sm">
                <a
                  href={firmwareUrl}
                  download="arana_robot_neun_esp32s3.ino"
                  className="inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 transition-colors"
                >
                  <span className="inline-flex items-center gap-2">
                    <Download className="w-4 h-4 text-water-300" />
                    Firmware ESP32-S3 (.INO)
                  </span>
                  <span className="text-[11px] font-mono text-white/40">PCA9685 + sensores</span>
                </a>
                <Link
                  to="/monitoreo"
                  className="inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 transition-colors"
                >
                  <span>Comparar con Nodo Hídrico fijo</span>
                  <span className="text-xs text-water-300">/monitoreo →</span>
                </Link>
                <Link
                  to="/drone"
                  className="inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 transition-colors"
                >
                  <span>Comparar con Dron AG-01</span>
                  <span className="text-xs text-amber-300">/drone →</span>
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
