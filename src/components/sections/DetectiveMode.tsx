import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, MapPin, Globe, AlertTriangle } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

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
  etiqueta: string;
  unidad: string;
  descripcion: string;
  parametro: string | null;
  disponible: boolean;
}

interface ObservacionAnual {
  codigo: string;
  variable: string;
  anio: number;
  valor: number;
  latitud: number;
  longitud: number;
  fechaDescarga: string;
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
  regresion_lineal_por_decada: number;
  ic95_inferior: number;
  ic95_superior: number;
  mann_kendall_tau: number;
  mann_kendall_p_valor: number;
  significancia: string;
  n_puntos: number;
}

type Serie = { years: number[]; values: number[]; trend: Tendencia; latitud: number; longitud: number; fechaDescarga: string };

function getSenSlopes(values: number[], years: number[]) {
  const slopes: number[] = [];
  for (let i = 0; i < values.length; i++)
    for (let j = i + 1; j < values.length; j++)
      slopes.push((values[j] - values[i]) / (years[j] - years[i]));
  return slopes.sort((a, b) => a - b);
}

function senSlope(values: number[], years: number[]) {
  const slopes = getSenSlopes(values, years);
  const mid = Math.floor(slopes.length / 2);
  return slopes.length % 2 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2;
}

function mannKendall(values: number[]) {
  const n = values.length;
  let s = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) s += Math.sign(values[j] - values[i]);
  const ties = new Map<number, number>();
  values.forEach((value) => ties.set(value, (ties.get(value) ?? 0) + 1));
  const tieCorrection = [...ties.values()].reduce(
    (sum, count) => sum + (count > 1 ? count * (count - 1) * (2 * count + 5) : 0),
    0,
  );
  const variance = (n * (n - 1) * (2 * n + 5) - tieCorrection) / 18;
  if (variance <= 0 || s === 0) return { tau: s / (n * (n - 1) / 2), p: 1 };
  const z = s > 0 ? (s - 1) / Math.sqrt(variance) : s < 0 ? (s + 1) / Math.sqrt(variance) : 0;
  // Two-tailed normal approximation.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const density = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
  const tail = density * (0.319381530 * t - 0.356563782 * t ** 2 + 1.781477937 * t ** 3 - 1.821255978 * t ** 4 + 1.330274429 * t ** 5);
  return { tau: s / (n * (n - 1) / 2), p: Math.min(1, 2 * tail) };
}

function mannKendallVariance(values: number[]) {
  const n = values.length;
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const tieCorrection = [...counts.values()].reduce(
    (sum, count) => sum + (count > 1 ? count * (count - 1) * (2 * count + 5) : 0),
    0,
  );
  return (n * (n - 1) * (2 * n + 5) - tieCorrection) / 18;
}

