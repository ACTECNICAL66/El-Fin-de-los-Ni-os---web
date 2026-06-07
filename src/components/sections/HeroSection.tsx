import { StatCard } from "./shared";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#0B3D91] to-[#1a237e] pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d="M0,0 Q50,20 100,0 L100,100 Q50,80 0,100 Z" fill="white" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        <span className="inline-block bg-[#0B3D91] text-white px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/20 mb-6">
          NASA Space Apps Challenge 2025
        </span>
        <h1
          className="font-montserrat font-bold text-5xl md:text-6xl text-white mb-4"
          style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.2)" }}
        >
          El Fin de los Ninos
        </h1>
        <p className="text-xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
          Sistema de gestion hidrica resiliente ante los fenomenos de El Nino y
          La Nina en Cordoba, Argentina
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <StatCard number={7} label="Cuencas Analizadas" />
          <StatCard number={100} label="Codigo Abierto" suffix="%" />
          <StatCard number={15} label="Anos de Datos Climaticos" suffix="+" />
        </div>
      </div>
    </section>
  );
}
