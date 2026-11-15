import { Droplets, Target, Satellite, Globe, ChevronRight } from "lucide-react";
import { SectionHeading, InfoCard } from "./shared";

export default function AboutSection() {
  const techStack = [
    "React",
    "TypeScript",
    "Vite",
    "Chart.js",
    "SVG",
    "Python",
    "NASA POWER",
    "GitHub Pages",
  ];

  return (
    <section className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Droplets} title="Acerca del proyecto" />
        <p className="text-white/70 leading-relaxed mb-4 max-w-4xl">
          "El Fin de los Niños" es un trabajo de estudiantes del Instituto
          José Antonio Balseiro (IPET N°66) de Córdoba Capital sobre la
          vulnerabilidad hídrica de la provincia. Para el desafío 2026{" "}
          <em className="text-water-300 not-italic font-medium">Be an Earth System Trend Detective!</em>{" "}
          la entrega se centra en una pregunta verificable: ¿qué tendencias
          muestran las series anuales disponibles en siete puntos de cuenca,
          dónde, cuánto y con cuánto respaldo estadístico?
        </p>
        <p className="text-white/70 leading-relaxed mb-8 max-w-4xl">
          La web publica el análisis, sus correcciones y sus límites. La
          electrónica, la aplicación de monitoreo y el dron se presentan después,
          como prototipo de laboratorio y aplicaciones futuras; no como fuentes
          de datos ya medidas.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <InfoCard icon={Target} title="Qué se analiza">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Series anuales 2000–2025 de NASA POWER en 7 puntos</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />6 variables: lluvia, temperatura media y máxima, viento, humedad del suelo y radiación</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />42 pruebas de Mann–Kendall con pendiente de Sen</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Corrección por autocorrelación y comparaciones múltiples</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Mapa comparativo de puntos y matriz cuenca × variable</li>
            </ul>
          </InfoCard>

          <InfoCard icon={Satellite} title="Fuentes y estado">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />NASA POWER Monthly API, archivo descargado el 11/11/2026</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />1.092 observaciones anuales documentadas</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />Cada punto es una celda de grilla, no un promedio de cuenca</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />MODIS NDVI y GPM IMERG: integración pendiente</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />Estación real del Observatorio Córdoba: 288 meses y contraste publicado</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />ONI / Niño 3.4 de NOAA CPC: 504 pruebas y atribución por fase</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-eco-400 flex-shrink-0" />Cuencas con QGIS, DEM, EVA y visor 2D inventariados</li>
            </ul>
          </InfoCard>

          <InfoCard icon={Globe} title="Qué se propone a futuro">
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Ampliar la red local y calibrar sensores de campo</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Prototipo ESP32 y panel de monitoreo (maqueta)</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Micro-represas distribuidas, sujetas a estudios de campo</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Dron anfibio como concepto de diseño</li>
              <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-water-400 flex-shrink-0" />Datos abiertos y scripts reproducibles</li>
            </ul>
          </InfoCard>
        </div>

        <div className="flex flex-wrap gap-3">
          {techStack.map(tech => (
            <span key={tech} className="tag-blue">{tech}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
