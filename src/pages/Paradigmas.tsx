import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DocumentationSection } from "@/components/sections";
import { trpc } from "@/providers/trpc";
import {
  Sparkles,
  Leaf,
  ChevronRight,
  CloudSunRain,
  Globe,
  Shield,
  DollarSign,
  Users,
  Loader2,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

function ParadigmaHero() {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    setShowSummary(true);
    setSummary("");
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCow8qhRGzD9ABugrXzEQMdX_1EmD2PuHU",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Como experto en gestion hidrica, genera un resumen ejecutivo dirigido a autoridades provinciales sobre el proyecto "El Fin de los Ninos" para Cordoba Argentina. El proyecto propone micro-represas distribuidas monitoreadas con sensores ESP32 y datos satelitales NASA como alternativa a megaproyectos hidricos. Incluye datos de 7 cuencas analizadas, indices NDVI/ESI, y proyecciones a 2050 con demanda de 2600 Hm3. Genera un resumen profesional de 3 paragrafos.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      setSummary(
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No se pudo generar el resumen."
      );
    } catch {
      setSummary("Error al generar el resumen. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pt-32 pb-16 section-dark relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-water-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-eco-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <span className="inline-block tag-blue mb-6">
          NASA Space Apps Challenge 2025
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Analisis Comparativo de Paradigmas en la{" "}
          <span className="gradient-text">Gestion de Recursos Hidricos</span>
        </h1>
        <p className="text-lg text-white/60 max-w-3xl mx-auto mb-8 leading-relaxed">
          Un estudio de caso en Cordoba, Argentina, que contrasta la ingenieria
          civil del siglo XX con la inteligencia geoespacial del siglo XXI para
          proponer un futuro hidrico sostenible y resiliente.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={generateSummary} className="btn-primary">
            <Sparkles className="w-5 h-5" />
            Generar Resumen Ejecutivo con IA
          </button>
        </div>

        {showSummary && (
          <div className="mt-8 text-left glass border-l-4 border-water-500 rounded-xl p-6 animate-fadeIn shadow-xl">
            {loading ? (
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando resumen profesional...
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                {summary.split("\n").map((p, i) => (
                  <p key={i} className="text-white/70 leading-relaxed mb-3">
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ParadigmaI() {
  const { data: projects } = trpc.paradigms.listProjects.useQuery({
    paradigm: "centralized",
  });
  const [selectedProject, setSelectedProject] = useState<number>(0);

  const projectList = projects ?? [];
  const selected = projectList[selectedProject];

  return (
    <section className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-full mb-4">
            PARADIGMA I
          </span>
          <h2 className="text-3xl font-bold text-white">
            Infraestructura Hidrica Centralizada del Siglo XX
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Este enfoque se basa en proyectos de gran escala, masivos y
            centralizados. A continuacion, se exploran las propuestas historicas
            y las razones de su inviabilidad.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-1">
            <div className="glass-card p-6">
              <h4 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Proyectos Considerados
              </h4>
              <div className="space-y-2">
                {projectList.map((project, index) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(index)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm ${
                      selectedProject === index
                        ? "bg-red-500/15 text-red-300 font-semibold border border-red-500/30 shadow-lg shadow-red-500/5"
                        : "hover:bg-white/5 text-white/60"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${selectedProject === index ? "bg-red-400" : "bg-white/20"}`}
                      />
                      {project.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 glass-card p-6 md:p-8 min-h-[400px]">
            {selected ? (
              <div className="animate-fadeIn space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">
                      {selected.name}
                    </h4>
                    <p className="text-sm text-white/50 mt-1">
                      {selected.location}
                    </p>
                  </div>
                </div>

                <p className="text-white/70 leading-relaxed">
                  {selected.description}
                </p>

                <div className="glass border-l-4 border-red-500 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="font-semibold text-sm text-red-400">
                      Causa de Inviabilidad
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">
                    {selected.inviabilityReason}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
                    Indices de Inviabilidad
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        label: "Costo",
                        value: selected.costIndex,
                        color: "red",
                      },
                      {
                        label: "Impacto Ambiental",
                        value: selected.impactIndex,
                        color: "orange",
                      },
                      {
                        label: "Vulnerabilidad",
                        value: selected.vulnerabilityIndex,
                        color: "purple",
                      },
                    ].map(metric => (
                      <div key={metric.label} className="text-center">
                        <div className="relative h-24 flex items-end justify-center mb-2">
                          <div
                            className={`w-full max-w-[60px] rounded-t-lg transition-all duration-700 ease-out ${
                              metric.color === "red"
                                ? "bg-gradient-to-t from-red-600 to-red-400"
                                : metric.color === "orange"
                                  ? "bg-gradient-to-t from-orange-600 to-orange-400"
                                  : "bg-gradient-to-t from-purple-600 to-purple-400"
                            }`}
                            style={{ height: `${metric.value}%` }}
                          />
                        </div>
                        <p
                          className={`text-lg font-bold ${
                            metric.color === "red"
                              ? "text-red-400"
                              : metric.color === "orange"
                                ? "text-orange-400"
                                : "text-purple-400"
                          }`}
                        >
                          {metric.value}/100
                        </p>
                        <p className="text-xs text-white/50">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-white/30">
                <ChevronRight className="w-12 h-12 mb-3 rotate-180" />
                <p>Seleccione un proyecto de la lista para ver los detalles.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h4 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <BarChart3 className="w-6 h-6 text-red-400" />
              Analisis Conceptual de Inviabilidad
            </h4>
            <p className="text-white/50 mt-2 text-sm max-w-2xl mx-auto">
              Aunque los valores son conceptuales, esta grafica ilustra por que
              los megaproyectos son consistentemente descartados.
            </p>
          </div>
          <div className="space-y-6">
            {projectList.map((project, idx) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/80">
                    <span className="text-water-400 font-mono text-xs mr-2">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {project.name}
                  </p>
                  <span className="text-xs text-white/40 font-mono">
                    {(project.costIndex +
                      project.impactIndex +
                      project.vulnerabilityIndex) /
                      3}
                    /100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="h-5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-700"
                        style={{ width: `${project.costIndex}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-white/40 mt-1 block">
                      Costo {project.costIndex}
                    </span>
                  </div>
                  <div>
                    <div className="h-5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700"
                        style={{ width: `${project.impactIndex}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-white/40 mt-1 block">
                      Impacto {project.impactIndex}
                    </span>
                  </div>
                  <div>
                    <div className="h-5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700"
                        style={{ width: `${project.vulnerabilityIndex}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-white/40 mt-1 block">
                      Vulnerabilidad {project.vulnerabilityIndex}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ParadigmaII() {
  const foundations = [
    {
      title: "Resiliencia Climatica",
      desc: "Captura lluvias erraticas y localizadas, creando un sistema robusto y menos vulnerable que un unico gran embalse.",
      icon: CloudSunRain,
    },
    {
      title: "Restauracion Ecologica",
      desc: "Recarga acuiferos, reduce la erosion y restaura la humedad del suelo, combatiendo la desertificacion.",
      icon: Leaf,
    },
    {
      title: "Viabilidad Economica",
      desc: "Implementacion modular y escalable con costos de mantenimiento fraccionados y considerablemente inferiores.",
      icon: DollarSign,
    },
    {
      title: "Gobernanza Local",
      desc: "Fomenta un modelo adaptativo y policentrico, empoderando a las comunidades en la gestion del recurso.",
      icon: Users,
    },
  ];

  const stages = [
    {
      title: "Etapa I: Caracterizacion y Seleccion de Emplazamientos",
      desc: "Se utilizan datos satelitales para encontrar miles de sitios optimos para micro-represas, maximizando la eficiencia.",
      tags: [
        "DEM (SRTM, ALOS PALSAR)",
        "Imagenes Multiespectrales (Landsat, Sentinel)",
      ],
    },
    {
      title: "Etapa II: Monitoreo y Modelado Predictivo",
      desc: "La gestion deja de ser reactiva y se vuelve proactiva, anticipando el ingreso de agua al sistema con datos casi en tiempo real.",
      tags: ["Precipitacion (GPM)", "Humedad del Suelo (SMAP)"],
    },
    {
      title: "Etapa III: Medicion de Impacto y Gestion a Largo Plazo",
      desc: "Se cuantifica el exito del sistema midiendo la mejora en la salud del ecosistema y la recarga real de los acuiferos.",
      tags: [
        "Indices de Vegetacion (MODIS - NDVI)",
        "Datos Gravimetricos (GRACE/GRACE-FO)",
      ],
    },
  ];

  return (
    <section className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-eco-400 bg-eco-500/10 border border-eco-500/20 px-4 py-1.5 rounded-full mb-4">
            PARADIGMA II
          </span>
          <h2 className="text-3xl font-bold text-white">
            Gestion Distribuida con{" "}
            <span className="gradient-text">Inteligencia Geoespacial</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Este modelo propone un sistema descentralizado de micro-represas,
            planificado y gestionado con datos de observacion de la Tierra,
            principalmente de la NASA.
          </p>
        </div>

        <div className="mb-16">
          <h4 className="text-xl font-bold text-center mb-8 text-white flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-eco-400" />
            Fundamentos del Modelo
          </h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foundations.map(f => (
              <div
                key={f.title}
                className="glass-card p-6 hover-lift group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-eco-500/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-eco-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="w-6 h-6 text-eco-400" />
                  </div>
                  <h5 className="font-bold text-lg mb-2 text-white">
                    {f.title}
                  </h5>
                  <p className="text-sm text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xl font-bold text-center mb-8 text-white flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5 text-water-400" />
            Metodologia: El Ecosistema de Datos de la NASA en Accion
          </h4>
          <div className="max-w-3xl mx-auto relative pl-10 lg:pl-12">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-eco-500 via-water-500 to-eco-500 rounded-full" />
            {stages.map((stage, index) => (
              <div key={index} className="relative pb-12 last:pb-0">
                <div className="absolute -left-[34px] top-1 w-8 h-8 bg-nasa-dark border-2 border-eco-500 rounded-full flex items-center justify-center shadow-lg shadow-eco-500/20">
                  <span className="text-xs font-bold text-eco-400">
                    {index + 1}
                  </span>
                </div>
                <div className="glass-card p-6 ml-4">
                  <h5 className="text-lg font-bold text-white mb-2">
                    {stage.title}
                  </h5>
                  <p className="text-white/60 text-sm leading-relaxed mb-3">
                    {stage.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {stage.tags.map(tag => (
                      <span key={tag} className="tag-blue text-[11px]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  const { data: comparison } = trpc.paradigms.getComparison.useQuery();
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const generateAnalysis = async () => {
    setLoading(true);
    setShowAnalysis(true);
    setAnalysis("");
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCow8qhRGzD9ABugrXzEQMdX_1EmD2PuHU",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Como estratega en planificacion urbana y cambio climatico, analiza las implicaciones al 2050 para Cordoba Argentina. Datos: Poblacion 4.8M, demanda hidrica 2600 Hm3. Compara el paradigma centralizado (costo 9/10, impacto 9/10, vulnerabilidad 8/10) vs distribuido (resiliencia 9/10, sostenibilidad 9/10, escalabilidad 9/10). Proporciona recomendaciones de implementacion escalonada 2025-2050. Responde en 3 paragrafos.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await response.json();
      setAnalysis(
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No se pudo generar el analisis."
      );
    } catch {
      setAnalysis("Error al generar el analisis. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-alt py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block tag-orange mb-4">
            COMPARACION DIRECTA
          </span>
          <h2 className="text-3xl font-bold text-white">
            Centralizado vs{" "}
            <span className="gradient-text">Distribuido Geoespacial</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            Esta visualizacion resume el contraste fundamental entre los dos
            enfoques a traves de metricas clave.
          </p>
        </div>

        <div className="glass-card p-6 md:p-8">
          {comparison ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                {comparison.dimensions.map((dim, i) => {
                  const cVal = comparison.centralized[i];
                  const dVal = comparison.distributed[i];
                  const maxVal = Math.max(cVal, dVal, 1);
                  return (
                    <div key={dim} className="text-center">
                      <p className="text-xs font-medium text-white/50 mb-4 uppercase tracking-wider truncate">
                        {dim}
                      </p>
                      <div className="flex items-end justify-center gap-3 h-40">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-red-400">
                            {cVal}
                          </span>
                          <div
                            className="w-10 rounded-t-lg bg-gradient-to-t from-red-600 to-red-400 transition-all duration-700 shadow-lg shadow-red-500/10"
                            style={{
                              height: `${(cVal / maxVal) * 100}%`,
                              minHeight: "8px",
                            }}
                          />
                          <span className="text-[10px] text-white/30 uppercase">
                            Centralizado
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-eco-400">
                            {dVal}
                          </span>
                          <div
                            className="w-10 rounded-t-lg bg-gradient-to-t from-eco-600 to-eco-400 transition-all duration-700 shadow-lg shadow-eco-500/10"
                            style={{
                              height: `${(dVal / maxVal) * 100}%`,
                              minHeight: "8px",
                            }}
                          />
                          <span className="text-[10px] text-white/30 uppercase">
                            Geoespacial
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-red-600 to-red-400" />
                  <span className="text-sm text-white/60">Centralizado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-eco-600 to-eco-400" />
                  <span className="text-sm text-white/60">Geoespacial</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-water-400" />
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <button onClick={generateAnalysis} className="btn-primary">
            <Sparkles className="w-5 h-5" />
            Analizar Implicaciones a Futuro con IA
          </button>
          {showAnalysis && (
            <div className="mt-6 text-left glass border-l-4 border-water-500 rounded-xl p-6 animate-fadeIn max-w-3xl mx-auto shadow-xl">
              {loading ? (
                <div className="flex items-center gap-3 text-white/60">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando analisis...
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  {analysis.split("\n").map((p, i) => (
                    <p key={i} className="text-white/70 leading-relaxed mb-3">
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function GlobalSection() {
  const cases = [
    {
      title: "California, EE.UU.",
      desc: "Enfrenta sequias prolongadas y sobreexplotacion de acuiferos. Un sistema de micro-represas podria potenciar la recarga de acuiferos durante los escasos eventos de lluvia intensa.",
      impact: "Alto potencial",
      tag: "tag-orange",
    },
    {
      title: "Cuenca Murray-Darling, Australia",
      desc: "Sufre de una alta competencia por el agua entre agricultura y consumo humano. Una gestion distribuida mejoraria la eficiencia y reduciria la evaporacion.",
      impact: "Potencial significativo",
      tag: "tag-blue",
    },
    {
      title: "Maharashtra, India",
      desc: "Experimenta monzones irregulares. La implementacion masiva de pequenas estructuras de contencion es una estrategia clave para la seguridad hidrica local.",
      impact: "Alto potencial",
      tag: "tag-green",
    },
  ];

  return (
    <section className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block tag-blue mb-4">
            APLICABILIDAD GLOBAL
          </span>
          <h2 className="text-3xl font-bold text-white">
            Aplicabilidad Global del{" "}
            <span className="gradient-text">Modelo Geoespacial</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-2xl mx-auto">
            La escasez hidrica es un desafio global. El modelo de gestion
            distribuida, basado en datos satelitales publicos, es una solucion
            escalable y adaptable a cualquier region semiarida del mundo.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {cases.map(c => (
            <div
              key={c.title}
              className="glass-card p-6 hover-lift group relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-water-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-water-500/10 transition-all" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-water-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-water-400" />
                </div>
                <h4 className="font-bold text-lg mb-2 text-white group-hover:text-water-400 transition-colors">
                  {c.title}
                </h4>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  {c.desc}
                </p>
                <span className={c.tag}>{c.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConclusionSection() {
  return (
    <section className="section-alt py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-water-500/3 to-eco-500/3 rounded-full blur-[150px] pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="glass-card p-10 md:p-14 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-water-500 via-eco-500 to-water-500 rounded-t-2xl" />
          <Shield className="w-14 h-14 text-water-400 mx-auto mb-6" />
          <span className="inline-block tag-green mb-4">CONCLUSION</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
            Hacia un &ldquo;Gemelo Digital&rdquo; para la{" "}
            <span className="gradient-text">Gobernanza Hidrica</span>
          </h2>
          <p className="text-white/60 leading-relaxed max-w-3xl mx-auto text-lg">
            La propuesta final no es solo construir micro-represas, sino
            desarrollar un{" "}
            <strong className="text-white">"Gemelo Digital"</strong> de la
            cuenca: un modelo virtual dinamico, alimentado por datos de la NASA
            en tiempo real. Esta herramienta permite simular escenarios,
            optimizar la asignacion del recurso y anticipar sequias,
            representando la transicion de la era del hormigon a la era de la
            inteligencia geoespacial. Es un modelo de gestion hidrica escalable
            y exportable para regiones semiaridas del mundo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="tag-blue">Gemelo Digital</span>
            <span className="tag-green">NASA Earthdata</span>
            <span className="tag-orange">Gestion Adaptativa</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Paradigmas() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />
      <ParadigmaHero />
      <ParadigmaI />
      <ParadigmaII />
      <ComparisonSection />
      <GlobalSection />
      <ConclusionSection />
      <DocumentationSection />
      <Footer />
    </div>
  );
}
