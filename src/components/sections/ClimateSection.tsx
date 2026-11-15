import { useState } from "react";
import { CloudSunRain, AlertTriangle, Leaf, TrendingUp } from "lucide-react";
import { asset } from "@/lib/utils";
import { SectionHeading } from "./shared";

export default function ClimateSection() {
  const [activeTab, setActiveTab] = useState<"elnino" | "lanina" | "impactos">(
    "elnino"
  );

  return (
    <section className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          icon={CloudSunRain}
          title="Impacto de El Niño y La Niña en Córdoba"
        />
        <p className="text-white/70 leading-relaxed mb-5 max-w-4xl">
          El fenómeno El Niño / Oscilación del Sur (ENSO) es el contexto
          climático que motivó el proyecto y aparece desarrollado en el informe.
          La corrección 2026 lo convierte además en un análisis reproducible:
          las 42 pruebas de tendencia y las <strong className="text-white">504 pruebas ENSO</strong> se
          publican por separado, con sus magnitudes, intervalos y correcciones.
        </p>
        <div className="mb-8 rounded-xl border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-100/80 max-w-4xl">
          Sí analizamos ONI / Niño 3.4 de NOAA CPC. La estación real del
          Observatorio Córdoba atribuye <strong className="text-emerald-200">+17,3 mm/mes</strong> a
          El Niño frente a La Niña (p por bloques = 0,028). Ver{" "}
          <a href="#enso" className="text-water-300 underline underline-offset-2">la sección ENSO</a>.
        </div>

        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-500" />
            <span className="text-sm text-white/60">
              El Niño (Lluvias intensas)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-water-500" />
            <span className="text-sm text-white/60">La Niña (Sequia)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500" />
            <span className="text-sm text-white/60">Condiciones Neutrales</span>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex border-b border-white/10">
            {[
              {
                key: "elnino" as const,
                label: "Fenómeno El Niño",
                color: "#EF4444",
              },
              {
                key: "lanina" as const,
                label: "Fenómeno La Niña",
                color: "#1EB8FF",
              },
              {
                key: "impactos" as const,
                label: "Impactos en Córdoba",
                color: "#F59E0B",
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all border-b-3 ${
                  activeTab === tab.key
                    ? "text-white bg-white/5"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
                style={
                  activeTab === tab.key
                    ? { borderBottomColor: tab.color, borderBottomWidth: 3 }
                    : {}
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === "elnino" && (
              <div className="animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">
                      El Niño y sus Efectos en Córdoba
                    </h3>
                    <p className="text-white/70 mb-4">
                      La bibliografía describe que, durante eventos de El Niño,
                      Córdoba tiende a condiciones más húmedas de lo normal.
                      Este sitio no estima porcentajes propios de aumento de
                      lluvia.
                    </p>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        Aumento del riesgo de inundaciones
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        Incremento en la sedimentacion de embalses
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        Mayor escorrentia superficial
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        Posibilidad de crecidas repentinas
                      </li>
                      <li className="flex items-start gap-2">
                        <Leaf className="w-4 h-4 text-eco-400 mt-0.5 flex-shrink-0" />
                        Recarga mejorada de acuíferos
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-md border border-white/10">
                    <img
                      src={asset("/el-nino-satellite.jpg")}
                      alt="El Niño satellite image"
                      className="w-full h-64 object-cover"
                    />
                    <p className="text-xs text-white/50 italic p-3 bg-white/5">
                      Imagen satelital de anomalias de temperatura durante El
                      Niño. Fuente: NASA
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "lanina" && (
              <div className="animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">
                      La Niña y sus Efectos en Córdoba
                    </h3>
                    <p className="text-white/70 mb-4">
                      La bibliografía describe que La Niña suele asociarse a
                      condiciones más secas en la región. No calculamos aquí una
                      reducción porcentual ni la contrastamos con nuestras series.
                    </p>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-water-400 mt-0.5 flex-shrink-0" />
                        Disminución del caudal en rios y arroyos
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-water-400 mt-0.5 flex-shrink-0" />
                        Reducción de los niveles en embalses y diques
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-water-400 mt-0.5 flex-shrink-0" />
                        Mayor estres hídrico para la agricultura
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-water-400 mt-0.5 flex-shrink-0" />
                        Aumento del riesgo de incendios forestales
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-water-400 mt-0.5 flex-shrink-0" />
                        Disminución de la recarga de acuíferos
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-md border border-white/10">
                    <img
                      src={asset("/la-nina-satellite.jpg")}
                      alt="La Niña satellite image"
                      className="w-full h-64 object-cover"
                    />
                    <p className="text-xs text-white/50 italic p-3 bg-white/5">
                      Imagen satelital de anomalias de temperatura durante La
                      Niña. Fuente: NASA
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "impactos" && (
              <div className="animate-fadeIn">
                <h3 className="text-xl font-bold text-white mb-4">
                  Impactos Socioeconómicos del ENSO en Córdoba
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-white/70 text-sm">
                    <p>
                      <strong className="text-water-400">Agricultura:</strong>{" "}
                      Pérdidas de cosechas durante sequias (La Niña) y daños por
                      inundaciones (El Niño)
                    </p>
                    <p>
                      <strong className="text-water-400">
                        Infraestructura:
                      </strong>{" "}
                      Daños en caminos y puentes durante eventos extremos de
                      lluvia
                    </p>
                    <p>
                      <strong className="text-water-400">Salud Pública:</strong>{" "}
                      Aumento de enfermedades vectoriales durante periodos
                      humedos
                    </p>
                    <p>
                      <strong className="text-water-400">Energía:</strong>{" "}
                      Reducción en la generación hidroeléctrica durante sequias
                    </p>
                    <p>
                      <strong className="text-water-400">Ecosistemas:</strong>{" "}
                      Alteracion de habitats acuáticos y terrestres
                    </p>
                  </div>
                  <div className="glass-card-light rounded-lg p-5 border-l-4 border-orange-500">
                    <h4 className="font-bold text-white mb-3">
                      Escenarios al 2050 (informe del proyecto)
                    </h4>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        Población: 4.8 millones de habitantes
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        Demanda de agua: 1,800 a 2,600 Hm3 anuales
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        Mayor presión sobre la demanda hídrica (proyección)
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        Micro-represas clave para seguridad hídrica
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
