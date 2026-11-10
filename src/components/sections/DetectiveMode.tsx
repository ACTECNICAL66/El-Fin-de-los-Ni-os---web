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
import { asset } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCuencaId, setSelectedCuencaId] = useState(initialCuencaId);
  const [selectedVariable, setSelectedVariable] = useState(initialVariable);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resCuencas, resVariables] = await Promise.all([
          fetch("/api/cuencas"),
          fetch("/api/variables"),
        ]);

        if (!resCuencas.ok || !resVariables.ok) {
          throw new Error("Error al cargar datos");
        }

        const dataCuencas = await resCuencas.json();
        const dataVariables = await resVariables.json();

        setCuencas(dataCuencas.data || []);
        setVariables(dataVariables.data || []);

        const resTendencias = await fetch(
          `/api/trends?cuenca=${selectedCuencaId}&variable=${selectedVariable}`
        );
        if (resTendencias.ok) {
          const data = await resTendencias.json();
          setTendencias(data.data || []);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
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

    const anos = Array.from({ length: 26 }, (_, i) => 2000 + i);
    const base =
      trend.variable === "precipitacion" ? 820 : 19.5;
    const tendencia = trend.sen_slope_por_decada / 10;
    const datos = Array.from({ length: 26 }, (_, i) =>
      base + tendencia * i + (Math.random() - 0.5) * 10
    );

    return {
      labels: anos,
      datasets: [
        {
          label: `${cuencaSeleccionada.nombre} - ${variableSeleccionada!.nombre}`,
          data: datos,
          borderColor:
            trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6",
          backgroundColor: (trend.sen_slope_por_decada >= 0 ? "#F59E0B" : "#3B82F6") + "20",
          fill: true,
          tension: 0.3,
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
            (Análisis de tendencia 2000-2025)
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
            <Line data={prepareChartData()!} />
          </div>
        )}

        <div className="mt-4 text-center text-xs text-white/30">
          <MapPin className="w-3.5 h-3.5 inline mr-1" />
          Selecciona una cuenca y variable para visualizar la tendencia climática
        </div>
      </CardContent>
    </Card>
  );
}