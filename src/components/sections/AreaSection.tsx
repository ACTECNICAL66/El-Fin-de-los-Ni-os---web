import { Map, Droplets } from "lucide-react";
import { SectionHeading } from "./shared";
import { asset } from "@/lib/utils";

interface Cuenca {
  id: number;
  number: number;
  name: string;
  description: string;
}

const cuencasData: Cuenca[] = [
  {
    id: 1,
    number: 1,
    name: "Cuenca Norte",
    description:
      "Localizada en la franja de transicion entre el relieve montanoso y las pendientes medias, esta cuenca presenta un patron de drenaje de tipo dendritico y un area de captacion reducida.",
  },
  {
    id: 2,
    number: 2,
    name: "Cuenca Noreste",
    description:
      "Situada en altitudes intermedias, presenta forma alargada con orientacion este-oeste. El relieve circundante es suave, lo que favorece la retencion hidrica.",
  },
  {
    id: 3,
    number: 3,
    name: "Cuenca Centro",
    description:
      "Ubicada en la zona media del area de estudio, corresponde a una cuenca de extension moderada con escurrimiento predominantemente estacional.",
  },
  {
    id: 4,
    number: 4,
    name: "Cuenca Oeste",
    description:
      "Corresponde a una cuenca alargada ubicada entre areas de pendiente moderada y zonas de acumulacion natural.",
  },
  {
    id: 5,
    number: 5,
    name: "Cuenca Sur",
    description:
      "De morfologia irregular y con una red de drenaje compleja, esta cuenca se encuentra proxima a un cuerpo de agua de gran tamano.",
  },
  {
    id: 6,
    number: 6,
    name: "Cuenca Sureste",
    description:
      "Ubicada inmediatamente al sur-este de la Cuenca Centro, de tamano reducido y morfologia algo alargada.",
  },
  {
    id: 7,
    number: 7,
    name: "Embalse Principal",
    description:
      "Constituye el cuerpo de agua principal de la region, actuando como referencia geografica y nodo hidrico del sistema.",
  },
];

