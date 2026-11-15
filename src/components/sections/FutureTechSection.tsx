import { Link } from "react-router";
import { Plane, Satellite, RadioTower, FlaskConical, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./shared";

const pasos = [
  {
    icon: Satellite,
    titulo: "NDVI (MODIS) y GPM IMERG",
    texto: "Siguen en el catálogo como integraciones pendientes. No participan en los 42 resultados ni en el mapa.",
    estado: "Pendiente de conexión",
  },
  {
    icon: RadioTower,
    titulo: "Red de estaciones locales",
    texto: "La serie real del Observatorio Córdoba (288 meses) ya valida la dirección de la señal. El siguiente paso es ampliar la red con pluviómetros calibrados y registro continuo.",
    estado: "Serie observada integrada",
  },
  {
    icon: FlaskConical,
    titulo: "Piloto de campo 6–12 meses",
    texto: "Calibración trimestral, gabinete IP65, watchdog y alternativa LoRaWAN/4G para cortes de conectividad.",
    estado: "Según plan de riesgos del informe",
  },
];

export default function FutureTechSection() {
  return (
    <section id="aplicaciones-futuras" className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Plane} title="Después del análisis: aplicaciones futuras" />
        <p className="text-white/65 leading-relaxed mb-8 max-w-4xl">
          Primero vienen los datos y sus límites; recién después las
          herramientas que podrían construirse sobre ellos. Esta sección separa
          lo que ya se analizó de lo que hoy es diseño o planificación.
        </p>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-8">
          <div className="glass-card p-6 border-amber-300/20 bg-amber-300/[0.04] flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="tag-orange inline-block mb-3">Concepto de diseño · aplicación futura</span>
                <h3 className="font-display text-2xl font-bold text-white">DRONE · Aqua-Guardian AG-01</h3>
              </div>
              <Plane className="w-8 h-8 text-amber-300 shrink-0" />
            </div>
            <p className="text-sm text-white/65 leading-relaxed mb-4">
              Un visor 3D para explorar la idea de un vehículo anfibio de
              inspección de diques: dimensiones, vistas técnicas y estimaciones
              de factibilidad. <strong className="text-white">Hoy no recoge
              datos, no vuela y no alimenta ningún resultado del análisis.</strong>{" "}
              Es un concepto de diseño digital, no un prototipo construido ni
              ensayado.
            </p>
            <p className="text-xs text-white/45 leading-relaxed mb-6">
              Se presenta aquí, al final del recorrido, para que no se confunda
              con las series NASA POWER ni con el prototipo electrónico de
              laboratorio.
            </p>
            <Link to="/drone" className="btn-secondary inline-flex self-start">
              Explorar el concepto 3D <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {pasos.map(paso => (
              <div key={paso.titulo} className="glass-card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <paso.icon className="w-5 h-5 text-water-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-display font-semibold text-white">{paso.titulo}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/45">{paso.estado}</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{paso.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/55 leading-relaxed">
          <strong className="text-white/75">Orden de la entrega 2026:</strong> problema y área →
          datos satelitales → explorador de tendencias → mapa comparativo →
          respaldo estadístico → cuencas 2D y atribución ENSO → caso concreto →
          encuadre del desafío → electrónica y monitoreo → aplicaciones futuras.
          Las propuestas nunca se presentan como observaciones ya medidas.
        </div>
      </div>
    </section>
  );
}
