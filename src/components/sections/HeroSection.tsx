import { MapPinned, Sigma, Target, PlayCircle } from "lucide-react";
import { asset } from "@/lib/utils";
import { StatCard } from "./shared";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={asset("/hero-bg.jpg")}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-nasa-dark/80 via-nasa-dark/60 to-nasa-dark/90" />
      </div>
      <div className="absolute inset-0 particles-bg" />
      <div className="absolute inset-0 grid-overlay" />
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-water-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-eco-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center pt-32 pb-20">
        <div className="mb-5 flex flex-col items-center">
          <span className="inline-block tag-blue mb-3">
            Ciencia de datos para la gestión del agua
          </span>
          <div className="flex max-w-4xl flex-wrap justify-center gap-2" aria-label="Ejes y ámbitos de interés del proyecto">
            {["ONIET", "Feria de Ciencias", "Desarrollo sostenible", "Ideas innovadoras", "CONICET"].map(label => (
              <span
                key={label}
                className="rounded-full border border-water-300/20 bg-[#0a1a2b]/75 px-3 py-1.5 text-[10px] font-medium tracking-wide text-water-100/85 shadow-sm shadow-black/20 sm:text-xs"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.18em] text-water-300/70 mb-5">
          Investigación climática · cuencas · desarrollo sostenible
        </p>
        <h1 className="font-display font-bold text-5xl md:text-7xl text-white mb-4 leading-tight">
          El Fin de los <span className="gradient-text">Niños</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto mb-8 leading-relaxed">
          Análisis de tendencias climáticas, respaldo estadístico y una
          propuesta de monitoreo hídrico para Córdoba, Argentina
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <a href="#video-proyecto" className="btn-primary inline-flex">
            <PlayCircle className="w-4 h-4" /> Ver video del proyecto
          </a>
          <a href="#mapa-comparativo" className="btn-secondary inline-flex">
            <MapPinned className="w-4 h-4" /> Ver mapa comparativo
          </a>
          <a href="#respaldo-estadistico" className="btn-secondary inline-flex">
            <Sigma className="w-4 h-4" /> Respaldo estadístico
          </a>
          <a href="#encuadre-desafio" className="btn-secondary inline-flex">
            <Target className="w-4 h-4" /> Cómo cumple el desafío
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-6 items-center">
          <div className="glass-card p-3 min-w-[180px] hover-lift group">
            <img
              src={asset("/mapa-cuencas.png")}
              alt="Mapa hipsométrico de las cuencas de estudio"
              className="w-full h-auto rounded-lg"
            />
            <span className="text-xs font-medium uppercase tracking-wider text-white/50 mt-2 block text-center">
              Cuencas del estudio (QGIS)
            </span>
          </div>
          <StatCard number={100} label="Código abierto" suffix="%" />
          <StatCard number={26} label="Años de serie anual" suffix="" />
        </div>
        <p className="text-xs text-white/35 mt-5">
          Series anuales NASA POWER 2000–2025 · 7 puntos representativos · 42 pruebas con correcciones publicadas
        </p>
      </div>
    </section>
  );
}
