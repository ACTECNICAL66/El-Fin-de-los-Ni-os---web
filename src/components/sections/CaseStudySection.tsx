import { useMemo } from "react";
import { Microscope, Droplets, TriangleAlert, ArrowRight, MapPin } from "lucide-react";
import { SectionHeading } from "./shared";
import { useAnalisis } from "@/hooks/useAnalisis";
import { VARIABLES, fmtNum, fmtP } from "@/lib/analisis";

const W = 720;
const H = 270;
const PAD = 44;

function SerieChart({ years, values, slopeDecade, unit }: { years: number[]; values: number[]; slopeDecade: number; unit: string }) {
  const geometry = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = (max - min) || 1;
    const lo = min - span * 0.18;
    const hi = max + span * 0.18;
    const x = (i: number) => PAD + (i / (values.length - 1)) * (W - 2 * PAD);
    const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - 2 * PAD);
    const slopeYear = slopeDecade / 10;
    const intercepts = values.map((v, i) => v - slopeYear * (years[i] - years[0])).sort((a, b) => a - b);
    const median = intercepts[Math.floor(intercepts.length / 2)];
    const trend = years.map(year => median + slopeYear * (year - years[0]));
    return { x, y, lo, hi, trend };
  }, [years, values, slopeDecade]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`Serie anual ${years[0]}–${years[years.length - 1]} con recta de Sen`}>
      <defs>
        <linearGradient id="case-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1EB8FF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#1EB8FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map(i => {
        const gy = PAD + (i / 4) * (H - 2 * PAD);
        const value = geometry.hi - (i / 4) * (geometry.hi - geometry.lo);
        return (
          <g key={i}>
            <line x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="#ffffff" strokeOpacity="0.08" />
            <text x={PAD - 8} y={gy + 4} textAnchor="end" fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace">
              {fmtNum(value, unit === "°C" ? 1 : 0)}
            </text>
          </g>
        );
      })}
      {years.filter((_, i) => i % 5 === 0 || i === years.length - 1).map(year => {
        const i = years.indexOf(year);
        return (
          <text key={year} x={geometry.x(i)} y={H - PAD + 20} textAnchor="middle" fill="#ffffff" fillOpacity="0.4" fontSize="10" fontFamily="monospace">
            {year}
          </text>
        );
      })}
      <polygon
        points={`${geometry.x(0)},${H - PAD} ${values.map((v, i) => `${geometry.x(i)},${geometry.y(v)}`).join(" ")} ${geometry.x(values.length - 1)},${H - PAD}`}
        fill="url(#case-fill)"
      />
      <polyline
        points={values.map((v, i) => `${geometry.x(i)},${geometry.y(v)}`).join(" ")}
        fill="none"
        stroke="#48D6FF"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <line
        x1={geometry.x(0)}
        y1={geometry.y(geometry.trend[0])}
        x2={geometry.x(values.length - 1)}
        y2={geometry.y(geometry.trend[geometry.trend.length - 1])}
        stroke="#F8FAFC"
        strokeWidth="2"
        strokeDasharray="7 5"
      />
      {values.map((v, i) => (
        <circle key={i} cx={geometry.x(i)} cy={geometry.y(v)} r="2.6" fill="#48D6FF" />
      ))}
      <text x={W - PAD} y={24} textAnchor="end" fill="#ffffff" fillOpacity="0.45" fontSize="10">
        ── observación anual ── pendiente de Sen
      </text>
    </svg>
  );
}

