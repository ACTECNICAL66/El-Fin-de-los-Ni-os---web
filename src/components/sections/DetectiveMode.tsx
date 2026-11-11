import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, MapPin, Globe, AlertTriangle } from "lucide-react";

interface Cuenca {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  area_km2: number;
  centroide: [number, number];
}

interface Variable {
  id: number;
  nombre: string;
  unidad: string;
  descripcion: string;
}

interface Tendencia {
  cuenca: string;
  codigo: string;
  variable: string;
  unidad: string;
  periodo_inicio: number;
  periodo_fin: number;
  sen_slope: number;
  sen_slope_por_decada: number;
  mann_kendall_tau: number;
  mann_kendall_p_valor: number;
  significancia: string;
  n_puntos: number;
}

type Serie = { years: number[]; values: number[]; trend: Tendencia };

function senSlope(values: number[]) {
  const slopes: number[] = [];
  for (let i = 0; i < values.length; i++)
    for (let j = i + 1; j < values.length; j++)
      slopes.push((values[j] - values[i]) / (j - i));
  slopes.sort((a, b) => a - b);
  const mid = Math.floor(slopes.length / 2);
  return slopes.length % 2 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2;
}

function mannKendall(values: number[]) {
  const n = values.length;
  let s = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) s += Math.sign(values[j] - values[i]);
  const variance = (n * (n - 1) * (2 * n + 5)) / 18;
  const z = s > 0 ? (s - 1) / Math.sqrt(variance) : s < 0 ? (s + 1) / Math.sqrt(variance) : 0;
  // Two-tailed normal approximation.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const density = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
  const tail = density * (0.319381530 * t - 0.356563782 * t ** 2 + 1.781477937 * t ** 3 - 1.821255978 * t ** 4 + 1.330274429 * t ** 5);
  return { tau: s / (n * (n - 1) / 2), p: Math.min(1, 2 * tail) };
}

interface DetectiveModeProps {
  initialCuencaId?: string;
  initialVariable?: string;
}

