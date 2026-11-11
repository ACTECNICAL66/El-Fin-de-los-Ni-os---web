import { Satellite, Leaf, Droplet, CheckCircle2, Clock3 } from "lucide-react";
import { SectionHeading } from "./shared";

const connectedVariables = [
  "Precipitación anual (NASA POWER)",
  "Temperatura media y máxima",
  "Viento a 2 m",
  "Humedad de la zona radicular",
  "Radiación solar",
];

const plannedProducts = [
  {
    name: "NDVI (MODIS)",
    description: "Índice de vegetación derivado de reflectancia roja e infrarroja cercana.",
    icon: Leaf,
  },
  {
    name: "Precipitación GPM IMERG",
    description: "Estimaciones de precipitación satelital con resolución temporal subdiaria.",
    icon: Droplet,
  },
];

export default function SatelliteSection() {
  return (
    <section className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Satellite} title="Datos satelitales: cobertura actual" />
        <p className="text-white/70 leading-relaxed mb-8 max-w-4xl">
          El análisis conectado actualmente utiliza series anuales de NASA POWER para siete cuencas.
          Los productos de vegetación y precipitación GPM están identificados como siguientes pasos;
          esta página no muestra valores simulados como si fueran observaciones satelitales.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-eco-400" /> Series conectadas
            </h3>
            <p className="text-white/55 text-sm mb-4">
              Archivo NASA POWER 2000–2025, consultado en un punto representativo por cuenca.
            </p>
            <ul className="space-y-2">
              {connectedVariables.map((variable) => (
                <li key={variable} className="text-sm text-white/75 flex items-start gap-2">
                  <span className="text-eco-400" aria-hidden="true">•</span>{variable}
                </li>
              ))}
            </ul>
            <p className="text-xs text-white/45 mt-4">
              Es una muestra de celda de grilla, no un promedio espacial de cada polígono.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-amber-300" /> Integraciones pendientes
            </h3>
            <p className="text-white/55 text-sm mb-4">
              Estos productos aún no participan en los resultados ni en las recomendaciones del proyecto.
            </p>
            <div className="space-y-4">
              {plannedProducts.map(({ name, description, icon: Icon }) => (
                <div key={name} className="rounded-lg border border-white/10 p-4">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Icon className="w-4 h-4 text-water-400" /> {name}
                  </h4>
                  <p className="text-sm text-white/60 mt-2">{description}</p>
                  <span className="inline-block mt-3 text-xs text-amber-200/80">Pendiente de conexión y validación</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