function regressionSlope(values: number[], years: number[]) {
  const meanYear = years.reduce((sum, year) => sum + year, 0) / years.length;
  const meanValue = values.reduce((sum, value) => sum + value, 0) / values.length;
  const numerator = years.reduce((sum, year, i) => sum + (year - meanYear) * (values[i] - meanValue), 0);
  const denominator = years.reduce((sum, year) => sum + (year - meanYear) ** 2, 0);
  return denominator ? numerator / denominator : 0;
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
        const [resCuencas, resVariables, resSeries] = await Promise.all([
          fetch(`${baseUrl}data/cuencas.geojson`, { signal: controller.signal }),
          fetch(`${baseUrl}data/variables.json`, { signal: controller.signal }),
          fetch(`${baseUrl}data/nasa_power_anual.csv`, { signal: controller.signal }),
        ]);

        if (!resCuencas.ok || !resVariables.ok || !resSeries.ok) {
          throw new Error("Error al cargar datos");
        }

        const geojson = await resCuencas.json();
        const dataVariables = await resVariables.json();
        const csv = await resSeries.text();

        // Extraer cuencas desde GeoJSON (mismo formato que la API)
        const cuencasData: Cuenca[] = geojson.features.map((f: any): Cuenca => ({
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
        const variable = (dataVariables.data as Variable[]).find((v) => v.nombre === selectedVariable);
        if (!variable?.disponible || !variable.parametro) {
          throw new Error("Esta variable está en el catálogo, pero su fuente todavía no está conectada.");
        }
        const lines = csv.trim().split(/\r?\n/);
        const headers = lines[0].split(",");
        const codeIndex = headers.indexOf("codigo");
        const variableIndex = headers.indexOf("variable");
        const yearIndex = headers.indexOf("anio");
        const valueIndex = headers.indexOf("valor");
        const latitudeIndex = headers.indexOf("latitud");
        const longitudeIndex = headers.indexOf("longitud");
        const retrievedIndex = headers.indexOf("fecha_descarga");
        if ([codeIndex, variableIndex, yearIndex, valueIndex, latitudeIndex, longitudeIndex, retrievedIndex].some((index) => index < 0)) {
          throw new Error("El archivo histórico no tiene las columnas esperadas.");
        }
        const observations: ObservacionAnual[] = lines.slice(1).map((line) => {
          const fields = line.split(",");
          return {
            codigo: fields[codeIndex],
            variable: fields[variableIndex],
            anio: Number(fields[yearIndex]),
            valor: Number(fields[valueIndex]),
            latitud: Number(fields[latitudeIndex]),
            longitud: Number(fields[longitudeIndex]),
            fechaDescarga: fields[retrievedIndex],
          };
        }).filter((row) => row.codigo === basin.codigo && row.variable === selectedVariable && Number.isFinite(row.valor));
        const years = observations.map((row) => row.anio).sort((a, b) => a - b);
        const valuesByYear = new Map(observations.map((row) => [row.anio, row.valor]));
        if (new Set(years).size !== years.length) throw new Error("El archivo contiene años duplicados para la serie elegida.");
        const values = years.map((year) => valuesByYear.get(year)!);
        if (years.length < 20) throw new Error(`NASA POWER devolvió solo ${years.length} años completos; se necesitan al menos 20.`);
        const slope = senSlope(values, years);
        const slopes = getSenSlopes(values, years);
        const radius = 1.96 * Math.sqrt(mannKendallVariance(values)) / 2;
        const ciLow = slopes[Math.max(0, Math.floor(slopes.length / 2 - radius))] * 10;
        const ciHigh = slopes[Math.min(slopes.length - 1, Math.ceil(slopes.length / 2 + radius))] * 10;
        const mk = mannKendall(values);
        const trend: Tendencia = { cuenca: basin.nombre, codigo: basin.codigo, variable: selectedVariable, unidad: variable.unidad, periodo_inicio: years[0], periodo_fin: years[years.length - 1], regresion_lineal_por_decada: regressionSlope(values, years) * 10, sen_slope: slope, sen_slope_por_decada: slope * 10, ic95_inferior: ciLow, ic95_superior: ciHigh, mann_kendall_tau: mk.tau, mann_kendall_p_valor: mk.p, significancia: mk.p < 0.05 ? "significativa" : "no_significativa", n_puntos: years.length };
        setTendencias([trend]);
        const first = observations[0];
        setSerie({ years, values, trend, latitud: first.latitud, longitud: first.longitud, fechaDescarga: first.fechaDescarga });
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

    const intercepts = serie.values.map((value, index) => value - trend.sen_slope * (serie.years[index] - serie.years[0])).sort((a, b) => a - b);
    const medianIntercept = intercepts[Math.floor(intercepts.length / 2)];
    const trendLine = serie.years.map((year) => medianIntercept + trend.sen_slope * (year - serie.years[0]));
    const regressionIntercept = serie.values.reduce((sum, value, index) => sum + value - trend.regresion_lineal_por_decada / 10 * (serie.years[index] - serie.years[0]), 0) / serie.values.length;
    const regressionLine = serie.years.map((year) => regressionIntercept + trend.regresion_lineal_por_decada / 10 * (year - serie.years[0]));

    return {
      labels: serie.years,
      datasets: [
        {
          label: `${cuencaSeleccionada.nombre} - ${variableSeleccionada!.etiqueta}`,
          data: serie.values,
          borderColor:
            trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6",
          backgroundColor: (trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6") + "20",
          fill: true,
          tension: 0.15,
          pointRadius: 3,
          pointBackgroundColor: trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6",
        },
        {
          label: "Pendiente de Sen",
          data: trendLine,
          borderColor: "#f8fafc",
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Regresión lineal",
          data: regressionLine,
          borderColor: "#34d399",
          borderDash: [3, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  };

  const trendColor = tendencias[0]?.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6";
  const esSignificativa = tendencias[0]?.mann_kendall_p_valor < 0.05;

  if (loading) {
    return (
      <Card className="!bg-transparent !text-white glass-card border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-water-400" />
            Detective Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-white/70">
          Cargando la serie anual NASA POWER archivada para la cuenca elegida.
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="!bg-red-950/40 !text-white glass-card border-red-500/20">
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
    <Card className="!bg-transparent !text-white glass-card border-t-4 border-water-500">
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
                    <SelectItem key={v.nombre} value={v.nombre} disabled={!v.disponible}>
                    <strong>{v.etiqueta}</strong> ({v.disponible ? v.unidad : "en integración"})
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
              <div className="col-span-2 text-xs text-white/50">
                IC 95 % aproximado: [{tendencias[0]?.ic95_inferior.toFixed(2)}, {tendencias[0]?.ic95_superior.toFixed(2)}] {variableSeleccionada!.unidad}/década
              </div>
              <div className="col-span-2 text-xs text-emerald-300/80">
                Pendiente por regresión lineal: {tendencias[0]?.regresion_lineal_por_decada.toFixed(2)} {variableSeleccionada!.unidad}/década
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
          NASA POWER · punto representativo ({serie?.latitud.toFixed(3)}, {serie?.longitud.toFixed(3)}) · descarga {serie?.fechaDescarga}. La serie viene archivada con el proyecto. Mann–Kendall usa aproximación normal y no corrige autocorrelación temporal.
        </div>
      </CardContent>
    </Card>
  );
}
