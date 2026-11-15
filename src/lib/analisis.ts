/** Tipos y carga de los productos derivados del análisis de tendencias (2026). */

export type Direccion = "sube" | "baja" | "estable";
export type Categoria = "robusta" | "nominal" | "sin_evidencia";

export interface ResultadoRobusto {
  codigo: string;
  cuenca: string;
  variable: string;
  unidad: string;
  latitud: number;
  longitud: number;
  parametro: string;
  n: number;
  periodo: [number, number];
  sen_slope_por_decada: number;
  ic95_inf: number;
  ic95_sup: number;
  p_publicado: number;
  p_nominal: number;
  p_varianza_ajustada: number;
  p_preblanqueado: number;
  r1_bruto: number;
  r1_sin_tendencia: number;
  n_efectivo: number;
  direccion: Direccion;
  q_bh_nominal: number;
  q_bh_preblanqueado: number;
  significativa_nominal: boolean;
  significativa_bonferroni: boolean;
  significativa_bh_nominal: boolean;
  significativa_preblanqueada: boolean;
  robusta: boolean;
  categoria: Categoria;
}

export interface ResumenRobustez {
  n_pruebas: number;
  alpha: number;
  umbral_bonferroni: number;
  probabilidad_al_menos_un_falso_positivo: number;
  significativas_nominal: number;
  significativas_bonferroni: number;
  significativas_bh_nominal: number;
  significativas_preblanqueadas: number;
  significativas_varianza_ajustada: number;
  robustas: number;
  robustas_sin_series_duplicadas: number;
  robustas_precipitacion: number;
  significativas_precipitacion_nominal: number;
  r1_mediana: number;
  r1_maximo: number;
  r1_positivas: number;
  grupos_series_duplicadas: number;
  series_duplicadas: number;
  celdas_consultadas: number;
  sequia_2020_2023: {
    puntos_con_anomalia_negativa: number;
    total_puntos: number;
    anomalia_promedio_porcentaje: number;
    anios_bajo_percentil25: number;
    anios_evaluados: number;
  };
}

export interface SequiaPunto {
  codigo: string;
  cuenca: string;
  media_2000_2019_mm: number;
  media_2020_2023_mm: number;
  anomalia_mm: number;
  anomalia_porcentaje: number;
  anios_bajo_percentil25: number;
  anios_evento: number;
  valores_2020_2023: { anio: number; valor: number }[];
}

export interface ConsistenciaPunto {
  codigo: string;
  cuenca: string;
  correlacion_precip_humedad: number;
  signos_tendencia_coinciden: boolean;
  pendiente_precipitacion: number;
  pendiente_humedad: number;
}

export interface CasoEstudio extends ResultadoRobusto {
  years: number[];
  values: number[];
  media_serie: number;
  cambio_total_estimado: number;
  seleccion: string;
}

export interface CuencaGeo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  area_km2: number;
  ring: [number, number][];
  centroide: [number, number];
}

export interface Observacion {
  codigo: string;
  variable: string;
  anio: number;
  valor: number;
  unidad: string;
  latitud: number;
  longitud: number;
  fecha_descarga: string;
}

export interface DatosAnalisis {
  cuencas: CuencaGeo[];
  resultados: ResultadoRobusto[];
  resumen: ResumenRobustez;
  sequia: SequiaPunto[];
  consistencia: ConsistenciaPunto[];
  caso: CasoEstudio;
  contraste: CasoEstudio;
  seriesDuplicadas: { series: string[]; codigos: string[] }[];
  meta: {
    fuente_series: string;
    fuente_resultados: string;
    generado_por: string;
    fuentes_externas: { tipo: string; referencia: string; url: string; uso: string }[];
    metodos: Record<string, string>;
    advertencias: string[];
  };
  series: Observacion[];
}

export const VARIABLES: { id: string; etiqueta: string; unidad: string; corta: string }[] = [
  { id: "precipitacion", etiqueta: "Precipitación", unidad: "mm/año", corta: "Lluvia" },
  { id: "temperatura", etiqueta: "Temperatura media", unidad: "°C", corta: "Temp." },
  { id: "temperatura_maxima", etiqueta: "Temperatura máxima", unidad: "°C", corta: "T. máx." },
  { id: "viento", etiqueta: "Velocidad del viento", unidad: "m/s", corta: "Viento" },
  { id: "humedad_suelo", etiqueta: "Humedad del suelo", unidad: "fracción", corta: "Humedad" },
  { id: "radiacion_solar", etiqueta: "Radiación solar", unidad: "kWh/m²/día", corta: "Radiación" },
];

