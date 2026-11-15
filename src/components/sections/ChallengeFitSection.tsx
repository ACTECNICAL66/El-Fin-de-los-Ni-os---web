import { Link } from "react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  Leaf,
  MapPinned,
  Sigma,
  Target,
  TrendingUp,
} from "lucide-react";
import { SectionHeading } from "./shared";

const preguntas = [
  {
    n: "01",
    icon: Database,
    pregunta: "¿Qué cambió?",
    respuesta: "Seis variables de NASA POWER (precipitación, temperatura media y máxima, viento, humedad del suelo y radiación) en series anuales 2000–2025.",
    href: "#detective",
    enlace: "Explorar series",
  },
  {
    n: "02",
    icon: MapPinned,
    pregunta: "¿Dónde cambió?",
    respuesta: "En siete puntos de grilla representativos de Córdoba. El mapa dibuja marcadores, no polígonos coloreados como promedios de área.",
    href: "#mapa-comparativo",
    enlace: "Ver mapa de puntos",
  },
  {
    n: "03",
    icon: TrendingUp,
    pregunta: "¿Cuánto cambió?",
    respuesta: "Pendiente de Sen por década, intervalo aproximado y cambio total estimado. Caso concreto: Cuenca Sur, temperatura media.",
    href: "#caso-de-estudio",
    enlace: "Ver caso y límites",
  },
  {
    n: "04",
    icon: Sigma,
    pregunta: "¿Es significativo?",
    respuesta: "Mann–Kendall nominal, corrección por autocorrelación (TFPW y n efectivo) y control de las 42 pruebas con Bonferroni/BH.",
    href: "#respaldo-estadistico",
    enlace: "Ver las 42 pruebas",
  },
  {
    n: "05",
    icon: Leaf,
    pregunta: "¿Por qué importa?",
    respuesta: "Un gestor del agua puede revisar demanda, evaporación, bandas ENSO condicionales y prioridades de monitoreo, sabiendo que un punto de grilla no dimensiona una obra.",
    href: "#analisis-problema",
    enlace: "Ver contexto hídrico",
  },
];

const alcanceResuelto = [
  "Atribución ENSO realizada: 504 pruebas con ONI / Niño 3.4, composites, retardos, BH y una estación real. Ver /#enso.",
  "Escenarios condicionales 3–6 meses con bandas P10–P90; el sitio no promete pronóstico operativo. Ver /#enso.",
  "Réplica reproducible en lugar de «gemelo digital» en vivo: datos + modelo + panel V4 + visor 2D, con estado de simulación explícito. Ver /#cuencas.",
  "Serie observada del Observatorio Córdoba (288 meses) y contraste con NASA POWER; ya no hay plantilla vacía. Ver /#enso.",
  "Análisis de cuencas casi completo: QGIS, DEM, curvas, EVA, GeoJSON, 2D y 3D inventariados. Ver /#cuencas.",
  "NDVI y GPM IMERG siguen en catálogo, fuera de las 42 pruebas de tendencia; los puntos de grilla no se presentan como promedios areales.",
];

export default function ChallengeFitSection() {
  return (
    <section id="encuadre-desafio" className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-start justify-between gap-5 mb-9">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 tag-blue mb-4">
              <Target className="w-3.5 h-3.5" /> Desafío 2026 · Be an Earth System Trend Detective!
            </div>
            <SectionHeading icon={Sigma} title="Cinco preguntas, una entrega trazable" />
            <p className="text-white/65 leading-relaxed -mt-4">
              El planteo del desafío pide encontrar variables de NASA, visualizar
              cómo cambian en el tiempo y decidir <strong className="text-white">qué, dónde, cuánto y si el cambio es significativo</strong>.
              Esta sección es el índice explícito de dónde se responde cada parte
              en el sitio, y de qué conclusiones evitamos.
            </p>
          </div>
          <Link to="/#" className="btn-secondary inline-flex shrink-0">
            Volver arriba <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {preguntas.map(p => (
            <a
              key={p.n}
              href={p.href}
              className="glass-card p-5 hover-lift group flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <p.icon className="w-5 h-5 text-water-300" />
                <span className="font-mono text-xs text-white/25">{p.n}</span>
              </div>
              <h3 className="font-display font-semibold text-white mb-2">{p.pregunta}</h3>
              <p className="text-xs text-white/55 leading-relaxed flex-1">{p.respuesta}</p>
              <span className="inline-flex items-center gap-1 text-xs text-water-300 mt-4 group-hover:text-water-200">
                {p.enlace} <ArrowUpRight className="w-3 h-3" />
              </span>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-eco-400" />
              <h3 className="font-display font-semibold text-white">Cómo encaja con «Ambiente y sostenibilidad»</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-white/60 leading-relaxed">
              <p><strong className="text-white">Datos abiertos de NASA.</strong> POWER Monthly API, 1.092 observaciones, scripts y CSV publicados para replicar el análisis.</p>
              <p><strong className="text-white">Recurso hídrico local.</strong> Córdoba, sequía 2020–2023, demanda y evaporación: el caso se escribe para quien decide sobre el agua.</p>
              <p><strong className="text-white">Rigor antes que titular.</strong> Autocorrelación, 42 pruebas, celdas duplicadas y límites de un punto de grilla.</p>
              <p><strong className="text-white">ODS 6, 13 y 15.</strong> Agua, acción climática y ecosistemas; la tecnología futura se presenta sin fingir mediciones.</p>
            </div>
          </div>

          <div className="glass-card p-6 border-emerald-300/20 bg-emerald-300/[0.03]">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
              <h3 className="font-display font-semibold text-white">Alcance verificado y decisiones resueltas</h3>
            </div>
            <ul className="space-y-2">
              {alcanceResuelto.map(item => (
                <li key={item} className="flex gap-2 text-xs text-white/55 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300/70 mt-0.5 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-white/35 mt-6 leading-relaxed max-w-4xl">
          Esta síntesis se agregó para que la evaluación no tenga que «adivinar»
          dónde está cada requisito del desafío. El panel de control, la
          electrónica y el dron quedan después de esta sección: son aplicaciones
          futuras, no evidencia de las tendencias.
        </p>
      </div>
    </section>
  );
}
