import { Map, Droplets, Info } from "lucide-react";
import { SectionHeading } from "./shared";
import { asset } from "@/lib/utils";

interface Cuenca {
  codigo: string;
  nombre: string;
  descripcion: string;
  area_km2: number;
}

/** Mismos códigos y nombres que public/data/cuencas.geojson y las series anuales. */
const cuencasData: Cuenca[] = [
  { codigo: "CN-O", nombre: "Norte-Oeste", area_km2: 2850.5, descripcion: "Región de mayor precipitación histórica; punto de grilla en -30,95 / -64,55." },
  { codigo: "CN", nombre: "Norte", area_km2: 3120.3, descripcion: "Zona de transición climática; punto de grilla en -30,95 / -64,05." },
  { codigo: "CC", nombre: "Centro", area_km2: 4200.7, descripcion: "Incluye el área metropolitana; punto de grilla en -31,45 / -64,05." },
  { codigo: "CC-S", nombre: "Centro-Sur", area_km2: 3950.2, descripcion: "Franja intermedia entre pendientes moderadas y zonas de acumulación." },
  { codigo: "CS", nombre: "Sur", area_km2: 3400.1, descripcion: "Punto de grilla en -32,45 / -64,05; caso de estudio de temperatura media." },
  { codigo: "CE", nombre: "Este", area_km2: 2980.4, descripcion: "Comparte varias series idénticas con CC: no debe contarse como réplica independiente." },
  { codigo: "CO", nombre: "Oeste", area_km2: 2670.8, descripcion: "Punto de grilla en -31,45 / -65,05; sin tendencias robustas en este análisis." },
];

export default function AreaSection() {
  return (
    <section className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Map} title="Área de estudio" />
        <p className="text-white/70 leading-relaxed mb-8 max-w-4xl">
          Córdoba, Argentina. El informe delimitó cuencas en QGIS a partir de
          modelos de elevación; la web trabaja con siete puntos representativos
          de esas zonas para consultar series anuales de NASA POWER.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg border border-white/10">
            <img
              src={asset("/study-area.jpg")}
              alt="Área de estudio - región de Córdoba"
              className="w-full h-full object-cover"
            />
            <p className="text-center text-sm text-white/50 italic py-3 bg-white/5">
              Figura 1. Área de estudio, región de Córdoba, Argentina.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-water-400" /> Mapa hipsométrico (QGIS)
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Composición del informe con las cuencas y cuerpos de agua
              analizados en el trabajo de campo y SIG.
            </p>
            <div className="rounded-xl overflow-hidden border border-white/10 bg-nasa-deep/50">
              <img
                src={asset("/mapa-cuencas.png")}
                alt="Mapa hipsométrico con cuencas delimitadas en QGIS"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-5 mb-8 border-l-4 border-amber-300/60 bg-amber-300/[0.04] flex gap-3">
          <Info className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-sm text-white/65 leading-relaxed">
            <strong className="text-white">Dos geometrías distintas.</strong> Los
            polígonos del GeoJSON que usa el mapa comparativo son rectángulos
            esquemáticos de referencia para ubicar los puntos de consulta, no las
            delineaciones hidrológicas del informe. Por eso el mapa dibuja solo
            contornos y marcadores: nunca rellena una cuenca con un valor.
          </p>
        </div>

        <div className="glass-card p-6 border-l-4 border-water-500">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-water-400" />
            Siete puntos de cuenca analizados
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Cada fila corresponde a una consulta de la API mensual de punto de
            NASA POWER. Las áreas son las del GeoJSON de referencia.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {cuencasData.map(cuenca => (
              <div
                key={cuenca.codigo}
                className="glass-card-light rounded-lg p-5 border-l-4 border-eco-500 shadow-sm hover:translate-x-1 transition-transform"
              >
                <h4 className="font-bold text-white mb-2 flex items-center gap-3 flex-wrap">
                  <span className="px-2 py-1 rounded-md bg-water-500/15 border border-water-400/25 text-water-300 font-mono text-xs">
                    {cuenca.codigo}
                  </span>
                  Cuenca {cuenca.nombre}
                  <span className="text-xs font-normal text-white/40 ml-auto">{cuenca.area_km2.toLocaleString("es-AR")} km²</span>
                </h4>
                <p className="text-white/60 text-sm">{cuenca.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
