import { Map, Droplets, Info, ExternalLink } from "lucide-react";
import { SectionHeading } from "./shared";
import { asset } from "@/lib/utils";

interface Cuenca {
  codigo: string;
  nombre: string;
  descripcion: string;
  area_km2: number;
}

/** Mismos códigos y nombres que public/data/cuencas.geojson y las series anuales. */
/**
 * IMPORTANTE: estos siete códigos son celdas de la grilla NASA POWER (0,5° x 0,5°),
 * NO cuencas hidrográficas. Las cuencas reales del proyecto están en
 * public/data/cuenca1_real/cuencas_reales.geojson con otros códigos (C1, C2, C6...).
 * Se mantienen los códigos porque las 42 pruebas y las series anuales se indexan por ellos.
 */
const cuencasData: Cuenca[] = [
  { codigo: "CN-O", nombre: "Norte-Oeste", area_km2: 2850.5, descripcion: "Celda POWER de 0,5° en -30,95 / -64,55. No es una cuenca delimitada." },
  { codigo: "CN", nombre: "Norte", area_km2: 3120.3, descripcion: "Celda POWER de 0,5° en -30,95 / -64,05. No es una cuenca delimitada." },
  { codigo: "CC", nombre: "Centro", area_km2: 4200.7, descripcion: "Celda POWER de 0,5° en -31,45 / -64,05. Incluye el área metropolitana." },
  { codigo: "CC-S", nombre: "Centro-Sur", area_km2: 3950.2, descripcion: "Celda POWER de 0,5° en -31,95 / -64,05. No es una cuenca delimitada." },
  { codigo: "CS", nombre: "Sur", area_km2: 3400.1, descripcion: "Celda POWER de 0,5° en -32,45 / -64,05. No es una cuenca delimitada." },
  { codigo: "CE", nombre: "Este", area_km2: 2980.4, descripcion: "Celda POWER de 0,5° en -31,45 / -63,55. Comparte series con CC." },
  { codigo: "CO", nombre: "Oeste", area_km2: 2670.8, descripcion: "Celda POWER de 0,5° en -31,45 / -65,05. Sin tendencias robustas." },
];

/** Las ocho cuencas hidrográficas reales, medidas sobre los GPKG del proyecto. */
const cuencasReales = [
  { codigo: "C6", nombre: "Cuenca 6", area_km2: 22.14, vertices: 2189 },
  { codigo: "C2", nombre: "Cuenca 2 Norte", area_km2: 14.92, vertices: 96 },
  { codigo: "C3", nombre: "Cuenca 3 Centro", area_km2: 8.93, vertices: 40 },
  { codigo: "C1", nombre: "Cuenca 1", area_km2: 8.54, vertices: 1501 },
  { codigo: "C7M", nombre: "Molinos · Cuenca 7-2", area_km2: 7.93, vertices: 1216 },
  { codigo: "CSA", nombre: "Cuenca San Antonio", area_km2: 4.55, vertices: 672 },
  { codigo: "C5", nombre: "Cuenca 5", area_km2: 3.13, vertices: 695 },
  { codigo: "C6M", nombre: "Molinos · Cuenca 6-1", area_km2: 1.20, vertices: 574 },
];

export default function AreaSection() {
  return (
    <section className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Map} title="Área de estudio" />
        <p className="text-white/70 leading-relaxed mb-4 max-w-4xl">
          Córdoba, Argentina. El proyecto delimitó <b>ocho cuencas reales</b> en QGIS
          (C1, C2, C3, C5, C6, San Antonio y dos en Molinos), entre 1,20 y 22,14 km².
          Las series climáticas, en cambio, se consultan en <b>siete celdas de la grilla
          NASA POWER</b> de 0,5° (≈50 × 50 km), porque el satélite no resuelve una cuenca
          de pocos kilómetros.
        </p>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 px-4 py-3 mb-8 max-w-4xl">
          <p className="text-amber-200/90 text-sm leading-relaxed">
            <b>Corrección publicada.</b> Versiones anteriores presentaban los siete puntos
            como si fueran cuencas de 2.670–4.200 km². No lo son: son celdas de grilla y
            ninguno cae dentro de una cuenca del proyecto (la más próxima está a 21 km).
            El análisis estadístico es válido para el punto; extrapolarlo a «la cuenca»
            sería un error.
          </p>
        </div>

        <h3 className="text-white font-semibold text-lg mb-3">Las ocho cuencas reales</h3>
        <div className="overflow-x-auto mb-10">
          <table className="w-full text-sm text-left">
            <thead className="text-white/50 border-b border-white/10">
              <tr>
                <th className="py-2 pr-4 font-medium">Código</th>
                <th className="py-2 pr-4 font-medium">Nombre</th>
                <th className="py-2 pr-4 font-medium">Área</th>
                <th className="py-2 pr-4 font-medium">Vértices</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              {cuencasReales.map((c) => (
                <tr key={c.codigo} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-mono text-orange-300">{c.codigo}</td>
                  <td className="py-2 pr-4">{c.nombre}</td>
                  <td className="py-2 pr-4">{c.area_km2.toFixed(2)} km²</td>
                  <td className="py-2 pr-4 text-white/50">{c.vertices}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-white font-semibold text-lg mb-3">Las siete celdas NASA POWER</h3>
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

          {/* La demo es un HTML estatico aparte: se abre en pestana nueva con <a>,
              no con <Link>, para que el router de la SPA no la intercepte.
              BASE_URL es imprescindible: el sitio vive bajo /El-Fin-de-los-Ni-os---web/ */}
          <div className="mt-10 glass-card rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-eco-500/20">
            <div>
              <p className="text-white font-semibold">Visor 2D de la Cuenca 1</p>
              <p className="text-white/50 text-sm mt-1">
                Siete capas sobre los polígonos reales: relieve, pendiente, orientación,
                drenaje, incendios, llenado del embalse y curvas de los seis diques.
              </p>
            </div>
            <a
              href={`${import.meta.env.BASE_URL}demo/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-eco-500 hover:bg-eco-600 text-white font-semibold transition-colors"
            >
              Abrir el visor
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
