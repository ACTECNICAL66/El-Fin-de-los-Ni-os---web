import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Droplets,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Pause,
  Play,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  Sun,
  Thermometer,
  Waves,
  Wind,
  XCircle,
} from "lucide-react";

/**
 * Panel de control V4 (2026).
 *
 * Reinterpreta el PaneldeControlV3.html aportado por el equipo, pero:
 *  - usa el sistema visual de la web (sin FontAwesome CDN ni Segoe UI),
 *  - dice explícitamente que todos los valores son simulados,
 *  - conserva los endpoints/errores descritos en el informe (-999.0),
 *  - deja claro que NO alimenta las 42 tendencias ni el mapa comparativo.
 */

interface Datos {
  nivel: number;        // m
  caudal: number;       // m³/s
  temp: number;         // °C
  tds: number;          // ppm
  turbidez: number;     // NTU
  volumen: number;      // m³
  evacuadoHoy: number;  // m³
  evacuadoTotal: number;// m³
}

const INICIAL: Datos = {
  nivel: 8.2,
  caudal: 0,
  temp: 18.5,
  tds: 320,
  turbidez: 25,
  volumen: 12500,
  evacuadoHoy: 0,
  evacuadoTotal: 24500,
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const f1 = (v: number) => v.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f0 = (v: number) => v.toLocaleString("es-AR", { maximumFractionDigits: 0 });

function calidadTDS(ppm: number) {
  if (ppm <= 50) return { etiqueta: "Excelente", color: "#38bdf8", ancho: 10 };
  if (ppm <= 150) return { etiqueta: "Muy buena", color: "#22d3ee", ancho: 20 };
  if (ppm <= 250) return { etiqueta: "Buena", color: "#60a5fa", ancho: 30 };
  if (ppm <= 350) return { etiqueta: "Aceptable", color: "#4ade80", ancho: 40 };
  if (ppm <= 500) return { etiqueta: "Regular", color: "#fb923c", ancho: 60 };
  if (ppm <= 750) return { etiqueta: "Pobre", color: "#f87171", ancho: 75 };
  if (ppm <= 1000) return { etiqueta: "Mala", color: "#ef4444", ancho: 85 };
  return { etiqueta: "No apta", color: "#94a3b8", ancho: 100 };
}

function calidadTurbidez(ntu: number) {
  if (ntu <= 5) return { etiqueta: "Cristalina", color: "#7dd3fc", ancho: 10 };
  if (ntu <= 15) return { etiqueta: "Muy clara", color: "#a5d8ff", ancho: 20 };
  if (ntu <= 30) return { etiqueta: "Clara", color: "#bae6fd", ancho: 30 };
  if (ntu <= 50) return { etiqueta: "Ligeramente turbia", color: "#99f6e4", ancho: 45 };
  if (ntu <= 100) return { etiqueta: "Turbia", color: "#fde68a", ancho: 60 };
  if (ntu <= 200) return { etiqueta: "Muy turbia", color: "#fbbf24", ancho: 75 };
  if (ntu <= 500) return { etiqueta: "Extremadamente turbia", color: "#f97316", ancho: 85 };
  return { etiqueta: "No apta", color: "#cbd5e1", ancho: 100 };
}

export default function ControlPanelDemo() {
  const [datos, setDatos] = useState<Datos>(INICIAL);
  const [compuerta, setCompuerta] = useState(false);
  const [ejeX, setEjeX] = useState(false);
  const [ejeZ, setEjeZ] = useState(false);
  const [fallaTemp, setFallaTemp] = useState(false);
  const [simulando, setSimulando] = useState(true);
  const [orientacion, setOrientacion] = useState("0° / 0°");

  useEffect(() => {
    if (!simulando) return;
    const id = window.setInterval(() => {
      setDatos(prev => {
        const next: Datos = { ...prev };
        next.nivel = clamp(prev.nivel + (Math.random() - 0.5) * 0.05, 5, 12);
        next.temp = clamp(prev.temp + (Math.random() - 0.5) * 0.1, 10, 25);
        next.tds = clamp(prev.tds + (Math.random() - 0.5) * 2, 200, 450);
        next.turbidez = clamp(prev.turbidez + (Math.random() - 0.5) * 0.5, 10, 60);
        next.caudal = compuerta ? 2.5 : 0;

        if (compuerta) {
          const evacuado = next.caudal * 3; // intervalo de 3 s
          next.volumen = clamp(prev.volumen - evacuado, 8000, 20000);
          next.evacuadoHoy = prev.evacuadoHoy + evacuado;
          next.evacuadoTotal = prev.evacuadoTotal + evacuado;
          next.nivel = clamp(next.nivel - 0.001, 5, 12);
        } else {
          next.volumen = clamp(prev.volumen + 1.5, 8000, 20000);
          next.nivel = clamp(next.nivel + 0.0001, 5, 12);
        }
        return next;
      });
    }, 3000);
    return () => window.clearInterval(id);
  }, [simulando, compuerta]);

  const tds = useMemo(() => calidadTDS(datos.tds), [datos.tds]);
  const turb = useMemo(() => calidadTurbidez(datos.turbidez), [datos.turbidez]);

  const alternarEje = (eje: "X" | "Z") => {
    const activoX = eje === "X" ? !ejeX : ejeX;
    const activoZ = eje === "Z" ? !ejeZ : ejeZ;
    if (eje === "X") setEjeX(activoX);
    else setEjeZ(activoZ);
    setOrientacion(
      activoX || activoZ
        ? `${Math.floor(Math.random() * 180)}° / ${Math.floor(Math.random() * 90)}°`
        : "0° / 0°",
    );
  };

  const reiniciar = () => {
    setDatos(INICIAL);
    setCompuerta(false);
    setEjeX(false);
    setEjeZ(false);
    setFallaTemp(false);
    setOrientacion("0° / 0°");
  };

  const sensores = [
    { icon: Ruler, etiqueta: "Nivel de agua", valor: `${f1(datos.nivel)} m`, barra: ((datos.nivel - 5) / 7) * 100 },
    { icon: Wind, etiqueta: "Caudal de salida", valor: `${f1(datos.caudal)} m³/s`, barra: (datos.caudal / 3) * 100 },
    { icon: Thermometer, etiqueta: "Temperatura del agua", valor: fallaTemp ? "-999.0" : `${f1(datos.temp)} °C`, barra: fallaTemp ? 0 : ((datos.temp - 10) / 15) * 100, error: fallaTemp },
    { icon: FlaskConical, etiqueta: "Sólidos disueltos (TDS)", valor: `${f0(datos.tds)} ppm`, barra: tds.ancho },
    { icon: Droplets, etiqueta: "Turbidez", valor: `${f1(datos.turbidez)} NTU`, barra: turb.ancho },
    { icon: Database, etiqueta: "Volumen almacenado", valor: `${f0(datos.volumen)} m³`, barra: ((datos.volumen - 8000) / 12000) * 100 },
  ];

  return (
    <div id="panel-demo" className="glass-card overflow-hidden">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-water-500/15 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-water-300" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Panel de control · V4</h2>
            <p className="text-xs text-white/45 mt-0.5">IPET N°66 · maqueta interactiva · NASA Space Apps 2026</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="tag-orange">SIMULACIÓN · sin hardware conectado</span>
          <span className="tag-blue">ODS 6 · agua y saneamiento</span>
        </div>
      </div>

      {/* Aviso de honestidad */}
      <div role="note" className="mx-5 sm:mx-6 mt-5 rounded-xl border border-amber-300/25 bg-amber-300/5 px-4 py-3 text-xs sm:text-sm text-amber-100/85 leading-relaxed flex gap-3">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
        <p>
          <strong className="text-amber-200">Todos los números de este panel son generados por una simulación.</strong>{" "}
          No hay sensores instalados, no hay telemetría y ningún valor se usa en las 42 pruebas de tendencia.
          Los botones reproducen la interfaz descrita en el informe (<code className="text-amber-200">/toggleCompuerta</code>,{" "}
          <code className="text-amber-200">/toggleX</code>, <code className="text-amber-200">/toggleY</code>) para mostrar
          cómo se vería una futura aplicación de monitoreo.
        </p>
      </div>

      {/* Barra de error de sensor */}
      {fallaTemp && (
        <div className="mx-5 sm:mx-6 mt-4 rounded-lg border border-amber-300/35 bg-amber-300/10 px-4 py-2.5 text-xs text-amber-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-300" />
          Fallo en sensor DS18B20 → el firmware devolvería <code className="font-mono">-999.0</code> y el panel mostraría ERROR.
        </div>
      )}

      {/* Controles de la demo */}
      <div className="px-5 sm:px-6 pt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSimulando(v => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-xs text-white/70 hover:bg-white/10 transition-colors"
        >
          {simulando ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {simulando ? "Pausar simulación" : "Reanudar simulación"}
        </button>
        <button
          onClick={() => setFallaTemp(v => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-xs text-white/70 hover:bg-white/10 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {fallaTemp ? "Restaurar sensor" : "Simular falla -999.0"}
        </button>
        <button
          onClick={reiniciar}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-xs text-white/70 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>
        <span className="ml-auto text-[11px] font-mono text-white/35">setInterval · 3 s · datos aleatorios acotados</span>
      </div>

      {/* Cuerpo */}
      <div className="p-5 sm:p-6 grid lg:grid-cols-[0.9fr_1.1fr] gap-5">
        {/* Controles */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-water-300" />
              <h3 className="font-display font-semibold text-white">Controles del sistema</h3>
            </div>

            <div className="rounded-lg bg-black/20 border border-white/[0.07] p-4 mb-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-water-300" />
                  <span className="text-sm text-white/75">Compuerta</span>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${compuerta ? "text-emerald-300" : "text-white/45"}`}>
                  {compuerta ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {compuerta ? "ABIERTA · ACTIVO" : "CERRADA · INACTIVO"}
                </span>
              </div>
              <button
                onClick={() => setCompuerta(v => !v)}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  compuerta
                    ? "bg-rose-500/15 border border-rose-400/30 text-rose-200 hover:bg-rose-500/25"
                    : "bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/25"
                }`}
              >
                {compuerta ? <XCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {compuerta ? "Cerrar compuerta" : "Abrir compuerta"}
              </button>
              <p className="text-[11px] text-white/35 mt-2.5">
                Al abrir, el caudal simulado pasa a 2,5 m³/s y el volumen desciende. Control dual previsto: web + pulsador físico.
              </p>
            </div>

            <div className="rounded-lg bg-black/20 border border-white/[0.07] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-amber-300" />
                <span className="text-sm text-white/75">Seguidor solar analógico</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {(["X", "Z"] as const).map(eje => {
                  const activo = eje === "X" ? ejeX : ejeZ;
                  return (
                    <button
                      key={eje}
                      onClick={() => alternarEje(eje)}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        activo
                          ? "bg-amber-300/10 border-amber-300/30 text-amber-200"
                          : "bg-white/5 border-white/10 text-white/55 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${activo ? "bg-emerald-400 shadow-[0_0_8px_#4ade80]" : "bg-white/25"}`} />
                      Eje {eje}: {activo ? "ACTIVO" : "INACTIVO"}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                <span className="text-[11px] text-white/40">Orientación estimada</span>
                <span className="font-mono text-sm text-amber-200">{orientacion}</span>
              </div>
              <p className="text-[11px] text-white/35 mt-2">
                Diseño con 4 LDR, TDA2822 y TIP42. En el firmware los ejes se denominan X/Y; aquí se conserva la notación del panel V3.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
              <p className="text-[11px] text-white/40 uppercase tracking-wider">Evacuado hoy</p>
              <p className="font-mono text-lg text-water-200 mt-1">{f1(datos.evacuadoHoy)} m³</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
              <p className="text-[11px] text-white/40 uppercase tracking-wider">Evacuado total</p>
              <p className="font-mono text-lg text-water-200 mt-1">{f0(datos.evacuadoTotal)} m³</p>
            </div>
          </div>
        </div>

        {/* Sensores + calidad */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-eco-400" />
              <h3 className="font-display font-semibold text-white">Lecturas simuladas</h3>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {sensores.map(s => (
                <div
                  key={s.etiqueta}
                  className={`rounded-lg border px-3 py-3 ${s.error ? "border-amber-300/35 bg-amber-300/[0.07]" : "border-white/[0.07] bg-white/[0.025]"}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <s.icon className={`w-3.5 h-3.5 ${s.error ? "text-amber-300" : "text-water-300/80"}`} />
                    <p className="text-[11px] text-white/45 leading-tight">{s.etiqueta}</p>
                  </div>
                  <p className={`font-mono text-lg font-semibold ${s.error ? "text-amber-300" : "text-white"}`}>{s.valor}</p>
                  <div className="h-1 rounded-full bg-white/5 mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.error ? "bg-amber-400" : "bg-gradient-to-r from-water-500 to-eco-400"}`}
                      style={{ width: `${Math.max(0, Math.min(100, s.barra))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Indicador
              icon={Gauge}
              titulo="Calidad del agua (TDS)"
              nivel={tds.etiqueta}
              detalle={`${f0(datos.tds)} ppm · umbral ilustrativo`}
              color={tds.color}
              ancho={tds.ancho}
              escala={["Óptima", "Crítica"]}
            />
            <Indicador
              icon={Droplets}
              titulo="Turbidez"
              nivel={turb.etiqueta}
              detalle={`${f1(datos.turbidez)} NTU · umbral ilustrativo`}
              color={turb.color}
              ancho={turb.ancho}
              escala={["Clara", "Turbia"]}
            />
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 pb-5 pt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/35 border-t border-white/[0.06]">
        <span className="inline-flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Datos: simulación local, no NASA POWER</span>
        <span className="inline-flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5" /> Umbrales de calidad: ejemplo didáctico, sin calibración</span>
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Código abierto y reproducible</span>
      </div>
    </div>
  );
}

function Indicador({
  icon: Icon,
  titulo,
  nivel,
  detalle,
  color,
  ancho,
  escala,
}: {
  icon: typeof Gauge;
  titulo: string;
  nivel: string;
  detalle: string;
  color: string;
  ancho: number;
  escala: [string, string];
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-water-300" />
        <h4 className="text-xs font-medium text-white/65">{titulo}</h4>
      </div>
      <p className="font-display text-xl font-bold" style={{ color }}>{nivel}</p>
      <p className="text-[11px] text-white/40 mt-0.5">{detalle}</p>
      <div className="flex justify-between text-[10px] text-white/30 mt-3 mb-1">
        <span>{escala[0]}</span><span>{escala[1]}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ancho}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
