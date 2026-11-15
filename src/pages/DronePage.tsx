import { Link } from "react-router";
import { ExternalLink, Plane, ArrowLeft, Clock3 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const droneUrl = `${import.meta.env.BASE_URL}drone/index.html`;

export default function DronePage() {
  return (
    <div className="min-h-screen bg-nasa-dark">
      <Navigation />

      <main className="pt-28 pb-12">
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-amber-300 text-sm font-medium mb-3">
                <Plane className="w-4 h-4" /> Aplicación futura · concepto de diseño
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                DRONE · Aqua-Guardian AG-01
              </h1>
              <p className="text-white/65 leading-relaxed max-w-3xl mt-3">
                Un visor 3D para explorar la idea de un vehículo anfibio de
                inspección de diques: vistas técnicas, galería y estimación de
                factibilidad de vuelo. Se ubica después del análisis estadístico
                porque hoy es solo diseño digital.
              </p>
            </div>
            <a
              href={droneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Abrir visor completo <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div
            role="note"
            className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/5 px-5 py-4 text-sm text-amber-100/85 leading-relaxed"
          >
            <strong className="text-amber-200">Estado: concepto de diseño.</strong>{" "}
            Las dimensiones y cálculos del visor son parámetros del concepto: no
            acreditan un prototipo construido, vuelos de prueba ni navegación.
            El dron <strong className="text-amber-200">no recoge datos</strong>,
            no está conectado a sensores y no participa en ninguno de los 42
            resultados de tendencia ni en el mapa comparativo.
          </div>

          <div className="mt-5 grid sm:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <Clock3 className="w-4 h-4 text-water-400 mb-2" />
              <p className="text-xs text-white/45 uppercase tracking-wider mb-1">Hoy</p>
              <p className="text-sm text-white/70">Visor 3D y diseño conceptual descargable.</p>
            </div>
            <div className="glass-card p-4">
              <Clock3 className="w-4 h-4 text-amber-300 mb-2" />
              <p className="text-xs text-white/45 uppercase tracking-wider mb-1">Antes de volar</p>
              <p className="text-sm text-white/70">Definir misión, sensores, permisos y validar la electrónica en campo.</p>
            </div>
            <div className="glass-card p-4">
              <Clock3 className="w-4 h-4 text-eco-400 mb-2" />
              <p className="text-xs text-white/45 uppercase tracking-wider mb-1">Después</p>
              <p className="text-sm text-white/70">Recién con datos propios podría integrarse al monitoreo.</p>
            </div>
          </div>

          <div className="mt-5">
            <Link to="/" className="btn-secondary inline-flex">
              <ArrowLeft className="w-4 h-4" /> Volver al análisis y sus datos
            </Link>
          </div>
        </section>

        <section className="max-w-[1600px] mx-auto px-3 sm:px-6" aria-label="Visor interactivo del dron">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl shadow-black/30">
            <iframe
              src={droneUrl}
              title="Visor interactivo del concepto Aqua-Guardian AG-01"
              className="block h-[78vh] min-h-[720px] w-full border-0 bg-white"
              loading="lazy"
              allowFullScreen
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
