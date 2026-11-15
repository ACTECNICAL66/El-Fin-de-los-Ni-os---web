import { useMemo, useState } from "react";
import { Sigma, FlaskConical, Layers3, ShieldCheck, ExternalLink, Download } from "lucide-react";
import { SectionHeading } from "./shared";
import { useAnalisis } from "@/hooks/useAnalisis";
import { VARIABLES, direccionSimbolo, colorDireccion, fmtNum, fmtP } from "@/lib/analisis";

const base = import.meta.env.BASE_URL || "/";

export default function StatisticalRigorSection() {
  const { datos, cargando, error } = useAnalisis();
  const [filtro, setFiltro] = useState("todas");

  const filas = useMemo(() => {
    if (!datos) return [];
    return filtro === "todas"
      ? datos.resultados
      : datos.resultados.filter(r => r.variable === filtro);
  }, [datos, filtro]);

  return (
    <section id="respaldo-estadistico" className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Sigma} title="Respaldo estadístico: qué cambia al corregir" />

        <p className="text-white/70 leading-relaxed mb-8 max-w-4xl">
          El explorador publica un p de Mann–Kendall por serie. Ese número es
          válido solo bajo sus supuestos. Acá mostramos qué pasa cuando se
          consideran dos cosas que antes faltaban: la <strong className="text-white">memoria temporal</strong> de
          las series y el hecho de haber realizado <strong className="text-white">42 pruebas</strong> a la vez.
        </p>

        {cargando && <div className="glass-card p-10 text-center text-white/60 text-sm">Calculando correcciones…</div>}
        {!cargando && error && <div className="glass-card p-10 text-center text-amber-200 text-sm">{error}</div>}

        {!cargando && datos && (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Layers3 className="w-5 h-5 text-water-400" />
                  <h3 className="font-display font-semibold text-white">1 · Autocorrelación</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  Un año húmedo suele seguir a otro. Mann–Kendall supone años
                  independientes: con autocorrelación positiva la varianza se
                  subestima y los p salen <em>demasiado pequeños</em>, inflando
                  falsos positivos.
                </p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <MiniDato valor={fmtNum(datos.resumen.r1_mediana, 3)} etiqueta="r1 mediana (sin tendencia)" />
                  <MiniDato valor={`${datos.resumen.r1_positivas}/42`} etiqueta="series con r1 > 0,05" />
                </div>
                <p className="text-xs text-white/40 mt-4">
                  Aplicamos corrección de varianza por n efectivo y
                  preblanqueamiento libre de tendencia (TFPW, Yue et al. 2002).
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FlaskConical className="w-5 h-5 text-amber-300" />
                  <h3 className="font-display font-semibold text-white">2 · 42 pruebas</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  Si se prueban 42 hipótesis independientes con α = 0,05, la
                  probabilidad de al menos un falso positivo es del {" "}
                  <strong className="text-amber-200">{(datos.resumen.probabilidad_al_menos_un_falso_positivo * 100).toFixed(1)} %</strong>.
                  Por eso un p aislado no alcanza para declarar un hallazgo.
                </p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <MiniDato valor={fmtP(datos.resumen.umbral_bonferroni)} etiqueta="umbral Bonferroni α/42" />
                  <MiniDato valor="FDR 5 %" etiqueta="Benjamini–Hochberg" />
                </div>
                <p className="text-xs text-white/40 mt-4">
                  Además, {datos.resumen.grupos_series_duplicadas} grupos de series
                  son idénticos: las pruebas no son independientes entre sí.
                </p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-display font-semibold text-white">3 · Criterio del sitio</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  Llamamos <strong className="text-emerald-300">robusta</strong> a una
                  tendencia que conserva p &lt; 0,05 tras preblanquear <em>y</em>{" "}
                  sobrevive al control de FDR sobre las 42 pruebas. Todo lo demás
                  se muestra como indicio o como ausencia de evidencia, nunca
                  como resultado confirmado.
                </p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <MiniDato valor={`${datos.resumen.robustas}`} etiqueta="resultados robustos" />
                  <MiniDato valor={`${datos.resumen.robustas_sin_series_duplicadas}`} etiqueta="señales independientes" />
                </div>
                <p className="text-xs text-white/40 mt-4">
                  {datos.resumen.significativas_precipitacion_nominal} indicios de
                  lluvia con p nominal, pero <strong className="text-white/70">{datos.resumen.robustas_precipitacion} robustos</strong> tras corregir.
                </p>
              </div>
            </div>

            {/* Embudo de significancia */}
            <div className="glass-card p-6 mb-10">
              <h3 className="font-display font-semibold text-white text-lg mb-1">De 23 indicios a 5 resultados sostenidos</h3>
              <p className="text-xs text-white/50 mb-5">Cantidad de series con evidencia de tendencia según el criterio aplicado.</p>
              <div className="space-y-3">
                {[
                  { label: "p nominal < 0,05 (publicado originalmente)", n: datos.resumen.significativas_nominal, color: "#38BDF8" },
                  { label: "p con varianza por n efectivo < 0,05", n: datos.resumen.significativas_varianza_ajustada, color: "#60A5FA" },
                  { label: "p con preblanqueamiento (TFPW) < 0,05", n: datos.resumen.significativas_preblanqueadas, color: "#818CF8" },
                  { label: "Benjamini–Hochberg sobre p nominal", n: datos.resumen.significativas_bh_nominal, color: "#34D399" },
                  { label: "Robustas: TFPW + BH (criterio del sitio)", n: datos.resumen.robustas, color: "#22C55E" },
                  { label: "Bonferroni α/42", n: datos.resumen.significativas_bonferroni, color: "#F87171" },
                ].map(fila => (
                  <div key={fila.label} className="grid grid-cols-[minmax(0,1fr)_40px] sm:grid-cols-[260px_minmax(0,1fr)_40px] items-center gap-3">
                    <span className="text-xs text-white/60 sm:col-span-1 col-span-2">{fila.label}</span>
                    <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(fila.n / 42) * 100}%`, background: fila.color }} />
                    </div>
                    <span className="text-right font-mono text-sm text-white/80">{fila.n}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validación */}
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 mb-10">
              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-white text-lg mb-2">Validación con otra fuente</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  El informe del proyecto documenta la sequía 2020–2023 (La
                  Quebrada al 15 % y San Roque al 30 % de capacidad en 2023) y
                  una <a href="https://www.lavoz.com.ar/ciudadanos/tras-las-lluvias-los-diques-de-cordoba-subieron-pero-siguen-lejos-del-nivel-esperable-para-esta-epoca/" target="_blank" rel="noopener noreferrer" className="text-water-300 underline underline-offset-2 hover:text-water-200">fuente contemporánea independiente</a> confirma tres años consecutivos de lluvia por debajo de lo habitual y embalses lejos del vertedero. Contrastamos ese evento, no su causa, con nuestra serie de precipitación tomando 2000–2019 como referencia.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <MiniDato valor={`${datos.resumen.sequia_2020_2023.puntos_con_anomalia_negativa}/${datos.resumen.sequia_2020_2023.total_puntos}`} etiqueta="puntos con menos lluvia" />
                  <MiniDato valor={`${fmtNum(datos.resumen.sequia_2020_2023.anomalia_promedio_porcentaje, 1)} %`} etiqueta="anomalía promedio" />
                  <MiniDato valor={`${datos.resumen.sequia_2020_2023.anios_bajo_percentil25}/${datos.resumen.sequia_2020_2023.anios_evaluados}`} etiqueta="años bajo percentil 25" />
                </div>
                <p className="text-xs text-white/45 leading-relaxed">
                  La grilla reproduce cualitativamente la sequía documentada.
                  <strong className="text-white/70"> Es una validación de consistencia de un evento</strong>,
                  no una comparación instrumento a instrumento ni una prueba de la
                  tendencia de largo plazo.
                </p>
                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs text-water-300 hover:text-water-200 list-none">
                    ▸ Ver anomalía por cuenca
                  </summary>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-white/40 text-left"><th className="py-1">Cuenca</th><th className="py-1 text-right">2000–2019</th><th className="py-1 text-right">2020–2023</th><th className="py-1 text-right">Anomalía</th></tr></thead>
                      <tbody>
                        {datos.sequia.map(s => (
                          <tr key={s.codigo} className="border-t border-white/[0.06] text-white/65">
                            <td className="py-1.5">{s.codigo}</td>
                            <td className="py-1.5 text-right font-mono">{fmtNum(s.media_2000_2019_mm, 0)} mm</td>
                            <td className="py-1.5 text-right font-mono">{fmtNum(s.media_2020_2023_mm, 0)} mm</td>
                            <td className="py-1.5 text-right font-mono text-sky-300">{fmtNum(s.anomalia_porcentaje, 1)} %</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                {datos.meta.fuentes_externas?.length > 0 && (
                  <details className="mt-3 group">
                    <summary className="cursor-pointer text-xs text-water-300 hover:text-water-200 list-none">
                      ▸ Ver fuentes documentales y su alcance
                    </summary>
                    <ul className="mt-3 space-y-2.5">
                      {datos.meta.fuentes_externas.map(f => (
                        <li key={f.url} className="text-xs leading-relaxed text-white/50">
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-water-300 hover:text-water-200 underline underline-offset-2">{f.referencia}</a>
                          <span className="block text-white/35">{f.tipo} · {f.uso}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              <div className="glass-card p-6">
                <h3 className="font-display font-semibold text-white text-lg mb-2">Validación con una serie local real</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">
                  La plantilla vacía se reemplazó por el <strong className="text-white">Observatorio Córdoba</strong>{" "}
                  (31,3°S · 64,2°O · 425 m; 288 meses, 2000–2023). El contraste anual con la celda CC más cercana da{" "}
                  <strong className="text-white">r = 0,71</strong>, Spearman 0,76, sesgo −34,1 mm/año
                  y coincide en el signo de la tendencia. La consistencia interna precipitación–humedad
                  (r = {fmtNum(Math.min(...datos.consistencia.map(c => c.correlacion_precip_humedad)), 2)} a{" "}
                  {fmtNum(Math.max(...datos.consistencia.map(c => c.correlacion_precip_humedad)), 2)}) queda como
                  control secundario del mismo producto modelado, no como fuente independiente.
                </p>
                <div className="rounded-xl bg-black/25 border border-white/10 p-4 font-mono text-[11px] text-white/70 leading-relaxed overflow-x-auto mb-4">
                  <p className="text-white/40 mb-1"># reproducir preparación y contraste</p>
                  <p>python3 scripts/preparar_estacion_cordoba.py</p>
                  <p>python3 scripts/validar_con_estacion.py --salida public/data/validacion_estacion_cordoba.json</p>
                </div>
                <p className="text-xs text-white/45 leading-relaxed mb-4">
                  Es un contraste punto–grilla: respalda la dirección de la señal, pero no reemplaza
                  calibración instrumental ni autoriza a dimensionar obras con una sola estación.
                  La atribución ENSO significativa se detalla en <a href="#enso" className="text-water-300 underline underline-offset-2">/#enso</a>.
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  <a href={`${base}data/validacion_local_cordoba.csv`} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                    <Download className="w-3.5 h-3.5" /> Serie anual real
                  </a>
                  <a href={`${base}data/estacion_cordoba_observatorio_mensual.csv`} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                    <Download className="w-3.5 h-3.5" /> 288 meses
                  </a>
                  <a href="https://github.com/ACTECNICAL66/El-Fin-de-los-Ni-os---web/blob/main/scripts/validar_con_estacion.py" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                    <ExternalLink className="w-3.5 h-3.5" /> Script de contraste
                  </a>
                </div>
              </div>
            </div>

            {/* Tabla completa */}
            <div className="glass-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display font-semibold text-white text-lg">Las 42 pruebas, una por una</h3>
                  <p className="text-xs text-white/50 mt-1">p nominal, p corregido y q de FDR. Descargable para replicar el análisis.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="filtro-variable" className="text-xs text-white/45">Variable</label>
                  <select
                    id="filtro-variable"
                    value={filtro}
                    onChange={e => setFiltro(e.target.value)}
                    className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white/80"
                  >
                    <option value="todas">Todas (42)</option>
                    {VARIABLES.map(v => <option key={v.id} value={v.id}>{v.etiqueta}</option>)}
                  </select>
                </div>
              </div>

              <div className="overflow-auto max-h-[430px] custom-scrollbar rounded-lg border border-white/[0.07]">
                <table className="w-full min-w-[820px] text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#0a1a30] z-10">
                    <tr className="text-white/45 uppercase tracking-wider">
                      <th className="text-left py-2.5 px-3">Cuenca</th>
                      <th className="text-left py-2.5 px-3">Variable</th>
                      <th className="text-right py-2.5 px-3">Sen / década</th>
                      <th className="text-right py-2.5 px-3">p nominal</th>
                      <th className="text-right py-2.5 px-3">p TFPW</th>
                      <th className="text-right py-2.5 px-3">q BH (TFPW)</th>
                      <th className="text-center py-2.5 px-3">Veredicto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map(r => (
                      <tr key={`${r.codigo}-${r.variable}`} className="border-t border-white/[0.05] hover:bg-white/[0.03]">
                        <td className="py-2 px-3 text-white/70 whitespace-nowrap"><span className="font-mono text-white/35 mr-1.5">{r.codigo}</span>{r.cuenca.replace("Cuenca ", "")}</td>
                        <td className="py-2 px-3 text-white/55">{VARIABLES.find(v => v.id === r.variable)?.corta ?? r.variable}</td>
                        <td className="py-2 px-3 text-right font-mono" style={{ color: colorDireccion(r.direccion) }}>
                          {direccionSimbolo(r.direccion)} {fmtNum(r.sen_slope_por_decada, 3)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-white/65">{fmtP(r.p_nominal)}</td>
                        <td className="py-2 px-3 text-right font-mono text-white/65">{fmtP(r.p_preblanqueado)}</td>
                        <td className="py-2 px-3 text-right font-mono text-white/65">{fmtP(r.q_bh_preblanqueado)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.categoria === "robusta" ? "bg-emerald-400/15 text-emerald-300"
                            : r.categoria === "nominal" ? "bg-amber-300/10 text-amber-200"
                            : "bg-white/5 text-white/40"
                          }`}>
                            {r.categoria === "robusta" ? "Robusta" : r.categoria === "nominal" ? "Indicio" : "Sin evidencia"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <a href={`${base}data/robustez_estadistica.csv`} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                  <Download className="w-3.5 h-3.5" /> 42 resultados corregidos (.csv)
                </a>
                <a href={`${base}data/trend_results.csv`} download className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                  <Download className="w-3.5 h-3.5" /> Resultados originales (.csv)
                </a>
                <a href="https://github.com/ACTECNICAL66/El-Fin-de-los-Ni-os---web/blob/main/VALIDACION_Y_ESTADISTICA.md" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70">
                  <ExternalLink className="w-3.5 h-3.5" /> Metodología y referencias
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-300/5 px-5 py-4 text-sm text-emerald-100/80 leading-relaxed">
              <strong className="text-emerald-200">Sí hay atribución a ENSO.</strong> Estas 42 pruebas se
              complementan con 504 correlaciones parciales contra ONI / Niño 3.4, composites
              El Niño / La Niña y una serie mensual observada de 288 meses. El resultado
              significativo es <strong className="text-white">+17,3 mm/mes en El Niño frente a La Niña</strong>{" "}
              (IC95 +3,6 a +30,6; p por bloques = 0,028). Ver{" "}
              <a href="#enso" className="text-water-300 underline underline-offset-2">la sección de atribución ENSO</a>.
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function MiniDato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-2 py-3">
      <p className="font-mono text-lg font-semibold text-water-300">{valor}</p>
      <p className="text-[10px] text-white/45 mt-1 leading-tight">{etiqueta}</p>
    </div>
  );
}