export default function CaseStudySection() {
  const { datos, cargando, error } = useAnalisis();
  const caso = datos?.caso;
  const contraste = datos?.contraste;
  const variable = VARIABLES.find(v => v.id === caso?.variable);

  return (
    <section id="caso-de-estudio" className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Microscope} title="Un caso concreto: qué se puede decir y qué no" />

        {cargando && <div className="glass-card p-10 text-center text-white/60 text-sm">Cargando el caso de estudio…</div>}
        {!cargando && error && <div className="glass-card p-10 text-center text-amber-200 text-sm">{error}</div>}

        {!cargando && caso && contraste && variable && (
          <>
            <div className="grid lg:grid-cols-[1.35fr_0.65fr] gap-6">
              <div className="glass-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="tag-green inline-block mb-3">Resultado robusto</span>
                    <h3 className="font-display text-2xl font-bold text-white">
                      {caso.cuenca} · {variable.etiqueta}
                    </h3>
                    <p className="text-sm text-white/50 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Punto de grilla ({fmtNum(caso.latitud, 2)}, {fmtNum(caso.longitud, 2)}) · {caso.periodo[0]}–{caso.periodo[1]} · n = {caso.n}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-3xl font-bold text-amber-300">+{fmtNum(caso.sen_slope_por_decada, 2)}</p>
                    <p className="text-xs text-white/45">{caso.unidad} por década (Sen)</p>
                  </div>
                </div>

                <SerieChart years={caso.years} values={caso.values} slopeDecade={caso.sen_slope_por_decada} unit={caso.unidad} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <Dato etiqueta="p (Mann–Kendall)" valor={fmtP(caso.p_nominal)} />
                  <Dato etiqueta="p tras preblanquear" valor={fmtP(caso.p_preblanqueado)} />
                  <Dato etiqueta="q de BH (42 pruebas)" valor={fmtP(caso.q_bh_preblanqueado)} />
                  <Dato etiqueta="IC 95 % aprox." valor={`[${fmtNum(caso.ic95_inf)}, ${fmtNum(caso.ic95_sup)}]`} />
                </div>
                <p className="text-xs text-white/45 mt-4 leading-relaxed">
                  r1 sin tendencia = {fmtNum(caso.r1_sin_tendencia, 3)} (sin persistencia positiva que inflar el test).
                  Cambio acumulado estimado por la recta de Sen: +{fmtNum(caso.cambio_total_estimado, 2)} {caso.unidad} entre {caso.periodo[0]} y {caso.periodo[1]}.
                  Media de la serie: {fmtNum(caso.media_serie, 2)} {caso.unidad}.
                </p>
              </div>

              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="w-5 h-5 text-water-400" />
                    <h3 className="font-display font-semibold text-white">Por qué le importa a quien gestiona el agua</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-white/65 leading-relaxed">
                    <li className="flex gap-2"><ArrowRight className="w-4 h-4 text-water-400 shrink-0 mt-0.5" /> Es la única familia de señales que sobrevive autocorrelación y pruebas múltiples: merece prioridad de monitoreo, no de obra.</li>
                    <li className="flex gap-2"><ArrowRight className="w-4 h-4 text-water-400 shrink-0 mt-0.5" /> Una temperatura media mayor puede aumentar la evaporación y la demanda; <strong className="text-white">no medimos ninguna de las dos</strong>, así que la señal justifica instalar sensores, no calcular pérdidas.</li>
                    <li className="flex gap-2"><ArrowRight className="w-4 h-4 text-water-400 shrink-0 mt-0.5" /> Decisión concreta: colocar un pluviómetro y un sensor de nivel/temperatura en esta cuenca y comparar 3–5 años con la celda de grilla antes de usar la tendencia en reglas de operación.</li>
                    <li className="flex gap-2"><ArrowRight className="w-4 h-4 text-water-400 shrink-0 mt-0.5" /> No implica "hay menos agua": en este punto la precipitación no muestra tendencia robusta.</li>
                  </ul>
                </div>

                <div className="glass-card p-6 border-amber-300/20 bg-amber-300/[0.04]">
                  <div className="flex items-center gap-2 mb-3">
                    <TriangleAlert className="w-5 h-5 text-amber-300" />
                    <h3 className="font-display font-semibold text-white">Límites del resultado</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-white/60 leading-relaxed list-disc pl-4">
                    <li>Un punto de grilla, no un promedio de la cuenca.</li>
                    <li>Reanálisis/modelo, no medición de estación.</li>
                    <li>26 años: serie corta para atribución climática.</li>
                    <li>El IC 95 % de Sen es aproximado y no corrige autocorrelación.</li>
                    <li>Algunas celdas están duplicadas: menos réplicas de lo que parece.</li>
                    <li><strong className="text-emerald-200">Sí se atribuye a ENSO</strong>: 504 pruebas ONI / Niño 3.4 y +17,3 mm/mes en la estación real (p = 0,028); ver /#enso.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contraste honesto */}
            <div className="glass-card mt-6 p-6 grid md:grid-cols-[0.9fr_1.1fr] gap-6">
              <div>
                <span className="tag-orange inline-block mb-3">Lo que NO podemos afirmar</span>
                <h3 className="font-display text-xl font-bold text-white mb-2">
                  {contraste.cuenca} · precipitación
                </h3>
                <p className="text-sm text-white/65 leading-relaxed">
                  Era la señal de lluvia más fuerte del CSV original:{" "}
                  <strong className="text-white">{fmtNum(contraste.sen_slope_por_decada, 1)} mm/década</strong> con
                  p = {fmtP(contraste.p_nominal)}. Al corregir autocorrelación
                  (r1 = {fmtNum(contraste.r1_sin_tendencia, 3)}) el p sube a{" "}
                  {fmtP(contraste.p_preblanqueado)} y el q de FDR a{" "}
                  {fmtP(contraste.q_bh_preblanqueado)}.
                </p>
                <p className="text-xs text-white/45 mt-3 leading-relaxed">
                  Por eso el sitio ya no dice que "llueve menos" en esa cuenca:
                  lo presenta como un indicio y lo contrasta con la estación real
                  del Observatorio Córdoba en /#enso. Es exactamente el tipo de
                  conclusión que cambia al separar tendencia de variabilidad ENSO.
                </p>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/[0.07] p-3">
                <SerieChart years={contraste.years} values={contraste.values} slopeDecade={contraste.sen_slope_por_decada} unit={contraste.unidad} />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-3">
      <p className="text-[10px] text-white/45 leading-tight mb-1">{etiqueta}</p>
      <p className="font-mono text-sm font-semibold text-water-300">{valor}</p>
    </div>
  );
}
