import { Link } from "react-router";
import { ArrowLeft, ExternalLink, FileCode2, Layers3, ShieldAlert } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import ControlPanelDemo from "@/components/ControlPanelDemo";
import { asset } from "@/lib/utils";

const originalUrl = asset("/panel/PaneldeControlV3.html");

export default function PanelPage() {
  return (
    <div className="min-h-screen bg-nasa-dark">
      <Navigation />

      <main className="pt-28 pb-16">
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-water-300 text-sm font-medium mb-3">
                <Layers3 className="w-4 h-4" /> Panel de control · versión 2026
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-white">
                Del panel V3 al V4 integrado
              </h1>
              <p className="text-white/65 leading-relaxed max-w-3xl mt-4">
                Tomamos el <code className="text-water-300">PaneldeControlV3.html</code> que
                aportó el equipo y lo reconstruimos con el sistema visual de la
                web: mismos sensores, compuerta, seguidor solar, indicadores de
                calidad y volumen, pero sin dependencias externas y con la
                simulación declarada desde el primer párrafo.
              </p>
            </div>
            <Link to="/monitoreo" className="btn-secondary inline-flex shrink-0">
              <ArrowLeft className="w-4 h-4" /> Ver electrónica y firmware
            </Link>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <div className="glass-card p-4 flex gap-3">
              <FileCode2 className="w-4 h-4 text-water-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/45 uppercase tracking-wider mb-1">Original conservado</p>
                <p className="text-sm text-white/70">El HTML del equipo queda disponible como referencia y comparación.</p>
              </div>
            </div>
            <div className="glass-card p-4 flex gap-3">
              <Layers3 className="w-4 h-4 text-eco-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/45 uppercase tracking-wider mb-1">Diseño unificado</p>
                <p className="text-sm text-white/70">Tailwind, lucide-react y tarjetas de vidrio; sin FontAwesome CDN.</p>
              </div>
            </div>
            <div className="glass-card p-4 flex gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-white/45 uppercase tracking-wider mb-1">Sin sobreafirmaciones</p>
                <p className="text-sm text-white/70">Simulación, error -999.0 y límites visibles; no es telemetría real.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir V3 original (archivo del equipo)
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-water-500/10 border border-water-400/25 text-water-200 hover:bg-water-500/20 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al análisis de tendencias
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6">
          <ControlPanelDemo />
        </section>

        <section className="max-w-7xl mx-auto px-6 mt-8">
          <div className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold text-white mb-3">Qué cambió respecto del V3</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-white/40 border-b border-white/10">
                    <th className="py-2 pr-4">Aspecto</th>
                    <th className="py-2 pr-4">V3 aportado</th>
                    <th className="py-2">V4 integrado (2026)</th>
                  </tr>
                </thead>
                <tbody className="text-white/65">
                  <tr className="border-b border-white/[0.06]"><td className="py-2.5 pr-4">Estilo</td><td className="py-2.5 pr-4">Segoe UI, CSS propio, FontAwesome por CDN</td><td className="py-2.5">Paleta NASA/agua, glass-card, lucide-react, sin CDN</td></tr>
                  <tr className="border-b border-white/[0.06]"><td className="py-2.5 pr-4">Datos</td><td className="py-2.5 pr-4">Comentario «datos realistas» y simulación cada 3 s</td><td className="py-2.5">Aviso permanente «SIMULACIÓN · sin hardware conectado»</td></tr>
                  <tr className="border-b border-white/[0.06]"><td className="py-2.5 pr-4">Errores</td><td className="py-2.5 pr-4">Barra de error por sensor</td><td className="py-2.5">Interruptor explícito para reproducir <code className="text-water-300">-999.0</code> del DS18B20</td></tr>
                  <tr className="border-b border-white/[0.06]"><td className="py-2.5 pr-4">Contexto</td><td className="py-2.5 pr-4">Badge «NASA Space Apps Challenge» sin año</td><td className="py-2.5">2026, ODS 6, relación con el informe y separación del análisis estadístico</td></tr>
                  <tr><td className="py-2.5 pr-4">Control</td><td className="py-2.5 pr-4">Compuerta, ejes X/Z, orientación</td><td className="py-2.5">Igual, más pausa, reinicio, trazabilidad y diseño responsive</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}
