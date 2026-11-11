import { Droplets, Target, Satellite, Globe, ChevronRight } from "lucide-react";
import { SectionHeading, InfoCard } from "./shared";

export default function AboutSection() {
  const techStack = [
    "React",
    "TypeScript",
    "Vite",
    "Chart.js",
    "Python",
    "GitHub Pages",
  ];

  return (
    <section className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Droplets} title="Acerca del Proyecto" />
        <p className="text-white/70 leading-relaxed mb-4 max-w-4xl">
          "El Fin de los Ninos" es una solucion innovadora desarrollada por
          estudiantes del Instituto Jose Antonio Balseiro (IPET N 66) de Cordoba
          Capital, que aborda la vulnerabilidad hidrica de la provincia de
          Cordoba ante los fenomenos de El Nino y La Nina.
        </p>
        <p className="text-white/70 leading-relaxed mb-8 max-w-4xl">
          La aplicación web ofrece un explorador de tendencias construido con
          React y TypeScript. La propuesta de gestión hídrica incluye líneas de
          trabajo con sensores y análisis geoespacial que requieren validación e
          implementación adicional.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <InfoCard icon={Target} title="Objetivos de trabajo">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Analizar el impacto de El Nino/La Nina en recursos hidricos
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Identificar ubicaciones optimas para micro-represas
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Desarrollar estrategias de gestion adaptativa al clima
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Explorar métodos de alerta para eventos extremos
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Evaluar un futuro sistema de monitoreo con sensores ESP32
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Desarrollar interfaz web para visualizacion de datos
              </li>
            </ul>
          </InfoCard>

          <InfoCard icon={Satellite} title="Fuentes de datos y estado">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />
                NASA POWER: precipitación, temperatura, viento, humedad del suelo y radiación solar
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />
                Series anuales 2000–2025 para siete puntos de cuenca
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />
                MODIS NDVI: integración pendiente
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />
                GPM IMERG: integración pendiente
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />
                Cada punto representa una celda de grilla, no un promedio de cuenca
              </li>
            </ul>
          </InfoCard>

          <InfoCard icon={Globe} title="Impacto buscado">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Reduccion de vulnerabilidad ante sequias e inundaciones
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Optimizacion del uso del agua para agricultura
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Proteccion de ecosistemas acuaticos
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Fortalecimiento de la seguridad hidrica
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Capacitacion tecnica de estudiantes
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />
                Generacion de datos para politicas publicas
              </li>
            </ul>
          </InfoCard>
        </div>

        <div className="flex flex-wrap gap-3">
          {techStack.map(tech => (
            <span key={tech} className="tag-blue">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
