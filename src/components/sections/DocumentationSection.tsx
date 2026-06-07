import {
  BookOpen,
  ExternalLink,
  FileText,
  FileCode,
  Github,
  Globe,
} from "lucide-react";
import { SectionHeading } from "./shared";

const DOCS_REPO = "https://github.com/ACTECNICAL66/elfindelosni-os.github.io";
const CODE_REPO = "https://github.com/ACTECNICAL66/El-Fin-de-los-Ni-os---web";

export default function DocumentationSection() {
  const resources = [
    {
      title: "Documentación Técnica",
      desc: "Informes, memorias y documentación completa del proyecto en GitHub Pages.",
      icon: BookOpen,
      color: "bg-water-600",
      hoverColor: "hover:bg-water-700",
      url: DOCS_REPO,
    },
    {
      title: "Repositorio de Documentación",
      desc: "Código fuente de la documentación, informes en PDF y recursos técnicos.",
      icon: FileCode,
      color: "bg-eco-600",
      hoverColor: "hover:bg-eco-700",
      url: `${DOCS_REPO}`,
    },
    {
      title: "Código del Proyecto",
      desc: "Repositorio principal con el código fuente de la plataforma web y backend.",
      icon: Github,
      color: "bg-purple-600",
      hoverColor: "hover:bg-purple-700",
      url: CODE_REPO,
    },
    {
      title: "Recursos Open Source",
      desc: "Datos abiertos, metodologías y resultados bajo licencia open source.",
      icon: Globe,
      color: "bg-orange-600",
      hoverColor: "hover:bg-orange-700",
      url: CODE_REPO,
    },
  ];

  return (
    <section className="section-alt py-20" id="documentacion">
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading icon={FileText} title="Documentación y Recursos" />
        <p className="text-white/70 leading-relaxed mb-4 max-w-4xl">
          Toda la documentación técnica, informes, memorias y recursos del
          proyecto están disponibles en nuestro sitio de documentación dedicado.
        </p>
        <p className="text-white/50 text-sm mb-10 max-w-4xl">
          Repositorio de documentación:{" "}
          <a
            href={DOCS_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="text-water-400 hover:text-water-300 underline underline-offset-2"
          >
            {DOCS_REPO}
          </a>
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {resources.map(item => (
            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col p-6 glass-card-light rounded-xl border border-white/10 transition-all hover:scale-[1.02] hover:shadow-lg group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-white group-hover:text-water-400 transition-colors flex items-center gap-2">
                    {item.title}
                    <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-water-400" />
                  </h4>
                  <p className="text-sm text-white/50 mt-1">{item.desc}</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={DOCS_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            <BookOpen className="w-5 h-5" />
            Explorar Documentación Completa
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
