import { ExternalLink, Plane } from "lucide-react";
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
              <div className="flex items-center gap-2 text-water-300 text-sm font-medium mb-3">
                <Plane className="w-4 h-4" /> Diseño conceptual
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white">
                DRONE · Aqua-Guardian AG-01
              </h1>
              <p className="text-white/65 leading-relaxed max-w-3xl mt-3">
                Explora el concepto de vehículo anfibio para monitoreo de diques:
                visor 3D interactivo, vistas técnicas, galería y estimación de
                factibilidad de vuelo.
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
            className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3 text-sm text-amber-100/80"
          >
            Es una propuesta de diseño digital. Las dimensiones y cálculos que
            aparecen en el visor son parámetros del concepto y no acreditan un
            prototipo construido ni pruebas de vuelo o navegación.
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
