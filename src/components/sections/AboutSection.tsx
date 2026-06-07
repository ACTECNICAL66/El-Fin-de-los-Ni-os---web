import { Droplets, Target, Satellite, Globe, ChevronRight } from "lucide-react";
import { SectionHeading, InfoCard } from "./shared";

export default function AboutSection() {
  const techStack = [
    "C++",
    "ESP32",
    "Google Earth",
    "QGIS",
    "Python",
    "JavaScript",
    "NASA WorldWind",
    "Sensores IoT",
    "API REST",
    "GitHub",
    "Arduino IDE",
    "Global Mapper",
    "Proteus",
  ];

  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Droplets} title="Acerca del Proyecto" />
        <p className="text-slate-600 leading-relaxed mb-4 max-w-4xl">
          "El Fin de los Ninos" es una solucion innovadora desarrollada por
          estudiantes del Instituto Jose Antonio Balseiro (IPET N 66) de Cordoba
          Capital, que aborda la vulnerabilidad hidrica de la provincia de
          Cordoba ante los fenomenos de El Nino y La Nina.
        </p>
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          El proyecto integra datos climaticos de la NASA con tecnologias de
          vanguardia como <strong>C++</strong> para programacion de sistemas
          embebidos, <strong>ESP32</strong> para monitoreo en tiempo real,{" "}
          <strong>Google Earth</strong> para visualizacion geoespacial, y{" "}
          <strong>QGIS</strong> para analisis topografico y delimitacion de
          cuencas hidrograficas.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <InfoCard
            icon={Target}
            title="Objetivos Principales"
            accent="#FC3D21"
          >
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />
                Analizar el impacto de El Nino/La Nina en recursos hidricos
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />
                Identificar ubicaciones optimas para micro-represas
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />
                Desarrollar estrategias de gestion adaptativa al clima
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />
                Crear modelo predictivo para eventos extremos
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />
                Implementar sistema de monitoreo con sensores ESP32
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#FC3D21] flex-shrink-0" />
                Desarrollar interfaz web para visualizacion de datos
              </li>
            </ul>
          </InfoCard>

          <InfoCard
            icon={Satellite}
            title="Datos NASA Utilizados"
            accent="#1A936F"
          >
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />
                Datos de temperatura superficial del mar (TSM)
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />
                Indice de Oscilacion del Sur (SOI)
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />
                Datos de precipitacion TRMM y GPM
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />
                Modelos climaticos para proyecciones
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />
                Imagenes satelitales multiespectrales
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#1A936F] flex-shrink-0" />
                Modelos Digitales de Elevacion (MDE)
              </li>
            </ul>
          </InfoCard>

          <InfoCard icon={Globe} title="Impacto Regional" accent="#0B3D91">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />
                Reduccion de vulnerabilidad ante sequias e inundaciones
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />
                Optimizacion del uso del agua para agricultura
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />
                Proteccion de ecosistemas acuaticos
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />
                Fortalecimiento de la seguridad hidrica
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />
                Capacitacion tecnica de estudiantes
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-[#0B3D91] flex-shrink-0" />
                Generacion de datos para politicas publicas
              </li>
            </ul>
          </InfoCard>
        </div>

        <div className="flex flex-wrap gap-3">
          {techStack.map(tech => (
            <span
              key={tech}
              className="bg-[#E1F5FE] text-[#0B3D91] px-4 py-1.5 rounded-full text-sm font-semibold"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
