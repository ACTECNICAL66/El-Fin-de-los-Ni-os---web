import { Map, Droplets } from "lucide-react";
import { SectionHeading } from "./shared";
import { asset } from "@/lib/utils";
import { trpc } from "@/providers/trpc";

export default function AreaSection() {
  const { data: cuencasData } = trpc.cuencas.list.useQuery();

  const cuencasDescriptions = [
    "Localizada en la franja de transicion entre el relieve montanoso y las pendientes medias, esta cuenca presenta un patron de drenaje de tipo dendritico y un area de captacion reducida.",
    "Situada en altitudes intermedias, presenta forma alargada con orientacion este-oeste. El relieve circundante es suave, lo que favorece la retencion hidrica.",
    "Ubicada en la zona media del area de estudio, corresponde a una cuenca de extension moderada con escurrimiento predominantemente estacional.",
    "Corresponde a una cuenca alargada ubicada entre areas de pendiente moderada y zonas de acumulacion natural.",
    "De morfologia irregular y con una red de drenaje compleja, esta cuenca se encuentra proxima a un cuerpo de agua de gran tamano.",
    "Ubicada inmediatamente al sur-este de la Cuenca Centro, de tamano reducido y morfologia algo alargada.",
    "Constituye el cuerpo de agua principal de la region, actuando como referencia geografica y nodo hidrico del sistema.",
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Map} title="Area de Estudio" />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          La region de Cordoba, Argentina, representa un caso de estudio ideal
          para analizar los impactos de El Nino y La Nina debido a su
          vulnerabilidad hidrica y la importancia economica de sus actividades
          agricolas.
        </p>

        <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
          <img
            src={asset("/study-area.jpg")}
            alt="Area de Estudio - Region de Cordoba"
            className="w-full h-auto"
          />
          <p className="text-center text-sm text-slate-500 italic py-3 bg-slate-50">
            Figura 1. Area de estudio - Region de Cordoba, Argentina. Zona
            focalizada en las cuencas hidrograficas identificadas.
          </p>
        </div>

        <div className="bg-[#f0f7ff] rounded-xl p-6 border-l-4 border-[#0B3D91] mb-8">
          <h3 className="text-xl font-bold text-[#0B3D91] mb-3 flex items-center gap-2">
            <Droplets className="w-5 h-5" />
            Cuencas Hidrograficas Identificadas
          </h3>
          <p className="text-slate-600 text-sm mb-6">
            Mediante el analisis de datos topograficos y climaticos utilizando
            QGIS, hemos identificado 7 cuencas principales con potencial para la
            implementacion de sistemas de gestion hidrica resilientes:
          </p>

          <div className="space-y-4">
            {(cuencasData ?? []).map((cuenca, index) => (
              <div
                key={cuenca.id}
                className="bg-white rounded-lg p-5 border-l-4 border-[#1A936F] shadow-sm hover:translate-x-1 transition-transform"
              >
                <h4 className="font-bold text-[#0B3D91] mb-2 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[#0B3D91] text-white flex items-center justify-center text-sm font-bold">
                    {cuenca.number}
                  </span>
                  {cuenca.name}
                </h4>
                <p className="text-slate-600 text-sm">
                  {cuencasDescriptions[index] || cuenca.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