export const CATEGORIAS: Record<Categoria, { etiqueta: string; descripcion: string }> = {
  robusta: {
    etiqueta: "Robusta",
    descripcion: "p < 0,05 tras preblanqueamiento y q de Benjamini–Hochberg ≤ 0,05",
  },
  nominal: {
    etiqueta: "Indicio nominal",
    descripcion: "p < 0,05 sin corregir; no resiste autocorrelación o las 42 pruebas",
  },
  sin_evidencia: { etiqueta: "Sin evidencia", descripcion: "No se detecta tendencia con estos datos" },
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const fields = line.split(",");
    return Object.fromEntries(headers.map((header, i) => [header, fields[i]]));
  });
}

function base() {
  return import.meta.env.BASE_URL || "/";
}

let cache: Promise<DatosAnalisis> | null = null;

export function cargarAnalisis(): Promise<DatosAnalisis> {
  if (cache) return cache;
  cache = (async () => {
    const [geoRes, jsonRes, trendRes, seriesRes] = await Promise.all([
      fetch(`${base()}data/cuencas.geojson`),
      fetch(`${base()}data/robustez_estadistica.json`),
      fetch(`${base()}data/trend_results.csv`),
      fetch(`${base()}data/nasa_power_anual.csv`),
    ]);
    if (!geoRes.ok || !jsonRes.ok || !trendRes.ok || !seriesRes.ok) {
      throw new Error("No se pudieron cargar los productos del análisis estadístico.");
    }
    const [geojson, payload, trendText, seriesText] = await Promise.all([
      geoRes.json(),
      jsonRes.json(),
      trendRes.text(),
      seriesRes.text(),
    ]);

    const cuencas: CuencaGeo[] = geojson.features.map((f: any) => {
      const ring: [number, number][] = f.geometry.coordinates[0];
      const xs = ring.map(p => p[0]);
      const ys = ring.map(p => p[1]);
      return {
        id: f.properties.id,
        codigo: f.properties.codigo,
        nombre: f.properties.nombre,
        descripcion: f.properties.descripcion,
        area_km2: f.properties.area_km2,
        ring,
        centroide: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2],
      };
    });

    // Verificamos que el CSV publicado y el JSON derivado hablen de las mismas series.
    const trendRows = parseCsv(trendText);
    const resultados: ResultadoRobusto[] = payload.resultados;
    if (trendRows.length !== resultados.length) {
      throw new Error("El CSV de tendencias y el JSON de robustez no tienen la misma cantidad de series.");
    }

    const series: Observacion[] = parseCsv(seriesText).map(row => ({
      codigo: row.codigo,
      variable: row.variable,
      anio: Number(row.anio),
      valor: Number(row.valor),
      unidad: row.unidad,
      latitud: Number(row.latitud),
      longitud: Number(row.longitud),
      fecha_descarga: row.fecha_descarga,
    }));

    return {
      cuencas,
      resultados,
      resumen: payload.resumen,
      sequia: payload.validacion_fuente_documental,
      consistencia: payload.consistencia_interna,
      caso: payload.caso_estudio,
      contraste: payload.caso_contraste,
      seriesDuplicadas: payload.series_duplicadas,
      meta: payload.meta,
      series,
    } satisfies DatosAnalisis;
  })().catch(err => {
    cache = null;
    throw err;
  });
  return cache;
}

export function fmtP(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value < 0.0001) return "<0,0001";
  return value.toFixed(4).replace(".", ",");
}

export function fmtNum(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(decimals).replace(".", ",");
}

export function direccionSimbolo(direccion: Direccion): string {
  return direccion === "sube" ? "↑" : direccion === "baja" ? "↓" : "→";
}

export function colorDireccion(direccion: Direccion): string {
  return direccion === "sube" ? "#F59E0B" : direccion === "baja" ? "#38BDF8" : "#94A3B8";
}
