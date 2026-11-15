import { Link } from "react-router";
import { Shield, ArrowUpRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="bg-gradient-to-r from-water-700 to-nasa-deep py-16 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Seguí explorando la entrega 2026
        </h2>
        <p className="text-white/60 mb-8 max-w-2xl mx-auto">
          Revisá cómo se responde cada pregunta del desafío, probá el panel de
          control simulado o consultá el informe completo antes de decidir.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/#encuadre-desafio" className="btn-primary inline-flex">
            <Shield className="w-5 h-5" /> Encuadre del desafío
          </Link>
          <Link to="/#enso" className="btn-secondary inline-flex">
            Atribución ENSO <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link to="/panel" className="btn-secondary inline-flex">
            Panel V4 (demo) <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link to="/monitoreo" className="btn-secondary inline-flex">
            Electrónica y monitoreo <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
