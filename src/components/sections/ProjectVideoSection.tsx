import { ArrowDown, ExternalLink, Play, Youtube } from "lucide-react";

const VIDEO_ID = "Eub4_QAr4Jg";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0`;

export default function ProjectVideoSection() {
  return (
    <section
      id="video-proyecto"
      className="relative overflow-hidden border-y border-white/[0.07] bg-[#07111f] py-16 md:py-20 scroll-mt-24"
      aria-labelledby="project-video-title"
    >
      <div className="pointer-events-none absolute -left-28 top-8 h-72 w-72 rounded-full bg-water-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-eco-500/[0.08] blur-[100px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-9 px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-12">
        <div className="group relative overflow-hidden rounded-2xl border border-water-300/20 bg-[#030811] p-1 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-water-300/20 via-transparent to-eco-300/10 opacity-70" />
          <div className="relative aspect-video overflow-hidden rounded-xl bg-[#030811]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={EMBED_URL}
              title="Video del proyecto El Fin de los Niños"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#07111f]/85 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-white/70 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-water-300 shadow-[0_0_10px_rgba(72,214,255,0.8)]" />
            Video del proyecto
          </div>
        </div>

        <div className="max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-water-300/20 bg-water-300/[0.07] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.16em] text-water-200">
            <Youtube className="h-4 w-4" /> Presentación audiovisual
          </div>
          <h2 id="project-video-title" className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
            Conocé el proyecto <span className="gradient-text">en video</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/65 md:text-base">
            Una presentación en video para acompañar los datos, el análisis y las propuestas de monitoreo de cuencas de Córdoba.
            Después, recorré la web para explorar los métodos, resultados y límites del trabajo con más detalle.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#detective"
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <ArrowDown className="h-4 w-4" /> Explorar el análisis
            </a>
            <a
              href={VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              <Play className="h-4 w-4" /> Abrir en YouTube <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-white/40">
            El reproductor se carga desde YouTube al acercarte a esta sección. Si no aparece, podés abrir el video directamente.
          </p>
        </div>
      </div>
    </section>
  );
}
