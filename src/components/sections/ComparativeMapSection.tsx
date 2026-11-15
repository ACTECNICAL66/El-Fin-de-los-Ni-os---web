import { useMemo, useState } from "react";
import { MapPinned, Download, Info, Crosshair } from "lucide-react";
import { SectionHeading } from "./shared";
import { useAnalisis } from "@/hooks/useAnalisis";
import {
  VARIABLES,
  CATEGORIAS,
  colorDireccion,
  direccionSimbolo,
  fmtNum,
  fmtP,
} from "@/lib/analisis";

const W = 820;
const H = 560;
const PAD = 58;

function EstadoCarga({ mensaje }: { mensaje: string }) {
  return (
    <div className="glass-card p-10 text-center text-white/60 text-sm">{mensaje}</div>
  );
}

export default function ComparativeMapSection() {
  const { datos, cargando, error } = useAnalisis();
  const [variable, setVariable] = useState("precipitacion");
  const [codigo, setCodigo] = useState("CN-O");

  const porVariable = useMemo(
    () => datos?.resultados.filter(r => r.variable === variable) ?? [],
    [datos, variable],
  );
  const seleccionado =
    porVariable.find(r => r.codigo === codigo) ?? porVariable[0] ?? null;

  const limites = useMemo(() => {
    if (!datos) return null;
    const puntos = datos.cuencas.flatMap(c => c.ring);
    const lons = puntos.map(p => p[0]);
    const lats = puntos.map(p => p[1]);
    const minLon = Math.min(...lons) - 0.18;
    const maxLon = Math.max(...lons) + 0.18;
    const minLat = Math.min(...lats) - 0.18;
    const maxLat = Math.max(...lats) + 0.18;
    const x = (lon: number) => PAD + ((lon - minLon) / (maxLon - minLon)) * (W - 2 * PAD);
    const y = (lat: number) => PAD + ((maxLat - lat) / (maxLat - minLat)) * (H - 2 * PAD);
    return { x, y, minLon, maxLon, minLat, maxLat };
  }, [datos]);

  const variableActual = VARIABLES.find(v => v.id === variable)!;
  const base = import.meta.env.BASE_URL || "/";

  return (
    <section id="mapa-comparativo" className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={MapPinned} title="Mapa comparativo de cuencas" />

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
          <p className="text-white/70 leading-relaxed">
            Dónde sube o baja cada variable y con qué nivel de respaldo
            estadístico. Cada marcador es el <strong className="text-white">punto
            representativo</strong> consultado en NASA POWER: una celda de grilla,
            no un promedio de toda la cuenca.
          </p>
          <div className="glass-card p-4 text-sm text-amber-100/80 border-amber-300/20 bg-amber-300/5 flex gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
            <p>
              Los polígonos se dibujan <strong>solo como contorno de
              referencia</strong> y sin relleno: colorearlos sugeriría un valor
              medio espacial que estos datos no tienen.
            </p>
          </div>
        </div>

        {/* Selector de variable */}
        <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Variable a comparar">
          {VARIABLES.map(item => (
            <button
              key={item.id}
              role="tab"
              aria-selected={variable === item.id}
              onClick={() => setVariable(item.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                variable === item.id
                  ? "bg-water-500/20 border-water-400/50 text-water-200"
                  : "bg-white/5 border-white/10 text-white/55 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.etiqueta}
              <span className="block text-[10px] font-normal opacity-70">{item.unidad}</span>
            </button>
          ))}
        </div>

        {cargando && <EstadoCarga mensaje="Cargando series y resultados corregidos…" />}
        {!cargando && error && <EstadoCarga mensaje={error} />}

        {!cargando && datos && limites && (
          <>
            <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-6">
              {/* Mapa SVG */}
              <div className="glass-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <h3 className="font-display font-semibold text-white text-lg">
                    {variableActual.etiqueta} · 2000–2025
                  </h3>
                  <span className="text-xs text-white/45 font-mono">
                    7 puntos de grilla · {datos.resumen.celdas_consultadas} consultas
                  </span>
                </div>
                <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="w-full h-auto"
                  role="img"
                  aria-label={`Mapa de puntos representativos para ${variableActual.etiqueta}`}
                >
                  <defs>
                    <radialGradient id="map-glow" cx="50%" cy="45%" r="65%">
                      <stop offset="0%" stopColor="#0d2f52" stopOpacity="0.75" />
                      <stop offset="100%" stopColor="#061528" stopOpacity="0.2" />
                    </radialGradient>
                  </defs>
                  <rect width={W} height={H} rx="16" fill="url(#map-glow)" />

                  {/* Grilla y rotulación geográfica */}
                  {Array.from({ length: 6 }, (_, i) => {
                    const gx = PAD + (i / 5) * (W - 2 * PAD);
                    const lon = limites.minLon + (i / 5) * (limites.maxLon - limites.minLon);
                    return (
                      <g key={`v${i}`}>
                        <line x1={gx} y1={PAD - 20} x2={gx} y2={H - PAD + 20} stroke="#ffffff" strokeOpacity="0.07" />
                        <text x={gx} y={H - PAD + 40} textAnchor="middle" fill="#ffffff" fillOpacity="0.35" fontSize="11" fontFamily="monospace">
                          {lon.toFixed(2)}°O
                        </text>
                      </g>
                    );
                  })}
                  {Array.from({ length: 6 }, (_, i) => {
                    const gy = PAD + (i / 5) * (H - 2 * PAD);
                    const lat = limites.maxLat - (i / 5) * (limites.maxLat - limites.minLat);
                    return (
                      <g key={`h${i}`}>
                        <line x1={PAD - 20} y1={gy} x2={W - PAD + 20} y2={gy} stroke="#ffffff" strokeOpacity="0.07" />
                        <text x={PAD - 28} y={gy + 4} textAnchor="end" fill="#ffffff" fillOpacity="0.35" fontSize="11" fontFamily="monospace">
                          {Math.abs(lat).toFixed(2)}°S
                        </text>
                      </g>
                    );
                  })}

                  {/* Contornos de cuenca: solo referencia, nunca rellenos */}
                  {datos.cuencas.map(c => (
                    <g key={c.codigo}>
                      <polygon
                        points={c.ring.map(p => `${limites.x(p[0])},${limites.y(p[1])}`).join(" ")}
                        fill="none"
                        stroke="#ffffff"
                        strokeOpacity={codigo === c.codigo ? 0.42 : 0.16}
                        strokeWidth={codigo === c.codigo ? 1.8 : 1.1}
                        strokeDasharray="6 5"
                      />
                      <text
                        x={limites.x(c.centroide[0])}
                        y={limites.y(c.centroide[1]) - 26}
                        textAnchor="middle"
                        fill="#ffffff"
                        fillOpacity={codigo === c.codigo ? 0.75 : 0.38}
                        fontSize="12"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {c.codigo}
                      </text>
                    </g>
                  ))}

                  {/* Puntos representativos */}
                  {porVariable.map(r => {
                    const cx = limites.x(r.longitud);
                    const cy = limites.y(r.latitud);
                    const color = colorDireccion(r.direccion);
                    const activo = r.codigo === seleccionado?.codigo;
                    const opacidad = r.categoria === "sin_evidencia" ? 0.22 : r.categoria === "nominal" ? 0.45 : 0.95;
                    return (
                      <g
                        key={r.codigo}
                        onClick={() => setCodigo(r.codigo)}
                        className="cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={`${r.cuenca}: ${r.direccion}, ${CATEGORIAS[r.categoria].etiqueta}`}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setCodigo(r.codigo); }}
                      >
                        <title>{`${r.cuenca} · ${r.direccion} · ${CATEGORIAS[r.categoria].etiqueta} · p corregido ${fmtP(r.p_preblanqueado)}`}</title>
                        {r.categoria === "robusta" && (
                          <circle cx={cx} cy={cy} r="22" fill="none" stroke={color} strokeOpacity="0.4" strokeWidth="2" />
                        )}
                        {activo && (
                          <circle cx={cx} cy={cy} r="27" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.3" strokeDasharray="3 4" />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={r.categoria === "sin_evidencia" ? 10 : 14}
                          fill={color}
                          fillOpacity={opacidad}
                          stroke={r.categoria === "nominal" ? color : "#e2e8f0"}
                          strokeOpacity={r.categoria === "robusta" ? 0.95 : 0.7}
                          strokeWidth={r.categoria === "robusta" ? 2.4 : 1.6}
                          strokeDasharray={r.categoria === "nominal" ? "4 3" : undefined}
                        />
                        <text
                          x={cx}
                          y={cy + 5}
                          textAnchor="middle"
                          fontSize="15"
                          fontWeight="800"
                          fill={r.categoria === "sin_evidencia" ? "#ffffff" : "#061528"}
                        >
                          {direccionSimbolo(r.direccion)}
                        </text>
                      </g>
                    );
                  })}

                  <text x={W - PAD} y={30} textAnchor="end" fill="#ffffff" fillOpacity="0.3" fontSize="11">
                    Esquema de ubicación · no es cartografía oficial
                  </text>
                </svg>

                {/* Leyenda */}
                <div className="mt-4 pt-4 border-t border-white/10 grid sm:grid-cols-2 gap-4 text-xs text-white/60">
                  <div className="space-y-2">
                    <p className="text-white/45 uppercase tracking-wider text-[10px]">Dirección</p>
                    <div className="flex flex-wrap gap-4">
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-amber-400 inline-flex items-center justify-center text-[10px] text-nasa-dark font-bold">↑</span> Sube</span>
                      <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-sky-400 inline-flex items-center justify-center text-[10px] text-nasa-dark font-bold">↓</span> Baja</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white/45 uppercase tracking-wider text-[10px]">Respaldo</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>◎ anillo = robusta</span>
                      <span>◌ discontinuo = indicio nominal</span>
                      <span>● tenue = sin evidencia</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalle del punto */}
              <div className="glass-card p-6 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-water-300 mb-1">Punto seleccionado</p>
                    <h3 className="font-display text-xl font-bold text-white">{seleccionado?.cuenca}</h3>
                    <p className="text-sm text-white/50">{variableActual.etiqueta} · {variableActual.unidad}</p>
                  </div>
                  <Crosshair className="w-6 h-6 text-water-400 shrink-0" />
                </div>

                {seleccionado && (
                  <>
                    <div className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-semibold mb-5 ${
                      seleccionado.categoria === "robusta"
                        ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                        : seleccionado.categoria === "nominal"
                        ? "bg-amber-300/10 text-amber-200 border border-amber-300/25"
                        : "bg-white/5 text-white/50 border border-white/10"
                    }`}>
                      {direccionSimbolo(seleccionado.direccion)} {CATEGORIAS[seleccionado.categoria].etiqueta}
                    </div>

                    <div className="space-y-3 text-sm">
                      <FilaValor label="Pendiente de Sen" valor={`${seleccionado.direccion === "sube" ? "+" : ""}${fmtNum(seleccionado.sen_slope_por_decada)} ${seleccionado.unidad}/década`} destacado />
                      <FilaValor label="IC 95 % aprox." valor={`[${fmtNum(seleccionado.ic95_inf)}, ${fmtNum(seleccionado.ic95_sup)}]`} />
                      <FilaValor label="p nominal (MK)" valor={fmtP(seleccionado.p_nominal)} />
                      <FilaValor label="p con preblanqueamiento" valor={fmtP(seleccionado.p_preblanqueado)} />
                      <FilaValor label="q de Benjamini–Hochberg" valor={fmtP(seleccionado.q_bh_preblanqueado)} />
                      <FilaValor label="Autocorrelación r1" valor={fmtNum(seleccionado.r1_sin_tendencia, 3)} />
                      <FilaValor label="Observaciones" valor={`${seleccionado.n} años (${seleccionado.periodo[0]}–${seleccionado.periodo[1]})`} />
                      <FilaValor label="Celda consultada" valor={`${fmtNum(seleccionado.latitud, 2)}, ${fmtNum(seleccionado.longitud, 2)}`} />
                    </div>

                    <p className="mt-5 text-xs text-white/45 leading-relaxed">
                      {CATEGORIAS[seleccionado.categoria].descripcion}. Valor de una celda
                      de grilla: no describe toda la superficie de la cuenca.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Matriz comparativa 7 x 6 */}
            <div className="glass-card mt-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">Matriz cuencas × variables</h3>
                  <p className="text-xs text-white/50 mt-1">Tocá una celda para verla en el mapa. Flecha = dirección de la pendiente de Sen.</p>
                </div>
                <div className="flex gap-3 text-[11px] text-white/55">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Robusta</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-300" /> Indicio</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white/25" /> Sin evidencia</span>
                </div>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[720px] text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-xs uppercase tracking-wider text-white/45 py-2 pr-3">Cuenca</th>
                      {VARIABLES.map(v => (
                        <th key={v.id} className={`text-center text-xs font-medium py-2 px-2 ${v.id === variable ? "text-water-300" : "text-white/55"}`}>
                          {v.corta}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.cuencas.map(c => (
                      <tr key={c.codigo} className="border-t border-white/[0.06]">
                        <td className="py-2.5 pr-3 text-white/70 whitespace-nowrap">
                          <span className="font-mono text-xs text-white/40 mr-2">{c.codigo}</span>
                          {c.nombre.replace("Cuenca ", "")}
                        </td>
                        {VARIABLES.map(v => {
                          const r = datos.resultados.find(x => x.codigo === c.codigo && x.variable === v.id);
                          return (
                            <td key={v.id} className="px-2 py-2 text-center">
                              <button
                                onClick={() => { setVariable(v.id); setCodigo(c.codigo); }}
                                title={r ? `${c.nombre} · ${v.etiqueta}: ${fmtNum(r.sen_slope_por_decada)} ${r.unidad}/década · p corregido ${fmtP(r.p_preblanqueado)} · ${CATEGORIAS[r.categoria].etiqueta}` : ""}
                                aria-label={r ? `${c.codigo} ${v.etiqueta} ${CATEGORIAS[r.categoria].etiqueta}` : "sin datos"}
                                className={`mx-auto w-11 h-9 rounded-lg border text-base font-bold transition-all hover:scale-110 ${
                                  v.id === variable && c.codigo === codigo ? "ring-2 ring-white/60" : ""
                                } ${
                                  r?.categoria === "robusta"
                                    ? "border-emerald-400/40 bg-emerald-400/10"
                                    : r?.categoria === "nominal"
                                    ? "border-amber-300/30 bg-amber-300/[0.07]"
                                    : "border-white/10 bg-white/[0.03]"
                                }`}
                                style={{ color: r ? (r.categoria === "sin_evidencia" ? "#ffffff55" : colorDireccion(r.direccion)) : undefined }}
                              >
                                {r ? direccionSimbolo(r.direccion) : "—"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
              <p className="max-w-3xl leading-relaxed">
                <strong className="text-white/70">Límite espacial:</strong> {datos.resumen.grupos_series_duplicadas} grupos de series
                tienen valores idénticos (por ejemplo CC y CE), compatibles con celdas de grilla compartidas.
                No son réplicas independientes. Ver <a href="#respaldo-estadistico" className="text-water-400 underline underline-offset-2">respaldo estadístico</a>.
              </p>
              <div className="flex gap-3">
                <a href={`${base}data/robustez_estadistica.csv`} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                  <Download className="w-3.5 h-3.5" /> CSV corregido
                </a>
                <a href={`${base}data/robustez_estadistica.json`} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                  <Download className="w-3.5 h-3.5" /> JSON
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FilaValor({ label, valor, destacado = false }: { label: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] pb-2">
      <span className="text-white/45 text-xs">{label}</span>
      <span className={`text-right font-mono ${destacado ? "text-water-300 font-semibold" : "text-white/80"}`}>{valor}</span>
    </div>
  );
}
