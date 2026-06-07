import { useState, type ElementType } from "react";
import {
  AlertTriangle,
  Users,
  Thermometer,
  Activity,
  Shield,
  Search,
  Droplets,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { SectionHeading } from "./shared";

interface ProblemItem {
  question: string;
  answer: string;
  icon: ElementType;
  actionable: boolean;
  actionDescription?: string;
}

const problemData: ProblemItem[] = [
  {
    question: "A quienes afecta?",
    answer:
      "El fenomeno ENSO afecta a toda la poblacion de la provincia de Cordoba, con impacto desproporcionado en agricultores, comunidades rurales, poblacion vulnerable y sectores productivos dependientes del recurso hidrico como la agricultura, ganaderia, industria y generacion de energia hidroelectrica.",
    icon: Users,
    actionable: false,
  },
  {
    question: "Cuales son las causas del problema?",
    answer:
      "Las causas principales son el calentamiento (El Nino) o enfriamiento (La Nina) anomalo de las temperaturas superficiales del Oceano Pacifico ecuatorial, combinado con cambios en los patrones de vientos alisios y la alteracion de la circulacion atmosferica global (Celula de Walker). Esto modifica la distribucion de humedad y precipitaciones a escala planetaria.",
    icon: Thermometer,
    actionable: false,
  },
  {
    question: "Por que se produce?",
    answer:
      "Se produce por la interaccion oceano-atmosfera en el Pacifico tropical. En condiciones normales, los vientos alisios empujan agua calida hacia Asia. Durante El Nino, estos vientos se debilitan, permitiendo que el agua calida se desplace hacia America. Durante La Nina, los vientos se intensifican, generando condiciones opuestas. Este es un fenomeno climatico natural y ciclico.",
    icon: Activity,
    actionable: false,
  },
  {
    question: "Pueden actuar sobre la causa?",
    answer:
      "No es posible actuar directamente sobre las causas del ENSO, ya que son fenomenos climaticos naturales a escala planetaria, producto de la dinamica acoplada oceano-atmosfera. Sin embargo, se puede actuar indirectamente mitigando el cambio climatico antropogenico que podria estar intensificando estos fenomenos, reduciendo emisiones de gases de efecto invernadero.",
    icon: Shield,
    actionable: true,
    actionDescription:
      "Reducir emisiones de GEI, cumplir acuerdos climaticos internacionales, promover energias renovables.",
  },
  {
    question: "Cuales son las consecuencias?",
    answer:
      "Las consecuencias incluyen: inundaciones y desbordes de rios durante El Nino; sequias prolongadas y deficit hidrico durante La Nina; perdidas de cosechas y produccion agricola; danos a infraestructura vial y urbana; crisis en el suministro de agua potable; afectacion a ecosistemas acuaticos y terrestres; perdidas economicas multimillonarias; desplazamiento de poblaciones; aumento de enfermedades relacionadas con el agua.",
    icon: AlertTriangle,
    actionable: false,
  },
  {
    question: "Que efectos produce?",
    answer:
      "Efectos directos: variacion de precipitaciones (El Nino: aumento del 20-40%, La Nina: reduccion de hasta el 30%), cambios en temperatura media, alteracion de caudales de rios y arroyos, modificacion de niveles freaticos. Efectos indirectos: inseguridad alimentaria, migracion rural-urbana, conflictos por uso del agua, perdida de biodiversidad, aumento de riesgo de incendios forestales durante La Nina.",
    icon: Droplets,
    actionable: false,
  },
  {
    question: "Pueden actuar sobre las consecuencias?",
    answer:
      "Si, es posible y necesario actuar sobre las consecuencias mediante: sistemas de alerta temprana con datos satelitales NASA, construccion de micro-represas distribuidas, gestion adaptativa de embalses, agricultura resiliente (cultivos resistentes, riego eficiente), monitoreo en tiempo real con sensores IoT (ESP32), planificacion territorial basada en datos, protocolos de respuesta ante emergencias, y educacion comunitaria para la resiliencia hidrica.",
    icon: Search,
    actionable: true,
    actionDescription:
      "Implementar micro-represas, sensores IoT, alerta temprana, agricultura resiliente, educacion comunitaria.",
  },
];

export default function ProblemSection() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll ? problemData : problemData.slice(0, 3);

  return (
    <section className="bg-white py-20" id="analisis-problema">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          icon={Activity}
          title="Analisis del Problema: El Nino y La Nina en Cordoba"
        />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          Un analisis integral del fenomeno ENSO y su impacto en la provincia de
          Cordoba, abordando causas, consecuencias y estrategias de accion para
          construir resiliencia hidrica.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {visibleItems.map((item, index) => {
            const globalIndex = showAll ? index : index;
            const isExpanded = expandedIndex === globalIndex;
            const Icon = item.icon;

            return (
              <div
                key={item.question}
                className={`bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  isExpanded
                    ? "border-[#0B3D91] shadow-lg -translate-y-1"
                    : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                }`}
                onClick={() =>
                  setExpandedIndex(isExpanded ? null : globalIndex)
                }
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.actionable ? "bg-green-100" : "bg-blue-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${item.actionable ? "text-green-600" : "text-[#0B3D91]"}`}
                      />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {item.question}
                    </h3>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-slate-600 text-sm leading-relaxed mt-2">
                      {item.answer}
                    </p>

                    {item.actionable && item.actionDescription && (
                      <div className="mt-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-sm text-green-800">
                            Acciones posibles:
                          </span>
                        </div>
                        <p className="text-green-700 text-sm">
                          {item.actionDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  {!isExpanded && (
                    <p className="text-slate-400 text-xs mt-1">
                      Click para ver detalle
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 bg-[#0B3D91] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#082567] transition-all shadow-md"
          >
            {showAll ? (
              <>
                <ToggleLeft className="w-5 h-5" /> Mostrar menos
              </>
            ) : (
              <>
                <ToggleRight className="w-5 h-5" /> Ver analisis completo (
                {problemData.length} preguntas)
              </>
            )}
          </button>
        </div>

        <div className="mt-10 bg-gradient-to-br from-[#F5F7FA] to-white rounded-2xl p-8 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">
            Resumen del Analisis
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border-l-4 border-[#E74C3C] shadow-sm">
              <h4 className="font-bold text-[#E74C3C] mb-2">
                Sobre las causas
              </h4>
              <p className="text-sm text-slate-600">
                El ENSO es un fenomeno natural e inevitable. No podemos evitar
                que ocurra, pero podemos predecirlo y prepararnos.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border-l-4 border-[#1A936F] shadow-sm">
              <h4 className="font-bold text-[#1A936F] mb-2">
                Sobre las consecuencias
              </h4>
              <p className="text-sm text-slate-600">
                Ahi reside nuestra capacidad de accion: mitigar impactos
                mediante tecnologia, planificacion y gestion adaptativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
