import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { trpc } from '@/providers/trpc'
import {
  Droplets, Target, Satellite, Globe, ChevronRight,
  CloudSunRain, Droplet,
  Download, FileText, Code, Map, BookOpen,
  Leaf, Activity, BarChart3, TrendingUp, AlertTriangle,
  Sprout, Bell, Shield
} from 'lucide-react'

// Hero Counter Animation Hook
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, end, duration])

  return { count, ref }
}

function StatCard({ number, label, suffix = '' }: { number: number; label: string; suffix?: string }) {
  const { count, ref } = useCountUp(number)
  return (
    <div ref={ref} className="bg-white rounded-xl p-6 shadow-lg text-center min-w-[180px] hover:-translate-y-2 hover:shadow-xl transition-all duration-300">
      <span className="font-montserrat font-bold text-4xl text-[#0B3D91] block">
        {count}{suffix}
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-2 block">
        {label}
      </span>
    </div>
  )
}

function SectionHeading({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold text-[#0B3D91] flex items-center gap-3">
        <Icon className="w-8 h-8" />
        {title}
      </h2>
      <div className="w-24 h-1 bg-[#0B3D91]/20 mt-3 rounded-full" />
    </div>
  )
}

function InfoCard({ icon: Icon, title, children, accent = '#0B3D91' }: { icon: any; title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300" style={{ borderLeft: `5px solid ${accent}` }}>
      <h3 className="text-xl font-bold text-[#0B3D91] mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: accent }} />
        {title}
      </h3>
      <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

// ============ HERO SECTION ============
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#0B3D91] to-[#1a237e] pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 Q50,20 100,0 L100,100 Q50,80 0,100 Z" fill="white" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <span className="inline-block bg-[#0B3D91] text-white px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/20 mb-6">
          NASA Space Apps Challenge 2025
        </span>
        <h1 className="font-montserrat font-bold text-5xl md:text-6xl text-white mb-4" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>
          El Fin de los Ninos
        </h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
          Sistema de gestion hidrica resiliente ante los fenomenos de El Nino y La Nina en Cordoba, Argentina
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <StatCard number={7} label="Cuencas Analizadas" />
          <StatCard number={100} label="Codigo Abierto" suffix="%" />
          <StatCard number={15} label="Anos de Datos Climaticos" suffix="+" />
        </div>
      </div>
    </section>
  )
}

// ============ ABOUT SECTION ============
function AboutSection() {
  const techStack = ['C++', 'ESP32', 'Google Earth', 'QGIS', 'Python', 'JavaScript', 'NASA WorldWind', 'Sensores IoT', 'API REST', 'GitHub', 'Arduino IDE', 'Global Mapper', 'Proteus']

  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Droplets} title="Acerca del Proyecto" />
        <p className="text-slate-600 leading-relaxed mb-4 max-w-4xl">
          "El Fin de los Ninos" es una solucion innovadora desarrollada por estudiantes del Instituto Jose Antonio Balseiro (IPET N 66) de Cordoba Capital, que aborda la vulnerabilidad hidrica de la provincia de Cordoba ante los fenomenos de El Nino y La Nina.
        </p>
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          El proyecto integra datos climaticos de la NASA con tecnologias de vanguardia como <strong>C++</strong> para programacion de sistemas embebidos, <strong>ESP32</strong> para monitoreo en tiempo real, <strong>Google Earth</strong> para visualizacion geoespacial, y <strong>QGIS</strong> para analisis topografico y delimitacion de cuencas hidrograficas.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <InfoCard icon={Target} title="Objetivos Principales" accent="#FC3D21">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />Analizar el impacto de El Nino/La Nina en recursos hidricos</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />Identificar ubicaciones optimas para micro-represas</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />Desarrollar estrategias de gestion adaptativa al clima</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />Crear modelo predictivo para eventos extremos</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />Implementar sistema de monitoreo con sensores ESP32</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />Desarrollar interfaz web para visualizacion de datos</li>
            </ul>
          </InfoCard>

          <InfoCard icon={Satellite} title="Datos NASA Utilizados" accent="#1A936F">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />Datos de temperatura superficial del mar (TSM)</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />Indice de Oscilacion del Sur (SOI)</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />Datos de precipitacion TRMM y GPM</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />Modelos climaticos para proyecciones</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />Imagenes satelitales multiespectrales</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />Modelos Digitales de Elevacion (MDE)</li>
            </ul>
          </InfoCard>

          <InfoCard icon={Globe} title="Impacto Regional" accent="#0B3D91">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />Reduccion de vulnerabilidad ante sequias e inundaciones</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />Optimizacion del uso del agua para agricultura</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />Proteccion de ecosistemas acuaticos</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />Fortalecimiento de la seguridad hidrica</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />Capacitacion tecnica de estudiantes</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />Generacion de datos para politicas publicas</li>
            </ul>
          </InfoCard>
        </div>

        <div className="flex flex-wrap gap-3">
          {techStack.map((tech) => (
            <span key={tech} className="bg-[#E1F5FE] text-[#0B3D91] px-4 py-1.5 rounded-full text-sm font-semibold">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ AREA SECTION ============
function AreaSection() {
  const { data: cuencasData } = trpc.cuencas.list.useQuery()

  const cuencasDescriptions = [
    "Localizada en la franja de transicion entre el relieve montanoso y las pendientes medias, esta cuenca presenta un patron de drenaje de tipo dendritico y un area de captacion reducida.",
    "Situada en altitudes intermedias, presenta forma alargada con orientacion este-oeste. El relieve circundante es suave, lo que favorece la retencion hidrica.",
    "Ubicada en la zona media del area de estudio, corresponde a una cuenca de extension moderada con escurrimiento predominantemente estacional.",
    "Corresponde a una cuenca alargada ubicada entre areas de pendiente moderada y zonas de acumulacion natural.",
    "De morfologia irregular y con una red de drenaje compleja, esta cuenca se encuentra proxima a un cuerpo de agua de gran tamano.",
    "Ubicada inmediatamente al sur-este de la Cuenca Centro, de tamano reducido y morfologia algo alargada.",
    "Constituye el cuerpo de agua principal de la region, actuando como referencia geografica y nodo hidrico del sistema.",
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Map} title="Area de Estudio" />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          La region de Cordoba, Argentina, representa un caso de estudio ideal para analizar los impactos de El Nino y La Nina debido a su vulnerabilidad hidrica y la importancia economica de sus actividades agricolas.
        </p>

        <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
          <img src="/study-area.jpg" alt="Area de Estudio - Region de Cordoba" className="w-full h-auto" />
          <p className="text-center text-sm text-slate-500 italic py-3 bg-slate-50">
            Figura 1. Area de estudio - Region de Cordoba, Argentina. Zona focalizada en las cuencas hidrograficas identificadas.
          </p>
        </div>

        <div className="bg-[#f0f7ff] rounded-xl p-6 border-l-4 border-[#0B3D91] mb-8">
          <h3 className="text-xl font-bold text-[#0B3D91] mb-3 flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Cuencas Hidrograficas Identificadas
          </h3>
          <p className="text-slate-600 text-sm mb-6">
            Mediante el analisis de datos topograficos y climaticos utilizando QGIS, hemos identificado 7 cuencas principales con potencial para la implementacion de sistemas de gestion hidrica resilientes:
          </p>

          <div className="space-y-4">
            {(cuencasData ?? []).map((cuenca, index) => (
              <div key={cuenca.id} className="bg-white rounded-lg p-5 border-l-4 border-[#1A936F] shadow-sm hover:translate-x-1 transition-transform">
                <h4 className="font-bold text-[#0B3D91] mb-2 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-sm font-bold">
                    {cuenca.number}
                  </span>
                  {cuenca.name}
                </h4>
                <p className="text-slate-600 text-sm">{cuencasDescriptions[index] || cuenca.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ CLIMATE SECTION ============
function ClimateSection() {
  const [activeTab, setActiveTab] = useState<'elnino' | 'lanina' | 'impactos'>('elnino')

  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={CloudSunRain} title="Impacto de El Nino y La Nina en Cordoba" />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          El fenomeno de El Nino/Oscilacion del Sur (ENSO) tiene impactos significativos en el regimen de precipitaciones de Cordoba, afectando la disponibilidad hidrica y la vulnerabilidad ante eventos extremos.
        </p>

        {/* Climate Legend */}
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-[#E74C3C]" /><span className="text-sm text-slate-600">El Nino (Lluvias intensas)</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-[#3498DB]" /><span className="text-sm text-slate-600">La Nina (Sequia)</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-[#F39C12]" /><span className="text-sm text-slate-600">Condiciones Neutrales</span></div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[
              { key: 'elnino' as const, label: 'Fenomeno El Nino', color: '#E74C3C' },
              { key: 'lanina' as const, label: 'Fenomeno La Nina', color: '#3498DB' },
              { key: 'impactos' as const, label: 'Impactos en Cordoba', color: '#F39C12' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all border-b-3 ${
                  activeTab === tab.key
                    ? 'text-[#0B3D91] border-b-[3px] bg-slate-50'
                    : 'text-slate-500 border-b-transparent hover:text-slate-700 hover:bg-slate-50/50'
                }`}
                style={activeTab === tab.key ? { borderBottomColor: tab.color } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'elnino' && (
              <div className="animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-[#0B3D91] mb-4">El Nino y sus Efectos en Cordoba</h3>
                    <p className="text-slate-600 mb-4">Durante los eventos de El Nino, Cordoba experimenta tipicamente condiciones mas humedas de lo normal, con aumento en las precipitaciones entre un 20-40%.</p>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />Aumento del riesgo de inundaciones</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />Incremento en la sedimentacion de embalses</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />Mayor escorrentia superficial</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />Posibilidad de crecidas repentinas</li>
                      <li className="flex items-start gap-2"><Leaf className="w-4 h-4 text-[#1A936F] mt-0.5 flex-shrink-0" />Recarga mejorada de acuiferos</li>
                    </ul>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-md">
                    <img src="/el-nino-satellite.jpg" alt="El Nino satellite image" className="w-full h-64 object-cover" />
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50">Imagen satelital de anomalias de temperatura durante El Nino. Fuente: NASA</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lanina' && (
              <div className="animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-[#0B3D91] mb-4">La Nina y sus Efectos en Cordoba</h3>
                    <p className="text-slate-600 mb-4">Los eventos de La Nina suelen traer condiciones mas secas a Cordoba, con reduccion en las precipitaciones que pueden superar el 30% bajo lo normal.</p>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />Disminucion del caudal en rios y arroyos</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />Reduccion de los niveles en embalses y diques</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />Mayor estres hidrico para la agricultura</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />Aumento del riesgo de incendios forestales</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />Disminucion de la recarga de acuiferos</li>
                    </ul>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-md">
                    <img src="/la-nina-satellite.jpg" alt="La Nina satellite image" className="w-full h-64 object-cover" />
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50">Imagen satelital de anomalias de temperatura durante La Nina. Fuente: NASA</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'impactos' && (
              <div className="animate-fadeIn">
                <h3 className="text-xl font-bold text-[#0B3D91] mb-4">Impactos Socioeconomicos del ENSO en Cordoba</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-slate-600 text-sm">
                    <p><strong className="text-[#0B3D91]">Agricultura:</strong> Perdidas de cosechas durante sequias (La Nina) y danos por inundaciones (El Nino)</p>
                    <p><strong className="text-[#0B3D91]">Infraestructura:</strong> Danos en caminos y puentes durante eventos extremos de lluvia</p>
                    <p><strong className="text-[#0B3D91]">Salud Publica:</strong> Aumento de enfermedades vectoriales durante periodos humedos</p>
                    <p><strong className="text-[#0B3D91]">Energia:</strong> Reduccion en la generacion hidroelectrica durante sequias</p>
                    <p><strong className="text-[#0B3D91]">Ecosistemas:</strong> Alteracion de habitats acuaticos y terrestres</p>
                  </div>
                  <div className="bg-[#f0f7ff] rounded-lg p-5 border-l-4 border-[#F39C12]">
                    <h4 className="font-bold text-[#0B3D91] mb-3">Proyecciones Futuras (2050)</h4>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />Poblacion: 4.8 millones de habitantes</li>
                      <li className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />Demanda de agua: 1,800 a 2,600 Hm3 anuales</li>
                      <li className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />Intensificacion de fenomenos ENSO</li>
                      <li className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />Micro-represas clave para seguridad hidrica</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ SATELLITE SECTION ============
function SatelliteSection() {
  const [phenomenon, setPhenomenon] = useState<'normal' | 'nino' | 'nina'>('normal')
  const [precipitation, setPrecipitation] = useState(100)
  const [temperature, setTemperature] = useState(25)
  const { data: prediction } = trpc.satellite.predictNDVI.useQuery(
    { precipitation, temperature, phenomenon },
    { enabled: true }
  )

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Satellite} title="Analisis de Indices Satelitales" />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          Panel de analisis de recursos hidricos basado en datos satelitales de la NASA para monitoreo y prediccion de la salud vegetal y estres hidrico en la region de Cordoba.
        </p>

        {/* NDVI/ESI Explanation */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" /> NDVI - Indice de Vegetacion
            </h3>
            <p className="text-slate-600 text-sm mb-4">El NDVI mide la salud y densidad de la vegetacion mediante la diferencia entre la reflectancia en el infrarrojo cercano y el rojo.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-sm">NDVI &gt; 0.6: Vegetacion densa y saludable</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /><span className="text-sm">NDVI 0.3-0.6: Vegetacion moderada</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-sm">NDVI &lt; 0.3: Suelo desnudo o vegetacion escasa</span></div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-600" /> ESI - Indice de Estres Evaporativo
            </h3>
            <p className="text-slate-600 text-sm mb-4">El ESI mide el estres hidrico de la vegetacion mediante la relacion entre la temperatura de la superficie y la evapotranspiracion.</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-sm">ESI &gt; 0.8: Sin estres hidrico</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /><span className="text-sm">ESI 0.5-0.8: Estres hidrico moderado</span></div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-sm">ESI &lt; 0.5: Estres hidrico severo</span></div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { title: 'NDVI Promedio Regional', value: '0.49', trend: '5.25%', up: true, accent: '#22c55e' },
            { title: 'ESI Promedio Regional', value: '0.59', trend: '3.83%', up: false, accent: '#3b82f6' },
            { title: 'Area con Estres Hidrico', value: '29%', trend: '7.75%', up: true, accent: '#ef4444' },
            { title: 'Recuperacion Vegetal', value: '71%', trend: '12.35%', up: true, accent: '#10b981' },
          ].map((metric) => (
            <div key={metric.title} className="bg-white rounded-lg p-5 shadow-md border-l-4 hover:-translate-y-1 transition-all" style={{ borderLeftColor: metric.accent }}>
              <h3 className="text-xs font-medium text-slate-500 mb-1">{metric.title}</h3>
              <p className="text-2xl font-bold text-slate-800">{metric.value}</p>
              <span className={`text-xs font-bold ${metric.up ? 'text-green-600' : 'text-red-600'}`}>
                {metric.up ? '↑' : '↓'} {metric.trend}
              </span>
              <p className="text-xs text-slate-400 mt-1">vs mes anterior</p>
            </div>
          ))}
        </div>

        {/* Predictive Model */}
        <div className="bg-white rounded-xl shadow-lg border p-8 mb-10">
          <h3 className="text-2xl font-bold text-center text-slate-800 mb-8">
            <BarChart3 className="w-6 h-6 inline mr-2" />
            Modelo Predictivo de NDVI
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <p className="text-sm text-slate-600">Ajuste los parametros para simular el impacto en la vegetacion.</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fenomeno Climatico</label>
                <select value={phenomenon} onChange={(e) => setPhenomenon(e.target.value as any)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent">
                  <option value="normal">Condiciones Normales</option>
                  <option value="nino">El Nino</option>
                  <option value="nina">La Nina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precipitacion Estimada: <span className="font-bold">{precipitation}</span> mm
                </label>
                <input type="range" min="0" max="200" value={precipitation}
                  onChange={(e) => setPrecipitation(Number(e.target.value))}
                  className="w-full accent-[#0B3D91]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temperatura Promedio: <span className="font-bold">{temperature}</span> °C
                </label>
                <input type="range" min="0" max="40" value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-[#0B3D91]" />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-4 text-center">Resultados de la Simulacion</h4>
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500">NDVI Predicho</p>
                <p className={`text-5xl font-bold ${prediction?.color || 'text-slate-700'}`}>
                  {prediction ? prediction.ndvi.toFixed(2) : '--'}
                </p>
              </div>
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500">Estado de la Vegetacion</p>
                <p className="text-lg font-semibold text-slate-800">{prediction?.status || '--'}</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">Recomendacion</p>
                <p className="text-sm text-slate-700">{prediction?.recommendation || 'Ajuste los parametros para ver una recomendacion.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ RESULTS SECTION ============
function ResultsSection() {
  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Activity} title="Resultados y Estrategias de Adaptacion" />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          Nuestro analisis ha permitido desarrollar estrategias especificas para aumentar la resiliencia hidrica de Cordoba ante la variabilidad climatica.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <InfoCard icon={Droplet} title="Gestion Adaptativa" accent="#0B3D91">
            Desarrollo de protocolos de operacion diferenciados para embalses segun las fases del ENSO, optimizando el almacenamiento durante El Nino y conservando agua durante La Nina. Implementacion de sistemas de alerta temprana con 3-6 meses de anticipacion.
          </InfoCard>
          <InfoCard icon={Sprout} title="Agricultura Resiliente" accent="#1A936F">
            Recomendaciones de cultivos y practicas agricolas adaptadas a las diferentes fases climaticas, minimizando perdidas y maximizando productividad. Tecnificacion del 50% del riego agricola con sistemas de goteo y sensores.
          </InfoCard>
          <InfoCard icon={Bell} title="Sistema de Alerta Temprana" accent="#FC3D21">
            Propuesta de un sistema integrado que combine datos de la NASA con observaciones locales para anticipar eventos extremos. Monitoreo en tiempo real con sensores ESP32 y visualizacion web.
          </InfoCard>
        </div>

        <div className="bg-gradient-to-br from-[#0B3D91] to-[#1a237e] rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Nuestra Mision</h2>
          <p className="text-white/90 max-w-3xl mx-auto leading-relaxed">
            Transformar la vulnerabilidad climatica en oportunidad de desarrollo sostenible, utilizando ciencia de datos para construir comunidades mas resilientes ante el cambio climatico. Integrar conocimientos tecnicos con problematicas reales de la comunidad.
          </p>
        </div>
      </div>
    </section>
  )
}

// ============ DOWNLOADS SECTION ============
function DownloadsSection() {
  const downloads = [
    { title: 'Informe del Proyecto', desc: 'Documento completo en formato PDF.', icon: FileText, color: 'bg-red-500', hoverColor: 'hover:bg-red-600', url: 'https://docs.google.com/document/d/1pRI56umFZt0hpH3QrQ-g5AjqlIIeBPex7Y5YnKCGZpc/edit?usp=sharing' },
    { title: 'Codigo del Prototipo', desc: 'Archivo .INO para Arduino/ESP32.', icon: Code, color: 'bg-green-600', hoverColor: 'hover:bg-green-700', url: 'https://drive.google.com/file/d/1gDedyEV_ftD4zLbC15I4TpdL7YI0SRrP/view?usp=drive_link' },
    { title: 'Informe ENSO (Externo)', desc: 'Diagnostico oficial de NOAA/IRI.', icon: BookOpen, color: 'bg-purple-600', hoverColor: 'hover:bg-purple-700', url: 'https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/?enso_tab=enso-cpc_update' },
    { title: 'Mapa de Cuencas', desc: 'Recurso cartografico de Cordoba.', icon: Map, color: 'bg-gray-400', hoverColor: '', url: null },
  ]

  return (
    <section className="bg-white py-20">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading icon={Download} title="Datos y Recursos Abiertos" />
        <p className="text-slate-600 leading-relaxed mb-10 max-w-4xl">
          En el espiritu de la ciencia abierta de la NASA, compartimos todos nuestros datos, metodologias y resultados para que otros investigadores puedan replicar y mejorar nuestro trabajo.
        </p>

        <div className="bg-white rounded-2xl shadow-lg border overflow-hidden p-8">
          <div className="text-center border-b pb-6 mb-8">
            <h3 className="text-3xl font-bold text-slate-800">El Fin de los Ninos</h3>
            <p className="text-lg text-slate-500 mt-2">Recursos y Descargas del Proyecto</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {downloads.map((item) => (
              <div key={item.title} className={`flex flex-col p-6 bg-gray-50 rounded-xl border border-gray-200 transition-all ${item.url ? 'hover:scale-105 hover:shadow-lg' : 'opacity-60'}`}>
                <div className="flex-shrink-0 mx-auto">
                  <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="text-center mt-4 flex-grow">
                  <h4 className="text-lg font-semibold text-slate-700">{item.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    className={`mt-6 block w-full text-center ${item.color} text-white font-semibold py-3 px-6 rounded-lg ${item.hoverColor} transition-colors`}>
                    {item.title.includes('Informe') || item.title.includes('ENSO') ? 'Ver Informe' : 'Descargar'}
                  </a>
                ) : (
                  <div className="mt-6 w-full text-center bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg cursor-not-allowed">
                    No Disponible
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============ CTA SECTION ============
function CTASection() {
  return (
    <section className="bg-gradient-to-r from-[#0B3D91] to-[#1a237e] py-16">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Explora el Analisis de Paradigmas</h2>
        <p className="text-white/80 mb-8 max-w-2xl mx-auto">
          Descubre la comparacion entre la infraestructura hidrica centralizada del siglo XX y la gestion distribuida con inteligencia geoespacial del siglo XXI.
        </p>
        <Link to="/paradigmas"
          className="inline-flex items-center gap-2 bg-[#FC3D21] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#d63016] transition-all shadow-lg hover:shadow-xl">
          <Shield className="w-5 h-5" />
          Ver Analisis de Paradigmas
        </Link>
      </div>
    </section>
  )
}

// ============ MAIN HOME PAGE ============
export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <AreaSection />
      <ClimateSection />
      <SatelliteSection />
      <ResultsSection />
      <DownloadsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
