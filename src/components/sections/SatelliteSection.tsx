import { useState } from "react";
import { Satellite, Leaf, Droplet, BarChart3 } from "lucide-react";
import { SectionHeading } from "./shared";
import { trpc } from "@/providers/trpc";

export default function SatelliteSection() {
  const [phenomenon, setPhenomenon] = useState<"normal" | "nino" | "nina">(
    "normal"
  );
  const [precipitation, setPrecipitation] = useState(100);
  const [temperature, setTemperature] = useState(25);
  const { data: prediction } = trpc.satellite.predictNDVI.useQuery(
    { precipitation, temperature, phenomenon },
    { enabled: true }
  );

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          icon={Satellite}
          title="Analisis de Indices Satelitales"
        />
        <p className="text-slate-600 leading-relaxed mb-8 max-w-4xl">
          Panel de analisis de recursos hidricos basado en datos satelitales de
          la NASA para monitoreo y prediccion de la salud vegetal y estres
          hidrico en la region de Cordoba.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" /> NDVI - Indice de
              Vegetacion
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              El NDVI mide la salud y densidad de la vegetacion mediante la
              diferencia entre la reflectancia en el infrarrojo cercano y el
              rojo.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-sm">
                  NDVI &gt; 0.6: Vegetacion densa y saludable
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-sm">
                  NDVI 0.3-0.6: Vegetacion moderada
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-sm">
                  NDVI &lt; 0.3: Suelo desnudo o vegetacion escasa
                </span>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-600" /> ESI - Indice de
              Estres Evaporativo
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              El ESI mide el estres hidrico de la vegetacion mediante la
              relacion entre la temperatura de la superficie y la
              evapotranspiracion.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-sm">
                  ESI &gt; 0.8: Sin estres hidrico
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-sm">
                  ESI 0.5-0.8: Estres hidrico moderado
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-sm">
                  ESI &lt; 0.5: Estres hidrico severo
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              title: "NDVI Promedio Regional",
              value: "0.49",
              trend: "5.25%",
              up: true,
              accent: "#22c55e",
            },
            {
              title: "ESI Promedio Regional",
              value: "0.59",
              trend: "3.83%",
              up: false,
              accent: "#3b82f6",
            },
            {
              title: "Area con Estres Hidrico",
              value: "29%",
              trend: "7.75%",
              up: true,
              accent: "#ef4444",
            },
            {
              title: "Recuperacion Vegetal",
              value: "71%",
              trend: "12.35%",
              up: true,
              accent: "#10b981",
            },
          ].map(metric => (
            <div
              key={metric.title}
              className="bg-white rounded-lg p-5 shadow-md border-l-4 hover:-translate-y-1 transition-all"
              style={{ borderLeftColor: metric.accent }}
            >
              <h3 className="text-xs font-medium text-slate-500 mb-1">
                {metric.title}
              </h3>
              <p className="text-2xl font-bold text-slate-800">
                {metric.value}
              </p>
              <span
                className={`text-xs font-bold ${metric.up ? "text-green-600" : "text-red-600"}`}
              >
                {metric.up ? "\u2191" : "\u2193"} {metric.trend}
              </span>
              <p className="text-xs text-slate-400 mt-1">vs mes anterior</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-8 mb-10">
          <h3 className="text-2xl font-bold text-center text-slate-800 mb-8">
            <BarChart3 className="w-6 h-6 inline mr-2" />
            Modelo Predictivo de NDVI
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <p className="text-sm text-slate-600">
                Ajuste los parametros para simular el impacto en la vegetacion.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fenomeno Climatico
                </label>
                <select
                  value={phenomenon}
                  onChange={e => setPhenomenon(e.target.value as any)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0B3D91] focus:border-transparent"
                >
                  <option value="normal">Condiciones Normales</option>
                  <option value="nino">El Nino</option>
                  <option value="nina">La Nina</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precipitacion Estimada:{" "}
                  <span className="font-bold">{precipitation}</span> mm
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={precipitation}
                  onChange={e => setPrecipitation(Number(e.target.value))}
                  className="w-full accent-[#0B3D91]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temperatura Promedio:{" "}
                  <span className="font-bold">{temperature}</span> °C
                </label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  className="w-full accent-[#0B3D91]"
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h4 className="text-lg font-bold text-slate-800 mb-4 text-center">
                Resultados de la Simulacion
              </h4>
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500">NDVI Predicho</p>
                <p
                  className={`text-5xl font-bold ${prediction?.color || "text-slate-700"}`}
                >
                  {prediction ? prediction.ndvi.toFixed(2) : "--"}
                </p>
              </div>
              <div className="text-center mb-4">
                <p className="text-sm text-slate-500">
                  Estado de la Vegetacion
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {prediction?.status || "--"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">
                  Recomendacion
                </p>
                <p className="text-sm text-slate-700">
                  {prediction?.recommendation ||
                    "Ajuste los parametros para ver una recomendacion."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