export default function DetectiveMode({
  initialCuencaId = "1",
  initialVariable = "precipitacion",
}: DetectiveModeProps) {
  const [cuencas, setCuencas] = useState<Cuenca[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [tendencias, setTendencias] = useState<Tendencia[]>([]);
  const [serie, setSerie] = useState<Serie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCuencaId, setSelectedCuencaId] = useState(initialCuencaId);
  const [selectedVariable, setSelectedVariable] = useState(initialVariable);

  useEffect(() => {
    const controller = new AbortController();
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        const baseUrl = import.meta.env.BASE_URL || "/";
        const [resCuencas, resVariables] = await Promise.all([
          fetch(`${baseUrl}data/cuencas.geojson`),
          fetch(`${baseUrl}data/variables.json`),
        ]);

        if (!resCuencas.ok || !resVariables.ok) {
          throw new Error("Error al cargar datos");
        }

        const geojson = await resCuencas.json();
        const dataVariables = await resVariables.json();

        // Extraer cuencas desde GeoJSON (mismo formato que la API)
        const cuencasData = geojson.features.map((f: any) => ({
          id: f.properties.id,
          nombre: f.properties.nombre,
          codigo: f.properties.codigo,
          descripcion: f.properties.descripcion,
          area_km2: f.properties.area_km2,
          centroide: f.properties.centroide ?? (() => {
            const ring = f.geometry.coordinates[0];
            const xs = ring.map((p: number[]) => p[0]);
            const ys = ring.map((p: number[]) => p[1]);
            return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
          })(),
        }));

        setCuencas(cuencasData);
        setVariables(dataVariables.data || []);

        // Resolver la cuenca seleccionada por su ID para obtener el código
        const cuencaSel = cuencasData.find((c) => c.id.toString() === selectedCuencaId);
        const cuencaCodigo = cuencaSel?.codigo ?? selectedCuencaId;

        const basin = cuencasData.find((c: Cuenca) => c.codigo === cuencaCodigo);
        if (!basin) throw new Error("No se encontró la cuenca elegida.");
        const parameter = selectedVariable === "precipitacion" ? "PRECTOTCORR" : "T2M";
        const url = new URL("https://power.larc.nasa.gov/api/temporal/monthly/point");
        url.search = new URLSearchParams({ parameters: parameter, community: "AG", longitude: String(basin.centroide[0]), latitude: String(basin.centroide[1]), format: "JSON", start: "2000", end: "2025" }).toString();
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`NASA POWER respondió ${response.status}. Intenta nuevamente.`);
        const payload = await response.json();
        const parameterData = payload?.properties?.parameter?.[parameter];
        if (!parameterData) throw new Error("NASA POWER no devolvió datos para esta variable y ubicación.");
        const annual = new Map<number, number[]>();
        for (const [date, raw] of Object.entries(parameterData)) {
          if (date.endsWith("13")) continue;
          const value = Number(raw);
          if (!Number.isFinite(value) || value <= -900) continue;
          const year = Number(date.slice(0, 4));
          const month = Number(date.slice(4, 6));
          if (year < 2000 || year > 2025 || month < 1 || month > 12) continue;
          const entries = annual.get(year) ?? [];
          // POWER reports precipitation as mm/day; convert monthly means to totals.
          entries.push(selectedVariable === "precipitacion" ? value * new Date(Date.UTC(year, month, 0)).getUTCDate() : value);
          annual.set(year, entries);
        }
        const years = [...annual.keys()].sort((a, b) => a - b).filter(y => annual.get(y)?.length === 12);
        const values = years.map(y => selectedVariable === "precipitacion" ? annual.get(y)!.reduce((a, b) => a + b, 0) : annual.get(y)!.reduce((a, b) => a + b, 0) / 12);
        if (years.length < 20) throw new Error(`NASA POWER devolvió solo ${years.length} años completos; se necesitan al menos 20.`);
        const slope = senSlope(values);
        const mk = mannKendall(values);
        const trend: Tendencia = { cuenca: basin.nombre, codigo: basin.codigo, variable: selectedVariable, unidad: selectedVariable === "precipitacion" ? "mm" : "°C", periodo_inicio: years[0], periodo_fin: years[years.length - 1], sen_slope: slope, sen_slope_por_decada: slope * 10, mann_kendall_tau: mk.tau, mann_kendall_p_valor: mk.p, significancia: mk.p < 0.05 ? "significativa" : "no_significativa", n_puntos: years.length };
        setTendencias([trend]);
        setSerie({ years, values, trend });
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message || "No se pudieron cargar los datos climáticos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    cargarDatos();
    return () => controller.abort();
  }, [selectedCuencaId, selectedVariable]);

  const cuencaSeleccionada = cuencas.find(
    (c) => c.id.toString() === selectedCuencaId
  );
  const variableSeleccionada = variables.find(
    (v) => v.nombre === selectedVariable
  );

  // Preparar datos para el gráfico
  const prepareChartData = () => {
    if (loading || !cuencaSeleccionada || tendencias.length === 0) {
      return null;
    }

    const trend = tendencias.find(
      (t) => t.codigo === cuencaSeleccionada.codigo && t.variable === selectedVariable
    );

    if (!trend) return null;

    if (!serie) return null;

    return {
      labels: serie.years,
      datasets: [
        {
          label: `${cuencaSeleccionada.nombre} - ${variableSeleccionada!.nombre}`,
          data: serie.values,
          borderColor:
            trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6",
          backgroundColor: (trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6") + "20",
          fill: true,
          tension: 0.15,
          pointRadius: 3,
          pointBackgroundColor: trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6",
        },
      ],
    };
  };

  const trendColor = tendencias[0]?.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6";
  const esSignificativa = tendencias[0]?.mann_kendall_p_valor < 0.05;

  if (loading) {
    return (
      <Card className="glass-card border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-water-400" />
            Detective Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-white/50">
          Cargando datos climáticos...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card bg-red-500/5 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Detective Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-red-300">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-t-4 border-water-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-water-400" />
          Detective Mode
          <span className="text-xs font-normal text-white/40 ml-2">
            (NASA POWER · {serie?.trend.periodo_inicio ?? 2000}-{serie?.trend.periodo_fin ?? 2025})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Cuenca
            </label>
            <Select
              value={selectedCuencaId}
              onValueChange={setSelectedCuencaId}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Seleccionar cuenca" />
              </SelectTrigger>
              <SelectContent>
                {cuencas.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    <div className="flex items-center gap-2">
                      <strong>{c.codigo}</strong> - {c.nombre}
                      <span className="text-xs text-white/30">
                        ({c.area_km2.toLocaleString()} km²)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Variable
            </label>
            <Select
              value={selectedVariable}
              onValueChange={setSelectedVariable}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Seleccionar variable" />
              </SelectTrigger>
              <SelectContent>
                {variables.map((v) => (
                  <SelectItem key={v.nombre} value={v.nombre}>
                    <strong>{v.nombre}</strong> ({v.unidad})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${trendColor === "#F59E0B" ? "bg-amber-400" : "bg-blue-400"}`}
            />
            <span
              className={`text-sm font-semibold ${
                trendColor === "#F59E0B" ? "text-amber-400" : "text-blue-400"
              }`}
            >
              {trendColor === "#F59E0B" ? "subida" : "bajada"} en {cuencaSeleccionada?.codigo}
            </span>
          </div>
        </div>

        {cuencaSeleccionada && variableSeleccionada && (
          <div className="glass-card p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-white/40 uppercase">Sen Slope</span>
                <p
                  className={`text-2xl font-bold ${
                    trendColor === "#F59E0B" ? "text-amber-400" : "text-blue-400"
                  }`}
                >
                  {tendencias[0]?.sen_slope_por_decada.toFixed(2)} {variableSeleccionada!.unidad}/década
                </p>
              </div>
              <div>
                <span className="text-xs text-white/40 uppercase">Mann-Kendall p</span>
                <p
                  className={`text-2xl font-bold ${
                    esSignificativa ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {tendencias[0]?.mann_kendall_p_valor.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  esSignificativa
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {esSignificativa ? "✓ Significativa" : "✗ No significativa"}
              </span>
              <span className="text-xs text-white/40">{cuencaSeleccionada!.codigo}</span>
            </div>
          </div>
        )}

        {prepareChartData() && (
          <div className="h-[300px] w-full">
            <Line data={prepareChartData()!} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#cbd5e1" } } }, scales: { x: { ticks: { color: "#94a3b8" }, grid: { color: "#ffffff12" } }, y: { ticks: { color: "#94a3b8" }, grid: { color: "#ffffff12" }, title: { display: true, text: serie?.trend.unidad, color: "#cbd5e1" } } } }} />
          </div>
        )}

        <div className="mt-4 text-center text-xs text-white/30">
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          Fuente: NASA POWER, punto representativo de la cuenca. Precipitación anual calculada a partir de medias mensuales (mm/día). Mann–Kendall usa aproximación normal; no corrige autocorrelación temporal.
        </div>
      </CardContent>
    </Card>
  );
}
