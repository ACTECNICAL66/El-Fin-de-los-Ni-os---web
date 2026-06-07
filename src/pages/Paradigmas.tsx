import { useEffect, useState, useRef } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { trpc } from '@/providers/trpc'
import {
  Sparkles, Leaf, ChevronRight,
  CloudSunRain, Globe, Shield, DollarSign,
  Users, Send, Loader2, ToggleLeft, ToggleRight
} from 'lucide-react'

// ============ PARADIGMA HERO ============
function ParadigmaHero() {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const generateSummary = async () => {
    setLoading(true)
    setShowSummary(true)
    setSummary('')
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCow8qhRGzD9ABugrXzEQMdX_1EmD2PuHU', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Como experto en gestion hidrica, genera un resumen ejecutivo dirigido a autoridades provinciales sobre el proyecto "El Fin de los Ninos" para Cordoba Argentina. El proyecto propone micro-represas distribuidas monitoreadas con sensores ESP32 y datos satelitales NASA como alternativa a megaproyectos hidricos. Incluye datos de 7 cuencas analizadas, indices NDVI/ESI, y proyecciones a 2050 con demanda de 2600 Hm3. Genera un resumen profesional de 3 paragrafos.` }] }]
        })
      })
      const data = await response.json()
      setSummary(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el resumen.')
    } catch (error) {
      setSummary('Error al generar el resumen. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="pt-32 pb-16 bg-white">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Analisis Comparativo de Paradigmas en la Gestion de Recursos Hidricos
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
          Un estudio de caso en Cordoba, Argentina, que contrasta la ingenieria civil del siglo XX con la inteligencia geoespacial del siglo XXI para proponer un futuro hidrico sostenible y resiliente.
        </p>
        <button
          onClick={generateSummary}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
        >
          <Sparkles className="w-5 h-5" />
          Generar Resumen Ejecutivo con IA
        </button>

        {showSummary && (
          <div className="mt-8 text-left bg-indigo-50 border-l-4 border-indigo-600 rounded-lg p-6 animate-fadeIn">
            {loading ? (
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando resumen profesional...
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                {summary.split('\n').map((p, i) => (
                  <p key={i} className="text-slate-700 leading-relaxed mb-3">{p}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ============ PARADIGMA I ============
function ParadigmaI() {
  const { data: projects } = trpc.paradigms.listProjects.useQuery({ paradigm: 'centralized' })
  const [selectedProject, setSelectedProject] = useState<number>(0)

  const projectList = projects ?? []
  const selected = projectList[selectedProject]

  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-blue-600 bg-blue-100 px-4 py-1.5 rounded-full mb-4">PARADIGMA I</span>
          <h2 className="text-3xl font-bold text-slate-900">Infraestructura Hidrica Centralizada del Siglo XX</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Este enfoque se basa en proyectos de gran escala, masivos y centralizados. A continuacion, se exploran las propuestas historicas y las razones de su inviabilidad.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="md:col-span-1">
            <h4 className="font-bold text-lg mb-4 text-slate-800">Proyectos Considerados</h4>
            <div className="space-y-2">
              {projectList.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all text-sm ${
                    selectedProject === index
                      ? 'bg-blue-100 text-blue-700 font-semibold shadow-sm'
                      : 'hover:bg-gray-100 text-slate-600'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-200 min-h-[300px]">
            {selected ? (
              <div className="animate-fadeIn">
                <h4 className="text-xl font-bold mb-4 text-slate-800">{selected.name}</h4>
                <dl className="space-y-4">
                  <div>
                    <dt className="font-semibold text-sm text-slate-500">Ubicacion</dt>
                    <dd className="text-slate-700 mt-1">{selected.location}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-sm text-slate-500">Descripcion</dt>
                    <dd className="text-slate-700 mt-1">{selected.description}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-sm text-red-500">Inviabilidad</dt>
                    <dd className="text-slate-700 mt-1">{selected.inviabilityReason}</dd>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">Costo</p>
                      <p className="text-lg font-bold text-red-600">{selected.costIndex}/100</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">Impacto</p>
                      <p className="text-lg font-bold text-orange-600">{selected.impactIndex}/100</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-500">Vulnerabilidad</p>
                      <p className="text-lg font-bold text-purple-600">{selected.vulnerabilityIndex}/100</p>
                    </div>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-slate-400">
                <ChevronRight className="w-12 h-12 mb-3 rotate-180" />
                <p>Seleccione un proyecto de la lista para ver los detalles.</p>
              </div>
            )}
          </div>
        </div>

        {/* Inviability Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h4 className="text-xl font-bold text-center mb-6 text-slate-800">Analisis Conceptual de Inviabilidad</h4>
          <p className="text-center text-slate-600 mb-6 max-w-2xl mx-auto text-sm">
            Aunque los valores son conceptuales, esta grafica ilustra por que los megaproyectos son consistentemente descartados.
          </p>
          <div className="space-y-4">
            {projectList.map((project) => (
              <div key={project.id} className="space-y-2">
                <p className="text-sm font-medium text-slate-700">{project.name}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="h-4 bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${project.costIndex}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">Costo {project.costIndex}</span>
                  </div>
                  <div>
                    <div className="h-4 bg-orange-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${project.impactIndex}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">Impacto {project.impactIndex}</span>
                  </div>
                  <div>
                    <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${project.vulnerabilityIndex}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">Vulnerabilidad {project.vulnerabilityIndex}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ PARADIGMA II ============
function ParadigmaII() {
  const foundations = [
    { title: 'Resiliencia Climatica', desc: 'Captura lluvias erraticas y localizadas, creando un sistema robusto y menos vulnerable que un unico gran embalse.', icon: CloudSunRain },
    { title: 'Restauracion Ecologica', desc: 'Recarga acuiferos, reduce la erosion y restaura la humedad del suelo, combatiendo la desertificacion.', icon: Leaf },
    { title: 'Viabilidad Economica', desc: 'Implementacion modular y escalable con costos de mantenimiento fraccionados y considerablemente inferiores.', icon: DollarSign },
    { title: 'Gobernanza Local', desc: 'Fomenta un modelo adaptativo y policentrico, empoderando a las comunidades en la gestion del recurso.', icon: Users },
  ]

  const stages = [
    {
      title: 'Etapa I: Caracterizacion y Seleccion de Emplazamientos',
      desc: 'Se utilizan datos satelitales para encontrar miles de sitios optimos para micro-represas, maximizando la eficiencia.',
      tags: ['DEM (SRTM, ALOS PALSAR)', 'Imagenes Multiespectrales (Landsat, Sentinel)']
    },
    {
      title: 'Etapa II: Monitoreo y Modelado Predictivo',
      desc: 'La gestion deja de ser reactiva y se vuelve proactiva, anticipando el ingreso de agua al sistema con datos casi en tiempo real.',
      tags: ['Precipitacion (GPM)', 'Humedad del Suelo (SMAP)']
    },
    {
      title: 'Etapa III: Medicion de Impacto y Gestion a Largo Plazo',
      desc: 'Se cuantifica el exito del sistema midiendo la mejora en la salud del ecosistema y la recarga real de los acuiferos.',
      tags: ['Indices de Vegetacion (MODIS - NDVI)', 'Datos Gravimetricos (GRACE/GRACE-FO)']
    },
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-green-600 bg-green-100 px-4 py-1.5 rounded-full mb-4">PARADIGMA II</span>
          <h2 className="text-3xl font-bold text-slate-900">Gestion Distribuida con Inteligencia Geoespacial</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Este modelo propone un sistema descentralizado de micro-represas, planificado y gestionado con datos de observacion de la Tierra, principalmente de la NASA.
          </p>
        </div>

        {/* Foundation Cards */}
        <div className="mb-16">
          <h4 className="text-xl font-bold text-center mb-8 text-slate-800">Fundamentos del Modelo</h4>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {foundations.map((f) => (
              <div key={f.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:-translate-y-2 hover:shadow-lg transition-all">
                <f.icon className="w-8 h-8 text-green-600 mb-3" />
                <h5 className="font-bold text-lg mb-2 text-green-700">{f.title}</h5>
                <p className="text-sm text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology Timeline */}
        <div>
          <h4 className="text-xl font-bold text-center mb-8 text-slate-800">Metodologia: El Ecosistema de Datos de la NASA en Accion</h4>
          <div className="relative pl-8 border-l-2 border-gray-200 space-y-10">
            {stages.map((stage, index) => (
              <div key={index} className="relative">
                <div className="absolute -left-[34px] top-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white shadow-sm" />
                <h5 className="text-lg font-bold text-slate-800">{stage.title}</h5>
                <p className="text-slate-600 mt-2 text-sm">{stage.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stage.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ COMPARISON SECTION ============
function ComparisonSection() {
  const { data: comparison } = trpc.paradigms.getComparison.useQuery()
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const generateAnalysis = async () => {
    setLoading(true)
    setShowAnalysis(true)
    setAnalysis('')
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCow8qhRGzD9ABugrXzEQMdX_1EmD2PuHU', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Como estratega en planificacion urbana y cambio climatico, analiza las implicaciones al 2050 para Cordoba Argentina. Datos: Poblacion 4.8M, demanda hidrica 2600 Hm3. Compara el paradigma centralizado (costo 9/10, impacto 9/10, vulnerabilidad 8/10) vs distribuido (resiliencia 9/10, sostenibilidad 9/10, escalabilidad 9/10). Proporciona recomendaciones de implementacion escalonada 2025-2050. Responde en 3 paragrafos.` }] }]
        })
      })
      const data = await response.json()
      setAnalysis(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el analisis.')
    } catch (error) {
      setAnalysis('Error al generar el analisis. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Comparacion Directa de Paradigmas</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Esta visualizacion resume el contraste fundamental entre los dos enfoques a traves de metricas clave.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-md border">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {comparison?.dimensions.map((dim, i) => (
              <div key={dim} className="text-center">
                <p className="text-xs font-medium text-slate-500 mb-3">{dim}</p>
                <div className="flex items-end justify-center gap-4 h-32">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-red-500 font-bold">{comparison.centralized[i]}</span>
                    <div className="w-8 bg-red-400 rounded-t-md transition-all" style={{ height: `${comparison.centralized[i] * 10}px` }} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-green-500 font-bold">{comparison.distributed[i]}</span>
                    <div className="w-8 bg-green-400 rounded-t-md transition-all" style={{ height: `${comparison.distributed[i] * 10}px` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-400 rounded" /><span className="text-sm text-slate-600">Centralizado</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-400 rounded" /><span className="text-sm text-slate-600">Geoespacial</span></div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={generateAnalysis}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Analizar Implicaciones a Futuro con IA
          </button>
          {showAnalysis && (
            <div className="mt-6 text-left bg-indigo-50 border-l-4 border-indigo-600 rounded-lg p-6 animate-fadeIn max-w-3xl mx-auto">
              {loading ? (
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando analisis...
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  {analysis.split('\n').map((p, i) => (
                    <p key={i} className="text-slate-700 leading-relaxed mb-3">{p}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ============ GLOBAL SECTION ============
function GlobalSection() {
  const cases = [
    { title: 'California, EE.UU.', desc: 'Enfrenta sequias prolongadas y sobreexplotacion de acuiferos. Un sistema de micro-represas podria potenciar la recarga de acuiferos durante los escasos eventos de lluvia intensa.' },
    { title: 'Cuenca Murray-Darling, Australia', desc: 'Sufre de una alta competencia por el agua entre agricultura y consumo humano. Una gestion distribuida mejoraria la eficiencia y reduciria la evaporacion.' },
    { title: 'Maharashtra, India', desc: 'Experimenta monzones irregulares. La implementacion masiva de pequenas estructuras de contencion es una estrategia clave para la seguridad hidrica local.' },
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Aplicabilidad Global del Modelo Geoespacial</h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            La escasez hidrica es un desafio global. El modelo de gestion distribuida, basado en datos satelitales publicos, es una solucion escalable y adaptable.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {cases.map((c) => (
            <div key={c.title} className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:-translate-y-2 hover:shadow-lg transition-all">
              <Globe className="w-10 h-10 text-[#0B3D91] mx-auto mb-4" />
              <h4 className="font-bold text-lg mb-2">{c.title}</h4>
              <p className="text-sm text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ AI ASSISTANT ============
function AIAssistant() {
  const [messages, setMessages] = useState<{role: string; text: string}[]>([
    { role: 'model', text: 'Hola! Soy tu asistente para el analisis de datos hidricos. Puedes subir archivos y darme instrucciones para mejorar. En que puedo ayudarte hoy?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [extendedKnowledge, setExtendedKnowledge] = useState(false)
  const [creatorInstructions, setCreatorInstructions] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(`session_${Date.now()}`)

  const sendMutation = trpc.chat.sendMessage.useMutation()

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const result = await sendMutation.mutateAsync({
        sessionId: sessionId.current,
        message: userMsg,
        extendedKnowledge,
        creatorInstructions: creatorInstructions || undefined,
      })
      setMessages(prev => [...prev, { role: 'model', text: result.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, ocurrio un error. Por favor intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
            Asistente de IA
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
            Analisis y respuestas inteligentes sobre los datos hidricos.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['QGIS', 'ESP32', 'Micro-represas', 'NASA', 'NDVI', 'Demografia'].map(tag => (
              <span key={tag} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">{tag}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Chat */}
          <div className="p-6">
            <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 py-2 mb-4 rounded-r">
              <p className="text-sm text-slate-700">
                Este es un asistente de IA disenado para ayudarte a analizar y comprender los datos hidricos de Cordoba.
              </p>
            </div>
            <div className="h-80 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-3 rounded-lg text-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border p-3 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ej: Cual es la tendencia del embalse San Roque?"
                className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Creator Panel */}
          <div className="border-t p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Panel del Creador</h3>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Conocimiento Extendido</p>
                  <p className="text-xs text-slate-500">Permite a la IA responder temas sobre hidrologia, GIS, etc.</p>
                </div>
                <button onClick={() => setExtendedKnowledge(!extendedKnowledge)}>
                  {extendedKnowledge ? <ToggleRight className="w-10 h-10 text-green-500" /> : <ToggleLeft className="w-10 h-10 text-gray-400" />}
                </button>
              </div>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg mb-4">
              <p className="text-sm font-bold text-yellow-800">Mejora la IA</p>
              <p className="text-xs text-yellow-700">Usa este panel para darle nuevas instrucciones o contexto a la IA.</p>
            </div>
            <textarea
              value={creatorInstructions}
              onChange={(e) => setCreatorInstructions(e.target.value)}
              placeholder="Ej: A partir de ahora, cuando hablemos de calidad del agua, enfocate en los niveles de pH y turbidez."
              className="w-full h-24 border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
            <button
              onClick={() => {
                setMessages(prev => [...prev, { role: 'model', text: 'Comportamiento de la IA actualizado con tus nuevas instrucciones.' }])
                setCreatorInstructions('')
              }}
              className="mt-3 w-full bg-[#1A936F] text-white py-2 rounded-lg hover:bg-[#147a5f] transition-colors font-medium"
            >
              Actualizar Comportamiento de la IA
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ CONCLUSION SECTION ============
function ConclusionSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white p-10 rounded-2xl shadow-lg border text-center">
          <Shield className="w-12 h-12 text-[#0B3D91] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Conclusion: Hacia un "Gemelo Digital" para la Gobernanza Hidrica
          </h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto">
            La propuesta final no es solo construir micro-represas, sino desarrollar un "Gemelo Digital" de la cuenca: un modelo virtual dinamico, alimentado por datos de la NASA en tiempo real. Esta herramienta permite simular escenarios, optimizar la asignacion del recurso y anticipar sequias, representando la transicion de la era del hormigon a la era de la inteligencia geoespacial. Es un modelo de gestion hidrica escalable y exportable para regiones semiaridas del mundo.
          </p>
        </div>
      </div>
    </section>
  )
}

// ============ MAIN PARADIGMAS PAGE ============
export default function Paradigmas() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen">
      <Navigation />
      <ParadigmaHero />
      <ParadigmaI />
      <ParadigmaII />
      <ComparisonSection />
      <GlobalSection />
      <AIAssistant />
      <ConclusionSection />
      <Footer />
    </div>
  )
}
