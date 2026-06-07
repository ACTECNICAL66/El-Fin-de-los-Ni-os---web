import { Droplets, Github, Mail, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#2C3E50] to-[#1a1a1a] text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-6 h-6 text-[#1A936F]" />
              <h3 className="font-montserrat font-bold text-xl">El Fin de los Ninos</h3>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Proyecto desarrollado para el NASA Space Apps Challenge 2025
            </p>
            <p className="text-white/70 text-sm mt-2">
              Instituto Jose Antonio Balseiro (IPET N 66) - Cordoba Capital, Argentina
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-white/90">Enlaces</h4>
            <div className="space-y-2">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                <Github className="w-4 h-4" /> GitHub
              </a>
              <a href="https://earthdata.nasa.gov" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                <ExternalLink className="w-4 h-4" /> NASA Earthdata
              </a>
              <a href="mailto:contacto@elfindelosninos.org"
                className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
                <Mail className="w-4 h-4" /> Contacto
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 text-white/90">Datos Abiertos</h4>
            <p className="text-white/60 text-sm leading-relaxed">
              Todos los datos y metodologias son de acceso abierto bajo licencia Creative Commons Attribution 4.0
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#1A936F] animate-pulse" />
              <span className="text-xs text-white/80">Sistema Activo</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-xs"> 2025 El Fin de los Ninos. Todos los derechos reservados.</p>
          <p className="text-white/50 text-xs">Hecho con amor en Cordoba, Argentina</p>
        </div>
      </div>
    </footer>
  )
}
