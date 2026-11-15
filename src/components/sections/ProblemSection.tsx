import { type ElementType } from "react";
import {
  AlertTriangle,
  Users,
  Thermometer,
  Activity,
  Shield,
  Search,
  Droplets,
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
      "El fenómeno ENSO afecta a toda la poblacion de la provincia de Córdoba, con impacto desproporcionado en agricultores, comunidades rurales, poblacion vulnerable y sectores productivos dependientes del recurso hídrico como la agricultura, ganaderia, industria y generación de energía hidroeléctrica.",
    icon: Users,
    actionable: false,
  },
  {
    question: "Cuales son las causas del problema?",
    answer:
      "Las causas principales son el calentamiento (El Niño) o enfriamiento (La Niña) anomalo de las temperaturas superficiales del Océano Pacífico ecuatorial, combinado con cambios en los patrones de vientos alisios y la alteracion de la circulacion atmosferica global (Célula de Walker). Esto modifica la distribución de humedad y precipitaciones a escala planetaria.",
    icon: Thermometer,
    actionable: false,
  },
  {
    question: "Por que se produce?",
    answer:
      "Se produce por la interacción oceano-atmósfera en el Pacífico tropical. En condiciones normales, los vientos alisios empujan agua calida hacia Asia. Durante El Niño, estos vientos se debilitan, permitiendo que el agua calida se desplace hacia America. Durante La Niña, los vientos se intensifican, generando condiciones opuestas. Este es un fenómeno climatico natural y ciclico.",
    icon: Activity,
    actionable: false,
  },
  {
    question: "Pueden actuar sobre la causa?",
    answer:
      "No es posible actuar directamente sobre las causas del ENSO, ya que son fenómenos climáticos naturales a escala planetaria, producto de la dinámica acoplada oceano-atmósfera. Sin embargo, se puede actuar indirectamente mitigando el cambio climatico antropogenico que podria estar intensificando estos fenómenos, reduciendo emisiones de gases de efecto invernadero.",
    icon: Shield,
    actionable: true,
    actionDescription:
      "Reducir emisiones de GEI, cumplir acuerdos climáticos internacionales, promover energías renovables.",
  },
  {
    question: "Cuales son las consecuencias?",
    answer:
      "Las consecuencias incluyen: inundaciones y desbordes de rios durante El Niño; sequias prolongadas y deficit hídrico durante La Niña; pérdidas de cosechas y producción agrícola; daños a infraestructura vial y urbana; crisis en el suministro de agua potable; afectacion a ecosistemas acuáticos y terrestres; pérdidas economicas multimillonarias; desplazamiento de poblaciones; aumento de enfermedades relacionadas con el agua.",
    icon: AlertTriangle,
    actionable: false,
  },
  {
    question: "Que efectos produce?",
    answer:
      "Efectos directos descritos en la bibliografía: variación de precipitaciones entre fases húmedas y secas, cambios en temperatura media y en caudales. Este sitio no estima porcentajes propios ni los contrasta con las 42 pruebas. Efectos indirectos: inseguridad alimentaria, migración rural-urbana, conflictos por uso del agua y mayor riesgo de incendios en períodos secos.",
    icon: Droplets,
    actionable: false,
  },
  {
    question: "Pueden actuar sobre las consecuencias?",
    answer:
      "Si, es posible y necesario actuar sobre las consecuencias mediante: sistemas de alerta temprana con datos satelitales NASA, construccion de micro-represas distribuidas, gestión adaptativa de embalses, agricultura resiliente (cultivos resistentes, riego eficiente), monitoreo en tiempo real con sensores IoT (ESP32), planificacion territorial basada en datos, protocolos de respuesta ante emergencias, y educacion comunitaria para la resiliencia hídrica.",
    icon: Search,
    actionable: true,
    actionDescription:
      "Implementar micro-represas, sensores IoT, alerta temprana, agricultura resiliente, educacion comunitaria.",
  },
];

export default function ProblemSection() {
  return (
    <section className="section-dark py-20" id="analisis-problema">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          icon={Activity}
          title="Análisis del Problema: El Niño y La Niña en Córdoba"
        />
        <p className="text-white/70 leading-relaxed mb-8 max-w-4xl">
          Un análisis integral del fenómeno ENSO y su impacto en la provincia de
          Córdoba, abordando causas, consecuencias y estrategias de acción para
          construir resiliencia hídrica.
        </p>

        <div className="space-y-6 mb-10">
          {problemData.map((item, index) => {
            const Icon = item.icon;
            const isLeft = index % 2 === 0;

            return (
              <div
                key={item.question}
                className={`flex flex-col md:flex-row gap-6 p-6 rounded-xl border border-white/10 transition-all glass-card-light ${
                  item.actionable ? "border-eco-500/30" : ""
                }`}
              >
                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2 md:min-w-[200px]">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.actionable ? "bg-eco-500/20" : "bg-water-500/20"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${item.actionable ? "text-eco-400" : "text-water-400"}`}
                    />
                  </div>
                  <h3 className="font-bold text-white text-lg md:text-center md:w-full">
                    {item.question}
                  </h3>
                </div>
                <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                  <p className="text-white/70 text-sm leading-relaxed">
                    {item.answer}
                  </p>
                  {item.actionable && item.actionDescription && (
                    <div className="mt-4 bg-eco-500/10 border-l-4 border-eco-500 rounded-r-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-eco-400" />
                        <span className="font-semibold text-sm text-eco-400">
                          Acciones posibles:
                        </span>
                      </div>
                      <p className="text-eco-300/80 text-sm">
                        {item.actionDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-alt rounded-2xl p-8 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            Resumen del Análisis
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="glass-card-light rounded-xl p-5 border-l-4 border-red-500">
              <h4 className="font-bold text-red-400 mb-2">Sobre las causas</h4>
              <p className="text-sm text-white/60">
                El ENSO es un fenómeno natural e inevitable. No podemos evitar
                que ocurra, pero podemos predecirlo y prepararnos.
              </p>
            </div>
            <div className="glass-card-light rounded-xl p-5 border-l-4 border-eco-500">
              <h4 className="font-bold text-eco-400 mb-2">
                Sobre las consecuencias
              </h4>
              <p className="text-sm text-white/60">
                Ahi reside nuestra capacidad de acción: mitigar impactos
                mediante tecnologia, planificacion y gestión adaptativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
