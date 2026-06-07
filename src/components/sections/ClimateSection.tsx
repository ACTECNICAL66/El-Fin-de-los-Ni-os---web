import { useState } from "react";
import { CloudSunRain, AlertTriangle, Leaf, TrendingUp } from "lucide-react";
import { asset } from "@/lib/utils";
import { SectionHeading } from "./shared";

export default function ClimateSection() {
  const [activeTab, setActiveTab] = useState<"elnino" | "lanina" | "impactos">(
    "elnino"
  );

  return (
    <section className="bg-[#F5F7FA] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          icon={CloudSunRain}
          title="Impacto de El Nino y La Nina en Cordoba"
        />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          El fenomeno de El Nino/Oscilacion del Sur (ENSO) tiene impactos
          significativos en el regimen de precipitaciones de Cordoba, afectando
          la disponibilidad hidrica y la vulnerabilidad ante eventos extremos.
        </p>

        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#E74C3C]" />
            <span className="text-sm text-slate-600">
              El Nino (Lluvias intensas)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#3498DB]" />
            <span className="text-sm text-slate-600">La Nina (Sequia)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#F39C12]" />
            <span className="text-sm text-slate-600">
              Condiciones Neutrales
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b border-slate-200">
            {[
              {
                key: "elnino" as const,
                label: "Fenomeno El Nino",
                color: "#E74C3C",
              },
              {
                key: "lanina" as const,
                label: "Fenomeno La Nina",
                color: "#3498DB",
              },
              {
                key: "impactos" as const,
                label: "Impactos en Cordoba",
                color: "#F39C12",
              },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all border-b-3 ${
                  activeTab === tab.key
                    ? "text-[#0B3D91] border-b-[3px] bg-slate-50"
                    : "text-slate-500 border-b-transparent hover:text-slate-700 hover:bg-slate-50/50"
                }`}
                style={
                  activeTab === tab.key ? { borderBottomColor: tab.color } : {}
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
                    <h3 className="text-xl font-bold text-[#0B3D91] mb-4">
                      El Nino y sus Efectos en Cordoba
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Durante los eventos de El Nino, Cordoba experimenta
                      tipicamente condiciones mas humedas de lo normal, con
                      aumento en las precipitaciones entre un 20-40%.
                    </p>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                        Aumento del riesgo de inundaciones
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                        Incremento en la sedimentacion de embalses
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                        Mayor escorrentia superficial
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" />
                        Posibilidad de crecidas repentinas
                      </li>
                      <li className="flex items-start gap-2">
                        <Leaf className="w-4 h-4 text-[#1A936F] mt-0.5 flex-shrink-0" />
                        Recarga mejorada de acuiferos
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-md">
                    <img
                      src={asset("/el-nino-satellite.jpg")}
                      alt="El Nino satellite image"
                      className="w-full h-64 object-cover"
                    />
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50">
                      Imagen satelital de anomalias de temperatura durante El
                      Nino. Fuente: NASA
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "lanina" && (
              <div className="animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold text-[#0B3D91] mb-4">
                      La Nina y sus Efectos en Cordoba
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Los eventos de La Nina suelen traer condiciones mas secas
                      a Cordoba, con reduccion en las precipitaciones que pueden
                      superar el 30% bajo lo normal.
                    </p>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />
                        Disminucion del caudal en rios y arroyos
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />
                        Reduccion de los niveles en embalses y diques
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />
                        Mayor estres hidrico para la agricultura
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />
                        Aumento del riesgo de incendios forestales
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#3498DB] mt-0.5 flex-shrink-0" />
                        Disminucion de la recarga de acuiferos
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-md">
                    <img
                      src={asset("/la-nina-satellite.jpg")}
                      alt="La Nina satellite image"
                      className="w-full h-64 object-cover"
                    />
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50">
                      Imagen satelital de anomalias de temperatura durante La
                      Nina. Fuente: NASA
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "impactos" && (
              <div className="animate-fadeIn">
                <h3 className="text-xl font-bold text-[#0B3D91] mb-4">
                  Impactos Socioeconomicos del ENSO en Cordoba
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-slate-600 text-sm">
                    <p>
                      <strong className="text-[#0B3D91]">Agricultura:</strong>{" "}
                      Perdidas de cosechas durante sequias (La Nina) y danos por
                      inundaciones (El Nino)
                    </p>
                    <p>
                      <strong className="text-[#0B3D91]">
                        Infraestructura:
                      </strong>{" "}
                      Danos en caminos y puentes durante eventos extremos de
                      lluvia
                    </p>
                    <p>
                      <strong className="text-[#0B3D91]">Salud Publica:</strong>{" "}
                      Aumento de enfermedades vectoriales durante periodos
                      humedos
                    </p>
                    <p>
                      <strong className="text-[#0B3D91]">Energia:</strong>{" "}
                      Reduccion en la generacion hidroelectrica durante sequias
                    </p>
                    <p>
                      <strong className="text-[#0B3D91]">Ecosistemas:</strong>{" "}
                      Alteracion de habitats acuaticos y terrestres
                    </p>
                  </div>
                  <div className="bg-[#f0f7ff] rounded-lg p-5 border-l-4 border-[#F39C12]">
                    <h4 className="font-bold text-[#0B3D91] mb-3">
                      Proyecciones Futuras (2050)
                    </h4>
                    <ul className="space-y-2 text-slate-600 text-sm">
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />
                        Poblacion: 4.8 millones de habitantes
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />
                        Demanda de agua: 1,800 a 2,600 Hm3 anuales
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />
                        Intensificacion de fenomenos ENSO
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-[#F39C12] mt-0.5 flex-shrink-0" />
                        Micro-represas clave para seguridad hidrica
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