export default function AreaSection() {
  return (
    <section className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Map} title="Area de Estudio" />
        <p className="text-white/70 leading-relaxed mb-8 max-w-4xl">
          La region de Cordoba, Argentina, representa un caso de estudio ideal
          para analizar los impactos de El Nino y La Nina debido a su
          vulnerabilidad hidrica y la importancia economica de sus actividades
          agricolas.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="rounded-xl overflow-hidden shadow-lg border border-white/10">
            <img
              src={asset("/study-area.jpg")}
              alt="Area de Estudio - Region de Cordoba"
              className="w-full h-full object-cover"
            />
            <p className="text-center text-sm text-white/50 italic py-3 bg-white/5">
              Figura 1. Area de estudio - Region de Cordoba, Argentina.
            </p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-water-400" />
              Mapa de Cuencas
            </h3>
            <p className="text-sm text-white/60 mb-4">
              Distribucion espacial de las 7 cuencas identificadas mediante
              analisis SIG con datos SRTM de la NASA.
            </p>
            <div className="relative w-full aspect-square rounded-xl bg-nasa-deep/50 border border-white/5 p-4">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <linearGradient
                    id="cuencaGrad1"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(30,184,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(30,184,255,0.1)" />
                  </linearGradient>
                  <linearGradient
                    id="cuencaGrad2"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(34,197,94,0.3)" />
                    <stop offset="100%" stopColor="rgba(34,197,94,0.1)" />
                  </linearGradient>
                </defs>
                <path
                  d="M60 30 Q100 20 140 35 L130 75 Q100 65 70 70 Z"
                  fill="url(#cuencaGrad1)"
                  stroke="rgba(30,184,255,0.5)"
                  strokeWidth="0.8"
                />
                <text
                  x="90"
                  y="48"
                  className="text-[6px] fill-water-400 font-mono"
                >
                  C1
                </text>
                <path
                  d="M140 35 Q170 50 165 85 L130 75 Q150 60 145 45 Z"
                  fill="url(#cuencaGrad2)"
                  stroke="rgba(34,197,94,0.5)"
                  strokeWidth="0.8"
                />
                <text
                  x="150"
                  y="58"
                  className="text-[6px] fill-eco-400 font-mono"
                >
                  C2
                </text>
                <path
                  d="M70 70 Q100 65 130 75 L120 110 Q100 105 75 100 Z"
                  fill="url(#cuencaGrad1)"
                  stroke="rgba(30,184,255,0.5)"
                  strokeWidth="0.8"
                />
                <text
                  x="90"
                  y="85"
                  className="text-[6px] fill-water-400 font-mono"
                >
                  C3
                </text>
                <path
                  d="M40 80 Q70 70 75 100 L65 120 Q45 115 35 105 Z"
                  fill="url(#cuencaGrad2)"
                  stroke="rgba(34,197,94,0.5)"
                  strokeWidth="0.8"
                />
                <text
                  x="48"
                  y="98"
                  className="text-[6px] fill-eco-400 font-mono"
                >
                  C4
                </text>
                <path
                  d="M120 110 Q145 105 155 125 L145 150 Q125 145 115 135 Z"
                  fill="url(#cuencaGrad1)"
                  stroke="rgba(30,184,255,0.5)"
                  strokeWidth="0.8"
                />
                <text
                  x="132"
                  y="125"
                  className="text-[6px] fill-water-400 font-mono"
                >
                  C5
                </text>
                <path
                  d="M65 120 Q85 115 90 140 L78 155 Q60 150 55 140 Z"
                  fill="url(#cuencaGrad2)"
                  stroke="rgba(34,197,94,0.5)"
                  strokeWidth="0.8"
                />
                <text
                  x="72"
                  y="138"
                  className="text-[6px] fill-eco-400 font-mono"
                >
                  C6
                </text>
                <path
                  d="M90 140 Q115 135 120 155 L110 175 Q95 172 85 165 Z"
                  fill="url(#cuencaGrad1)"
                  stroke="rgba(30,184,255,0.5)"
                  strokeWidth="0.8"
                />
                <text
                  x="98"
                  y="158"
                  className="text-[6px] fill-water-400 font-mono"
                >
                  C7
                </text>
                <path
                  d="M20 20 L20 180 L180 180 L180 20 Z"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.5"
                  strokeDasharray="4 3"
                />
              </svg>
              <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 text-[8px] text-white/40">
                  <span className="w-2 h-2 rounded-full bg-water-500/50" />{" "}
                  Cuenca
                </span>
                <span className="flex items-center gap-1 text-[8px] text-white/40">
                  <span className="w-2 h-2 rounded-full bg-eco-500/50" />{" "}
                  Sub-cuenca
                </span>
              </div>
            </div>
            <p className="text-[10px] text-white/30 text-center mt-3 italic">
              Diagrama esquematico de las cuencas identificadas en la region
            </p>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-water-500 mb-8">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-water-400" />
            Cuencas Hidrograficas Identificadas
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Mediante el analisis de datos topograficos y climaticos utilizando
            QGIS, hemos identificado 7 cuencas principales con potencial para la
            implementacion de sistemas de gestion hidrica resilientes:
          </p>

          <div className="space-y-4">
            {cuencasData.map(cuenca => (
              <div
                key={cuenca.id}
                className="glass-card-light rounded-lg p-5 border-l-4 border-eco-500 shadow-sm hover:translate-x-1 transition-transform"
              >
                <h4 className="font-bold text-white mb-2 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-water-500 text-white flex items-center justify-center text-sm font-bold">
                    {cuenca.number}
                  </span>
                  {cuenca.name}
                </h4>
                <p className="text-white/60 text-sm">{cuenca.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
