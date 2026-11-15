import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CloudSun,
  Database,
  Download,
  ExternalLink,
  Layers,
  Mountain,
  Play,
  Waves,
} from "lucide-react";
import { SectionHeading } from "./shared";

const base = import.meta.env.BASE_URL;

type Datos = {
  enso: any;
  escenarios: any;
  inventario: any;
  validacion: any;
  mensual: any;
};

function num(v: any, d = 1) {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(d) : "—";
}

function p(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? (n < 0.001 ? "<0,001" : n.toFixed(3).replace(".", ",")) : "—";
}

function colorFase(fase: string) {
  if (fase === "El Niño") return "bg-orange-500/15 text-orange-200 border-orange-400/25";
  if (fase === "La Niña") return "bg-sky-500/15 text-sky-200 border-sky-400/25";
  return "bg-white/5 text-white/50 border-white/10";
}

export default function Correccion2026Section() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    const urls = [
      "data/enso_atribucion.json",
      "data/escenarios_enso_3_6_meses.json",
      "data/inventario_cuencas.json",
      "data/validacion_estacion_cordoba.json",
      "data/enso_mensual_estacion.json",
    ];
    Promise.all(
      urls.map(async (u: string) => {
        const r = await fetch(`${base}${u}`);
        if (!r.ok) throw new Error(`No se pudo cargar ${u}`);
        return r.json();
      })
    )
      .then(([enso, escenarios, inventario, validacion, mensual]) => {
        if (activo) setDatos({ enso, escenarios, inventario, validacion, mensual });
      })
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, []);

  const visor = `${base}simulacion-2d/index.html`;
  const fasesEscenario: [string, any][] = datos
    ? (Object.entries(datos.escenarios.fases) as [string, any][])
    : [];

  return (
    <section id="correccion-2026" className="section-alt py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Layers} title="Cuencas completas y atribución ENSO: corrección 2026" />
        <p className="text-white/65 leading-relaxed max-w-4xl mb-10">
          Esta sección corrige tres lecturas anteriores del sitio: el análisis
          geomorfológico está casi completo, <strong className="text-white">sí</strong> se
          atribuyen tendencias y variabilidad a El Niño / La Niña con ONI /
          Niño 3.4, y las observaciones sobre predicciones, gemelo digital y
          estaciones locales ya tienen una solución publicada y verificable.
        </p>

        {error && (
          <div className="glass-card p-5 border-amber-300/20 text-amber-100/80 text-sm mb-8">
            No se pudieron cargar algunos JSON de la corrección. Los archivos están en
            <code className="mx-1">public/data/</code> y pueden revisarse directamente.
          </div>
        )}

        {/* ---------------- CUENCAS / 2D ---------------- */}
        <div id="cuencas" className="scroll-mt-24 mb-16">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <span className="tag-orange inline-block mb-3">01 · Análisis de cuencas</span>
              <h3 className="font-display font-bold text-2xl lg:text-3xl text-white flex items-center gap-3">
                <Mountain className="w-7 h-7 text-water-400" /> Casi todo el flujo está hecho
              </h3>
              <p className="text-sm text-white/60 mt-3 max-w-3xl leading-relaxed">
                {datos?.inventario.estado ??
                  "QGIS, DEM, curvas, tablas EVA, GeoJSON, visores 2D/3D y scripts de generación están implementados en el paquete local del equipo."}
              </p>
            </div>
            <div className="glass-card px-5 py-4 min-w-[240px]">
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Paquete de trabajo</p>
              <p className="font-mono text-2xl text-water-300">&gt;20 GB</p>
              <p className="text-xs text-white/45 mt-1">{datos?.inventario.decision_repo ?? "No versionado por tamaño; inventario y visor integrados."}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="glass-card p-5">
                <h4 className="font-display font-semibold text-white mb-3">Raíz del proyecto</h4>
                <p className="text-xs text-white/55 leading-relaxed mb-3">
                  {datos?.inventario.raiz?.proyecto_qgis} · TIFF infrarrojo de 795 MB · {datos?.inventario.raiz?.tablas_eva?.length ?? 6} tablas EVA.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(datos?.inventario.raiz?.scripts_y_visores ?? ["generar_todo.py", "multi_2d.html", "multi_3d.html", "rejilla_dems.py", "run_all.py"]).map((f: string) => (
                    <span key={f} className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 border border-white/10 text-white/55">{f}</span>
                  ))}
                </div>
              </div>
              <div className="glass-card p-5">
                <h4 className="font-display font-semibold text-white mb-3">Cuenca 1 · pipeline</h4>
                <ol className="space-y-1.5 text-xs text-white/55">
                  {(datos?.inventario.cuenca_1?.pipeline ?? [
                    "QGIS y delimitación",
                    "DEM y curvas",
                    "Tabla EVA",
                    "GeoJSON de inundación",
                    "Visor 2D y 3D",
                  ]).map((paso: string, i: number) => (
                    <li key={paso} className="flex gap-2"><span className="font-mono text-water-400">{String(i + 1).padStart(2, "0")}</span>{paso}</li>
                  ))}
                </ol>
              </div>
              <div className="glass-card p-4 sm:col-span-2">
                <div className="grid sm:grid-cols-2 gap-3">
                  {(datos?.inventario.capturas ?? []).map((c: any) => (
                    <figure key={c.archivo} className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                      <img src={`${base}${c.archivo.replace("public/", "")}`} alt={c.descripcion} className="w-full h-44 object-contain bg-[#101820]" />
                      <figcaption className="text-[11px] text-white/45 p-3 leading-relaxed">{c.descripcion}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="font-display font-semibold text-white">Simulación de llenado 2D integrada</h4>
                <a href={visor} target="_blank" rel="noopener noreferrer" className="text-xs text-water-300 hover:text-water-200 inline-flex items-center gap-1">
                  Abrir <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0a0a23]">
                <iframe src={visor} title="Simulación de llenado 2D de Cuenca 1" className="w-full h-[420px] border-0" loading="lazy" />
              </div>
              <p className="text-[11px] text-white/45 mt-3 leading-relaxed">
                Vista funcional sin tiles externos ni API key: la forma azul y el límite naranja se digitalizaron de la captura real; la EVA quedó calibrada en 809,58 hm³ / 6,51 km² a cota 1167 m. Las coordenadas son aproximadas; el <code>data.js</code> del generador original las reemplaza con exactitud GIS.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 text-xs">
                <a href={`${base}simulacion-2d/index_2d_original.html`} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> HTML recibido (normalizado)
                </a>
                <a href={`${base}data/inventario_cuencas.json`} download className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Inventario JSON
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- ENSO ---------------- */}
        <div id="enso" className="scroll-mt-24">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <span className="tag-orange inline-block mb-3">02 · Atribución climática</span>
              <h3 className="font-display font-bold text-2xl lg:text-3xl text-white flex items-center gap-3">
                <CloudSun className="w-7 h-7 text-eco-400" /> Sí: El Niño y La Niña explican parte de la señal
              </h3>
              <p className="text-sm text-white/65 mt-3 max-w-3xl leading-relaxed">
                {datos?.enso.respuesta_directa ??
                  "Sí: el sitio atribuye tendencias y variabilidad a El Niño / La Niña usando ONI de NOAA CPC, NASA POWER y una estación observada."}
              </p>
            </div>
            <div className="glass-card px-5 py-4 min-w-[220px] border-emerald-400/20 bg-emerald-400/[0.04]">
              <p className="font-mono text-2xl text-emerald-300">+{num(datos?.mensual?.diferencia_nino_menos_nina_mm_por_mes ?? 17.3)} mm/mes</p>
              <p className="text-xs text-white/55 mt-1">El Niño − La Niña · estación real</p>
              <p className="text-xs text-emerald-200/80 mt-1">IC95 +{num(datos?.mensual?.ic95_bootstrap_por_bloques_anuales?.[0] ?? 3.6)} a +{num(datos?.mensual?.ic95_bootstrap_por_bloques_anuales?.[1] ?? 30.6)} · p={p(datos?.mensual?.p_permutacion_bloques_una_cola ?? 0.028)}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-5"><p className="font-mono text-xl text-water-300">+{num(datos?.enso?.composites_fase_media?.find((c: any) => c.variable === "precipitacion")?.diferencia_nino_menos_nina ?? 68.7)} mm/año</p><p className="text-xs text-white/45 mt-1">Compuesto anual NASA POWER, El Niño − La Niña</p></div>
            <div className="glass-card p-5"><p className="font-mono text-xl text-water-300">{num(datos?.enso?.metodo?.n_pruebas ?? 504, 0)}</p><p className="text-xs text-white/45 mt-1">Pruebas parciales: 4 ventanas ONI × 3 retardos × 42 series</p></div>
            <div className="glass-card p-5"><p className="font-mono text-xl text-water-300">r = {num(datos?.validacion?.correlacion_pearson ?? 0.705, 2)}</p><p className="text-xs text-white/45 mt-1">Estación observada vs celda CC, 2000–2023</p></div>
            <div className="glass-card p-5"><p className="font-mono text-xl text-water-300">{num(datos?.enso?.fases_anuales?.filter((f: any) => f.fase_media === "El Niño").length ?? 9, 0)} / {num(datos?.enso?.fases_anuales?.filter((f: any) => f.fase_media === "La Niña").length ?? 11, 0)}</p><p className="text-xs text-white/45 mt-1">Años El Niño / La Niña en 2000–2025</p></div>
          </div>

          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-6">
            <div className="glass-card p-6">
              <h4 className="font-display font-semibold text-white mb-4">Resultados de la atribución</h4>
              <ul className="space-y-3 text-sm text-white/65 leading-relaxed">
                {(datos?.enso?.afirmaciones_clave ?? [
                  "Sí: la serie mensual real del Observatorio Córdoba atribuye +17.3 mm/mes a El Niño frente a La Niña (p por bloques = 0.028).",
                  "La atribución anual de precipitación es positiva: +68.7 mm/año entre fases.",
                  "La humedad del suelo y la temperatura también muestran señales fase-ENSO, con su nivel de evidencia publicado.",
                ]).map((a: string, i: number) => (
                  <li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-eco-400 shrink-0 mt-0.5" />{a}</li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-xs text-white/45 mb-3">Fase austral anual (SON previo → FMA) · 2000–2025</p>
                <div className="flex flex-wrap gap-1.5">
                  {(datos?.enso?.fases_anuales ?? []).map((f: any) => (
                    <span key={f.anio} title={`ONI pico ${num(f.oni_pico, 2)} · ${f.fase_media}`} className={`text-[10px] font-mono px-2 py-1 rounded border ${colorFase(f.fase_media)}`}>
                      {String(f.anio).slice(2)}·{f.fase_media === "El Niño" ? "E" : f.fase_media === "La Niña" ? "L" : "N"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h4 className="font-display font-semibold text-white mb-2">Serie local real, no plantilla vacía</h4>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                Observatorio Córdoba (31,3°S · 64,2°O · 425 m), 288 meses entre 2000 y 2023.
                Contraste con NASA POWER: sesgo {num(datos?.validacion?.sesgo_medio_local_menos_nasa ?? -34.1)} mm/año,
                Spearman {num(datos?.validacion?.correlacion_spearman ?? 0.761, 2)} y mismo signo de tendencia.
              </p>
              <div className="rounded-xl bg-black/25 border border-white/10 p-3 font-mono text-[11px] text-white/65 leading-relaxed mb-4">
                <p className="text-white/35 mb-1"># atribución mensual direccional: 288 observaciones</p>
                <p>El Niño − La Niña = +{num(datos?.mensual?.diferencia_nino_menos_nina_mm_por_mes ?? 17.3)} mm/mes</p>
                <p>IC95 bloques: [{num(datos?.mensual?.ic95_bootstrap_por_bloques_anuales?.[0] ?? 3.6)}, {num(datos?.mensual?.ic95_bootstrap_por_bloques_anuales?.[1] ?? 30.6)}]</p>
                <p>p permutación por bloques = {p(datos?.mensual?.p_permutacion_bloques_una_cola ?? 0.028)}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <a href={`${base}data/validacion_local_cordoba.csv`} download className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Serie anual</a>
                <a href={`${base}data/estacion_cordoba_observatorio_mensual.csv`} download className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> 288 meses</a>
              </div>
            </div>
          </div>

          {/* Escenarios 3–6 meses y soluciones */}
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="font-display font-semibold text-white">Escenarios condicionales 3–6 meses</h4>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-amber-300/10 text-amber-200 border border-amber-300/20">No es pronóstico</span>
              </div>
              <p className="text-xs text-white/55 leading-relaxed mb-4">
                {datos?.escenarios.interpretacion ?? "Bandas históricas por fase ONI, publicadas como planificación; no se proyecta la persistencia del evento actual."}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-xs border-collapse">
                  <thead><tr className="text-white/40 uppercase tracking-wider"><th className="text-left py-2 px-2">Fase</th><th className="text-right py-2 px-2">3 meses</th><th className="text-right py-2 px-2">6 meses</th><th className="text-right py-2 px-2">P10–P90 (6m)</th></tr></thead>
                  <tbody>
                    {fasesEscenario.map(([nombre, v]) => (
                      <tr key={nombre} className="border-t border-white/[0.06]">
                        <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded-full border text-[10px] ${colorFase(nombre)}`}>{nombre}</span></td>
                        <td className="py-2 px-2 text-right font-mono text-white/70">{num(v.total_3_meses?.mediana)} mm</td>
                        <td className="py-2 px-2 text-right font-mono text-water-300">{num(v.total_6_meses?.mediana)} mm</td>
                        <td className="py-2 px-2 text-right font-mono text-white/45">{num(v.total_6_meses?.p10)}–{num(v.total_6_meses?.p90)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-white/40 mt-3">
                Último ONI ASO 2026: <strong className="text-white/70">+{num(datos?.escenarios?.ultimo_oni?.anomalia ?? 2.46, 2)}</strong>. Se publican las tres fases como alternativas; la fase futura no se anticipa.
              </p>
            </div>

            <div className="glass-card p-6">
              <h4 className="font-display font-semibold text-white mb-4">Cómo quedaron resueltas las tres observaciones</h4>
              <div className="space-y-4 text-sm text-white/60 leading-relaxed">
                <div className="flex gap-3"><Waves className="w-5 h-5 text-water-400 shrink-0 mt-0.5" /><p><strong className="text-white">Predicciones 3–6 meses:</strong> reemplazadas por escenarios condicionales con bandas P10–P90 y advertencia explícita; no hay promesa de pronóstico operativo.</p></div>
                <div className="flex gap-3"><Database className="w-5 h-5 text-eco-400 shrink-0 mt-0.5" /><p><strong className="text-white">Gemelo digital en vivo:</strong> se publica una réplica reproducible —datos, modelo, panel V4 y visor 2D— con estado «simulación sin hardware conectado»; la telemetría de campo no se presenta como activa.</p></div>
                <div className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" /><p><strong className="text-white">Estaciones locales:</strong> la plantilla vacía se eliminó; hay una serie observada real de 288 meses, script de contraste y JSON con métricas.</p></div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 text-xs">
            <a href={`${base}data/enso_atribucion.json`} download className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Análisis ENSO completo</a>
            <a href={`${base}data/enso_atribucion.csv`} download className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> 504 pruebas (.csv)</a>
            <a href={`${base}data/oni_ascii_cpc_1998_2026.txt`} download className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> ONI NOAA CPC</a>
            <a href="https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/65 inline-flex items-center gap-1.5">Fuente oficial <ExternalLink className="w-3.5 h-3.5" /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
