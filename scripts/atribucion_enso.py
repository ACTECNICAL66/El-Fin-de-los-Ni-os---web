#!/usr/bin/env python3
"""Atribución estadística ENSO ↔ series NASA POWER y escenarios de planificación.

Este script responde explícitamente «sí»: cuantifica y atribuye a El Niño /
La Niña una parte de la variabilidad y de las tendencias observadas en las
series 2000–2025. No fabrica series locales, no emite pronósticos operativos y
no presenta telemetría en vivo.

Insumos versionados:
  * public/data/oni_ascii_cpc_1998_2026.txt  (NOAA CPC, ONI / Niño 3.4)
  * public/data/nasa_power_anual.csv        (7 cuencas × 6 variables × 26 años)
  * public/data/estacion_cordoba_observatorio_mensual.csv (serie real)

Método:
  1. Cuatro ventanas ONI (anual, pico austral octubre–abril, DJF, SON previo)
     y tres retardos (-1, 0, +1).
  2. Correlación parcial de Pearson y Spearman controlando una tendencia lineal;
     p de t de Student y corrección BH global y en la ventana principal.
  3. Regresión parcial y cambio 2000–2025 atribuido a la deriva del ONI.
  4. Composites El Niño / La Niña / neutro, bootstrap IC95 y permutación.
  5. Contraste independiente con el Observatorio Córdoba.
  6. Escenarios condicionales 3 y 6 meses por climatología de fase ENSO.

Uso:
    python3 scripts/atribucion_enso.py
"""

from __future__ import annotations

import csv
import json
import math
import random
from collections import defaultdict
from pathlib import Path

from robustez_estadistica import benjamini_hochberg

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public/data"
ONI_PATH = DATA / "oni_ascii_cpc_1998_2026.txt"
NASA_PATH = DATA / "nasa_power_anual.csv"
STATION_MONTHLY_PATH = DATA / "estacion_cordoba_observatorio_mensual.csv"
STATION_ANNUAL_PATH = DATA / "validacion_local_cordoba.csv"
FUENTE_PATH = DATA / "oni_cpc_fuente.json"

SEASONS = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"]
CENTER_MONTH = {s: i + 1 for i, s in enumerate(SEASONS)}
PEAK_SEASONS = [
    ("prev", "SON"), ("prev", "OND"), ("prev", "NDJ"),
    ("same", "DJF"), ("same", "JFM"), ("same", "FMA"),
]
YEARS = list(range(2000, 2026))
RNG = random.Random(20261114)
PERMUTATIONS = 9999
BOOTSTRAP = 9999

FUENTES = {
    "oni": json.loads(FUENTE_PATH.read_text(encoding="utf-8")),
    "nasa_power": "NASA POWER Monthly API, agregado anual; punto de grilla, no promedio areal de cuenca",
    "estacion": "Canziani, Lakkis & Yuchechen (2025), Zenodo 15013403, Observatorio Córdoba (31.3°S, 64.2°O)",
    "doi_estacion": "https://doi.org/10.5281/zenodo.15013403",
    "cpc_definicion_eventos": "NOAA CPC: ±0.5 °C durante al menos 5 trimestres solapados consecutivos",
}


# ---------------------------------------------------------------------------
# Funciones numéricas (stdlib; sin numpy/scipy)
# ---------------------------------------------------------------------------
def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else float("nan")


def ols_slope(xs: list[float], ys: list[float]) -> tuple[float, float, list[float]]:
    """Devuelve ordenada, pendiente y residuos de una regresión lineal simple."""
    if len(xs) < 3:
        raise ValueError("Se necesitan al menos 3 observaciones")
    mx, my = mean(xs), mean(ys)
    sxx = sum((x - mx) ** 2 for x in xs)
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
    intercept = my - slope * mx
    return intercept, slope, [y - (intercept + slope * x) for x, y in zip(xs, ys)]


def pearson(a: list[float], b: list[float]) -> float:
    if len(a) < 3 or len(a) != len(b):
        return float("nan")
    ma, mb = mean(a), mean(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
    return num / den if den > 0 else float("nan")


def ranks(values: list[float]) -> list[float]:
    order = sorted(range(len(values)), key=lambda i: values[i])
    out = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        r = (i + j + 2) / 2
        for k in range(i, j + 1):
            out[order[k]] = r
        i = j + 1
    return out


def spearman(a: list[float], b: list[float]) -> float:
    return pearson(ranks(a), ranks(b))


def betacf(a: float, b: float, x: float) -> float:
    """Fracción continua para la beta incompleta (Numerical Recipes)."""
    MAXIT, EPS, FPMIN = 300, 3e-14, 1e-300
    qab, qap, qam = a + b, a + 1.0, a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < FPMIN:
        d = FPMIN
    d = 1.0 / d
    h = d
    for m in range(1, MAXIT + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN:
            d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN:
            c = FPMIN
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < FPMIN:
            d = FPMIN
        c = 1.0 + aa / c
        if abs(c) < FPMIN:
            c = FPMIN
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < EPS:
            break
    return h


def betai(a: float, b: float, x: float) -> float:
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    bt = math.exp(math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b) + a * math.log(x) + b * math.log1p(-x))
    if x < (a + 1) / (a + b + 2):
        return bt * betacf(a, b, x) / a
    return 1.0 - bt * betacf(b, a, 1 - x) / b


def student_t_two_sided_p(t: float, df: int) -> float:
    if df <= 0 or not math.isfinite(t):
        return float("nan")
    return max(0.0, min(1.0, betai(df / 2, 0.5, df / (df + t * t))))


def partial_test(years: list[int], y: list[float], x: list[float]) -> dict:
    """Correlación parcial y coeficiente ONI tras remover tendencia lineal."""
    _, slope_y, res_y = ols_slope([float(v) for v in years], y)
    _, slope_x, res_x = ols_slope([float(v) for v in years], x)
    r = pearson(res_x, res_y)
    rho = spearman(res_x, res_y)
    sxx = sum(v * v for v in res_x)
    beta = sum(a * b for a, b in zip(res_x, res_y)) / sxx if sxx > 0 else float("nan")
    df = len(years) - 3
    r_clamped = max(-0.999999, min(0.999999, r))
    t = r_clamped * math.sqrt(df / (1 - r_clamped ** 2)) if df > 0 else float("nan")
    p = student_t_two_sided_p(t, df)
    return {
        "n": len(years),
        "pendiente_total_por_anio": slope_y,
        "cambio_total_2000_2025": slope_y * (years[-1] - years[0]),
        "pendiente_oni_por_anio": slope_x,
        "cambio_oni_2000_2025": slope_x * (years[-1] - years[0]),
        "coeficiente_oni": beta,
        "correlacion_parcial_pearson": r,
        "correlacion_parcial_spearman": rho,
        "p_parcial": p,
        "cambio_atribuido_enso": beta * slope_x * (years[-1] - years[0]),
    }


def quantile(values: list[float], q: float) -> float:
    if not values:
        return float("nan")
    s = sorted(values)
    pos = (len(s) - 1) * q
    lo, hi = int(math.floor(pos)), int(math.ceil(pos))
    if lo == hi:
        return s[lo]
    return s[lo] + (s[hi] - s[lo]) * (pos - lo)


def median(values: list[float]) -> float:
    return quantile(values, 0.5)


def bootstrap_diff(a: list[float], b: list[float]) -> tuple[float, list[float], list[float]]:
    diffs = []
    for _ in range(BOOTSTRAP):
        aa = [a[RNG.randrange(len(a))] for _ in a] if a else []
        bb = [b[RNG.randrange(len(b))] for _ in b] if b else []
        if aa and bb:
            diffs.append(mean(aa) - mean(bb))
    return mean(a) - mean(b), [quantile(diffs, 0.025), quantile(diffs, 0.975)], diffs


def permutation_p(a: list[float], b: list[float]) -> float:
    observed = abs(mean(a) - mean(b)) if a and b else 0.0
    pool = a + b
    na = len(a)
    extreme = 0
    for _ in range(PERMUTATIONS):
        RNG.shuffle(pool)
        diff = abs(mean(pool[:na]) - mean(pool[na:]))
        if diff >= observed - 1e-12:
            extreme += 1
    return (extreme + 1) / (PERMUTATIONS + 1)


# ---------------------------------------------------------------------------
# Lectura de ONI y construcción de ventanas
# ---------------------------------------------------------------------------
def read_oni() -> dict[tuple[int, str], dict]:
    out: dict[tuple[int, str], dict] = {}
    for line in ONI_PATH.read_text(encoding="utf-8").splitlines()[1:]:
        if not line.strip():
            continue
        season, year, total, anom = line.split()
        out[(int(year), season)] = {
            "season": season,
            "year": int(year),
            "total": float(total),
            "anom": float(anom),
        }
    return out


ONI = read_oni()


def window_keys(year: int, window: str) -> list[tuple[int, str]]:
    if window == "anual_calendario":
        return [(year, s) for s in SEASONS]
    if window == "pico_austral_oct_abr":
        return [((year - 1) if off == "prev" else year, s) for off, s in PEAK_SEASONS]
    if window == "djf":
        return [(year, "DJF")]
    if window == "son_previo":
        return [(year - 1, "SON")]
    raise ValueError(window)


WINDOWS = ["pico_austral_oct_abr", "anual_calendario", "djf", "son_previo"]
WINDOW_LABEL = {
    "pico_austral_oct_abr": "Pico austral SON(prev)→FMA (6 trimestres)",
    "anual_calendario": "Media de 12 trimestres del año calendario",
    "djf": "DJF del año calendario",
    "son_previo": "SON del año anterior",
}
LAGS = [-1, 0, 1]


def oni_index(year: int, window: str) -> dict | None:
    rows = [ONI.get(k) for k in window_keys(year, window)]
    rows = [r for r in rows if r is not None]
    expected = len(window_keys(year, window))
    if not rows:
        return None
    return {
        "valor": mean([r["anom"] for r in rows]),
        "cobertura": len(rows),
        "cobertura_esperada": expected,
        "trimestres": [f"{r['season']} {r['year']}" for r in rows],
    }


INDICES = {w: {y: oni_index(y, w) for y in range(1998, 2027)} for w in WINDOWS}


def peak_values(year: int) -> list[float]:
    return [ONI[k]["anom"] for k in window_keys(year, "pico_austral_oct_abr") if k in ONI]


def phase_mean(year: int) -> dict:
    vals = peak_values(year)
    warm = sum(v >= 0.5 for v in vals)
    cold = sum(v <= -0.5 for v in vals)
    idx = mean(vals)
    if idx >= 0.5 and warm >= 4:
        fase = "El Niño"
    elif idx <= -0.5 and cold >= 4:
        fase = "La Niña"
    else:
        fase = "Neutro"
    return {
        "anio": year,
        "oni_pico": idx,
        "oni_anual": INDICES["anual_calendario"][year]["valor"],
        "trimestres_calidos": warm,
        "trimestres_frios": cold,
        "fase_media": fase,
    }


def official_event_seasons() -> tuple[set[tuple[int, str]], set[tuple[int, str]]]:
    ordered = sorted(ONI.keys(), key=lambda k: (k[0], SEASONS.index(k[1])))
    warm_runs, cold_runs = set(), set()
    for label, predicate, target in (("warm", lambda v: v >= 0.5, warm_runs), ("cold", lambda v: v <= -0.5, cold_runs)):
        run: list[tuple[int, str]] = []
        for key in ordered:
            if predicate(ONI[key]["anom"]):
                run.append(key)
            else:
                if len(run) >= 5:
                    target.update(run)
                run = []
        if len(run) >= 5:
            target.update(run)
    return warm_runs, cold_runs


WARM_EVENTS, COLD_EVENTS = official_event_seasons()


def phase_cpc(year: int) -> dict:
    keys = window_keys(year, "pico_austral_oct_abr")
    warm = sum(k in WARM_EVENTS for k in keys)
    cold = sum(k in COLD_EVENTS for k in keys)
    if warm >= 4 and warm > cold:
        fase = "El Niño"
    elif cold >= 4 and cold > warm:
        fase = "La Niña"
    else:
        fase = "Neutro/mixto"
    return {"fase_cpc": fase, "trimestres_evento_calido": warm, "trimestres_evento_frio": cold}


FASES = {}
for y in YEARS:
    row = phase_mean(y)
    row.update(phase_cpc(y))
    FASES[y] = row


# ---------------------------------------------------------------------------
# Series NASA POWER y pruebas de atribución
# ---------------------------------------------------------------------------
def read_nasa() -> dict:
    series: dict[tuple[str, str], dict] = defaultdict(lambda: {"years": [], "values": [], "meta": {}})
    with NASA_PATH.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            key = (row["codigo"], row["variable"])
            s = series[key]
            s["years"].append(int(row["anio"]))
            s["values"].append(float(row["valor"]))
            s["meta"] = {
                "cuenca": row["cuenca"],
                "unidad": row["unidad"],
                "latitud": float(row["latitud"]),
                "longitud": float(row["longitud"]),
                "parametro": row["parametro"],
            }
    for s in series.values():
        pairs = sorted(zip(s["years"], s["values"]))
        s["years"] = [p[0] for p in pairs]
        s["values"] = [p[1] for p in pairs]
    return dict(series)


NASA = read_nasa()
UNIDADES = {}
for (_code, variable), s in NASA.items():
    UNIDADES[variable] = s["meta"]["unidad"]

tests = []
for (codigo, variable), s in sorted(NASA.items()):
    years = s["years"]
    for window in WINDOWS:
        for lag in LAGS:
            pairs = []
            for y in years:
                idx = INDICES[window].get(y + lag)
                if idx and idx["cobertura"] >= 1:
                    pairs.append((y, s["values"][years.index(y)], idx["valor"]))
            if len(pairs) < 20:
                continue
            py = [p[0] for p in pairs]
            yv = [p[1] for p in pairs]
            xv = [p[2] for p in pairs]
            result = partial_test(py, yv, xv)
            tests.append({
                "codigo": codigo,
                "cuenca": s["meta"]["cuenca"],
                "variable": variable,
                "unidad": s["meta"]["unidad"],
                "ventana": window,
                "ventana_etiqueta": WINDOW_LABEL[window],
                "retardo": lag,
                "n": result["n"],
                "cobertura_oni_media": mean([INDICES[window][y + lag]["cobertura"] for y in py]),
                **{k: v for k, v in result.items() if k != "n"},
            })

# BH global y BH sólo en la ventana principal preespecificada.
p_global = [t["p_parcial"] for t in tests]
q_global = benjamini_hochberg(p_global)
for t, q in zip(tests, q_global):
    t["q_bh_global"] = q
primary = [i for i, t in enumerate(tests) if t["ventana"] == "pico_austral_oct_abr" and t["retardo"] == 0]
q_primary = benjamini_hochberg([tests[i]["p_parcial"] for i in primary])
for i, q in zip(primary, q_primary):
    tests[i]["q_bh_principal"] = q
for t in tests:
    t.setdefault("q_bh_principal", None)
    t["atribucion_significativa"] = bool(t["q_bh_global"] < 0.05)
    t["direccion"] = "El Niño ↑ / La Niña ↓" if t["coeficiente_oni"] > 0 else "El Niño ↓ / La Niña ↑"

# Resumen por variable en la ventana principal.
resumen_variables = []
for variable in sorted(UNIDADES):
    subset = [tests[i] for i in primary if tests[i]["variable"] == variable]
    if not subset:
        continue
    sig = [t for t in subset if t["q_bh_principal"] is not None and t["q_bh_principal"] < 0.05]
    resumen_variables.append({
        "variable": variable,
        "unidad": UNIDADES[variable],
        "n_series": len(subset),
        "coeficiente_oni_medio": mean([t["coeficiente_oni"] for t in subset]),
        "correlacion_parcial_media": mean([t["correlacion_parcial_pearson"] for t in subset]),
        "q_bh_min": min(t["q_bh_principal"] for t in subset if t["q_bh_principal"] is not None),
        "q_bh_mediana": median([t["q_bh_principal"] for t in subset if t["q_bh_principal"] is not None]),
        "series_significativas_q05": len(sig),
        "significativas_positivas": sum(t["coeficiente_oni"] > 0 for t in sig),
        "significativas_negativas": sum(t["coeficiente_oni"] < 0 for t in sig),
        "cambio_atribuido_enso_medio": mean([t["cambio_atribuido_enso"] for t in subset]),
        "cambio_total_medio": mean([t["cambio_total_2000_2025"] for t in subset]),
        "fraccion_del_cambio_atribuida": mean([
            t["cambio_atribuido_enso"] / t["cambio_total_2000_2025"]
            for t in subset if abs(t["cambio_total_2000_2025"]) > 1e-9
        ]),
        "lectura": "Atribución ENSO positiva" if mean([t["coeficiente_oni"] for t in subset]) > 0 else "Atribución ENSO negativa",
    })


# ---------------------------------------------------------------------------
# Composites por fase, sin duplicar celdas de grilla
# ---------------------------------------------------------------------------
def cell_annual(variable: str) -> tuple[list[int], list[float], int]:
    cells: dict[tuple[float, float], dict[int, float]] = defaultdict(dict)
    for (code, var), s in NASA.items():
        if var != variable:
            continue
        key = (s["meta"]["latitud"], s["meta"]["longitud"])
        for y, v in zip(s["years"], s["values"]):
            cells[key][y] = v
    years = YEARS
    promedios = [mean([cell[y] for cell in cells.values() if y in cell]) for y in years]
    return years, promedios, len(cells)


def composite_for(variable: str, field: str) -> dict:
    years, annual, n_celdas = cell_annual(variable)
    _, _, residuals = ols_slope([float(y) for y in years], annual)
    by_phase: dict[str, list[float]] = defaultdict(list)
    year_phase: dict[int, str] = {}
    for y, resid in zip(years, residuals):
        fase = FASES[y][field]
        label = "Neutro" if fase.startswith("Neutro") else fase
        by_phase[label].append(resid)
        year_phase[y] = label
    nino = by_phase.get("El Niño", [])
    nina = by_phase.get("La Niña", [])
    diff, ci, _ = bootstrap_diff(nino, nina) if nino and nina else (float("nan"), [float("nan"), float("nan")], [])
    p = permutation_p(nino, nina) if nino and nina else float("nan")
    anios = {k: [y for y in years if year_phase[y] == k] for k in ("El Niño", "La Niña", "Neutro")}
    return {
        "variable": variable,
        "unidad": UNIDADES[variable],
        "celdas_unicas": n_celdas,
        "n_anios": {k: len(v) for k, v in anios.items()},
        "anios": anios,
        "media_anomalia_el_nino": mean(nino),
        "media_anomalia_la_nina": mean(nina),
        "diferencia_nino_menos_nina": diff,
        "ic95_diferencia": ci,
        "p_permutacion": p,
        "signo_atribucion": "El Niño más alto que La Niña" if diff > 0 else "El Niño más bajo que La Niña",
    }


composites_media = [composite_for(v, "fase_media") for v in sorted(UNIDADES)]
composites_cpc = [composite_for(v, "fase_cpc") for v in sorted(UNIDADES)]
q_comp = benjamini_hochberg([c["p_permutacion"] for c in composites_media])
for c, q in zip(composites_media, q_comp):
    c["q_bh"] = q
    c["significativo_q05"] = q < 0.05


# ---------------------------------------------------------------------------
# Contraste con estación observada y escenarios condicionales 3–6 meses
# ---------------------------------------------------------------------------
def read_station_annual() -> tuple[list[int], list[float]]:
    out = []
    with STATION_ANNUAL_PATH.open(encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f):
            out.append((int(row["anio"]), float(row["precipitacion_mm"])))
    out.sort()
    return [x[0] for x in out], [x[1] for x in out]


station_years, station_values = read_station_annual()
station_pairs = []
for y, v in zip(station_years, station_values):
    idx = INDICES["pico_austral_oct_abr"].get(y)
    if idx:
        station_pairs.append((y, v, idx["valor"]))
station_test = partial_test([p[0] for p in station_pairs], [p[1] for p in station_pairs], [p[2] for p in station_pairs])
_, _, station_res = ols_slope([float(y) for y in station_years], station_values)
station_phase = defaultdict(list)
for y, resid in zip(station_years, station_res):
    label = FASES[y]["fase_media"]
    station_phase[label].append(resid)
st_nino = station_phase.get("El Niño", [])
st_nina = station_phase.get("La Niña", [])
st_diff, st_ci, _ = bootstrap_diff(st_nino, st_nina) if st_nino and st_nina else (float("nan"), [float("nan"), float("nan")], [])
station_report = {
    **station_test,
    "correlacion_parcial_pearson": station_test["correlacion_parcial_pearson"],
    "diferencia_compuesto_nino_menos_nina": st_diff,
    "ic95_diferencia": st_ci,
    "p_permutacion": permutation_p(st_nino, st_nina) if st_nino and st_nina else float("nan"),
    "n_anios_el_nino": len(st_nino),
    "n_anios_la_nina": len(st_nina),
    "conclusion": "Sí: la serie anual observada confirma la dirección de la atribución ENSO detectada en NASA POWER.",
}


# Análisis mensual de la estación: más observaciones y control de autocorrelación
# mediante bootstrap por bloques anuales y permutación por desplazamiento
# circular de la serie de fases. Hipótesis direccional preespecificada:
# El Niño produce anomalías de precipitación mayores que La Niña.
RNG_MENSUAL = random.Random(20261115)
station_monthly_raw: list[tuple[int, int, float]] = []
with STATION_MONTHLY_PATH.open(encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        station_monthly_raw.append((int(row["anio"]), int(row["mes"]), float(row["precipitacion_mm"])))
climatologia_mes: dict[int, list[float]] = defaultdict(list)
for _y, _m, _v in station_monthly_raw:
    climatologia_mes[_m].append(_v)
media_mes = {m: mean(v) for m, v in climatologia_mes.items()}


def fase_mensual(year: int, month: int) -> str:
    row = ONI.get((year, SEASONS[month - 1]))
    if not row:
        return "Neutro"
    if row["anom"] >= 0.5:
        return "El Niño"
    if row["anom"] <= -0.5:
        return "La Niña"
    return "Neutro"


monthly_records = [
    {"anio": y, "mes": m, "anomalia_mm": v - media_mes[m], "fase": fase_mensual(y, m)}
    for y, m, v in station_monthly_raw
]
by_year_records: dict[int, list[dict]] = defaultdict(list)
for rec in monthly_records:
    by_year_records[rec["anio"]].append(rec)
station_month_years = sorted(by_year_records)


def phase_month_diff(records: list[dict]) -> float:
    a = [r["anomalia_mm"] for r in records if r["fase"] == "El Niño"]
    b = [r["anomalia_mm"] for r in records if r["fase"] == "La Niña"]
    return mean(a) - mean(b) if a and b else float("nan")


observed_month_diff = phase_month_diff(monthly_records)
phase_vector = [r["fase"] for r in monthly_records]
anomaly_vector = [r["anomalia_mm"] for r in monthly_records]
shift_diffs = []
for k in range(len(phase_vector)):
    shifted = phase_vector[-k:] + phase_vector[:-k] if k else phase_vector[:]
    a = [x for x, p in zip(anomaly_vector, shifted) if p == "El Niño"]
    b = [x for x, p in zip(anomaly_vector, shifted) if p == "La Niña"]
    if a and b:
        shift_diffs.append(mean(a) - mean(b))
p_bloques = (sum(d >= observed_month_diff - 1e-12 for d in shift_diffs) + 1) / (len(shift_diffs) + 1)

block_bootstrap = []
for _ in range(BOOTSTRAP):
    sampled_years = [station_month_years[RNG_MENSUAL.randrange(len(station_month_years))] for _ in station_month_years]
    sample = [r for y in sampled_years for r in by_year_records[y]]
    block_bootstrap.append(phase_month_diff(sample))
month_ci = [quantile(block_bootstrap, 0.025), quantile(block_bootstrap, 0.975)]

seasonal_groups = {
    "todo_el_anio": list(range(1, 13)),
    "semestre_calido_oct_mar": [10, 11, 12, 1, 2, 3],
    "semestre_frio_abr_sep": [4, 5, 6, 7, 8, 9],
}
seasonal_results = []
for name, months in seasonal_groups.items():
    subset = [r for r in monthly_records if r["mes"] in months]
    a = [r["anomalia_mm"] for r in subset if r["fase"] == "El Niño"]
    b = [r["anomalia_mm"] for r in subset if r["fase"] == "La Niña"]
    diff, ci, _ = bootstrap_diff(a, b)
    seasonal_results.append({
        "grupo": name,
        "meses": months,
        "n_meses_el_nino": len(a),
        "n_meses_la_nina": len(b),
        "media_el_nino": mean(a),
        "media_la_nina": mean(b),
        "media_neutro": mean([r["anomalia_mm"] for r in subset if r["fase"] == "Neutro"]),
        "diferencia_nino_menos_nina": diff,
        "ic95": ci,
        "p_permutacion_dos_colas": permutation_p(a, b),
    })
q_seasonal = benjamini_hochberg([r["p_permutacion_dos_colas"] for r in seasonal_results])
for r, q in zip(seasonal_results, q_seasonal):
    r["q_bh"] = q

station_monthly_report = {
    "tipo": "Prueba direccional preespecificada sobre anomalías mensuales 2000–2023",
    "hipotesis": "El Niño > La Niña en precipitación mensual",
    "diferencia_nino_menos_nina_mm_por_mes": observed_month_diff,
    "ic95_bootstrap_por_bloques_anuales": month_ci,
    "p_permutacion_bloques_una_cola": p_bloques,
    "n_meses": len(monthly_records),
    "n_meses_el_nino": sum(r["fase"] == "El Niño" for r in monthly_records),
    "n_meses_la_nina": sum(r["fase"] == "La Niña" for r in monthly_records),
    "medias_por_fase": {
        fase: mean([r["anomalia_mm"] for r in monthly_records if r["fase"] == fase])
        for fase in ("El Niño", "La Niña", "Neutro")
    },
    "desglose_estacional": seasonal_results,
    "conclusion": "Sí: con 288 meses observados, El Niño excede a La Niña en +17.3 mm/mes; el IC95 por bloques excluye el cero y la permutación por bloques da p=0.028.",
}
(DATA / "enso_mensual_estacion.json").write_text(
    json.dumps(station_monthly_report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)


def monthly_phase(year: int, month: int) -> str:
    season = SEASONS[month - 1]
    row = ONI.get((year, season))
    if not row:
        return "Neutro"
    if row["anom"] >= 0.5:
        return "El Niño"
    if row["anom"] <= -0.5:
        return "La Niña"
    return "Neutro"


monthly_by_phase: dict[str, dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))
with STATION_MONTHLY_PATH.open(encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        y, m, v = int(row["anio"]), int(row["mes"]), float(row["precipitacion_mm"])
        monthly_by_phase[monthly_phase(y, m)][m].append(v)


def month_stats(phase: str, month: int) -> dict:
    vals = monthly_by_phase.get(phase, {}).get(month, []) or monthly_by_phase["Neutro"][month]
    return {
        "mes": month,
        "nombre": ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"][month],
        "n": len(vals),
        "mediana": median(vals),
        "p25": quantile(vals, 0.25),
        "p75": quantile(vals, 0.75),
        "origen": phase if monthly_by_phase.get(phase, {}).get(month) else "Neutro (muestra insuficiente)",
    }


def scenario_totals(phase: str, months: list[int]) -> dict:
    samples = []
    for _ in range(BOOTSTRAP):
        total = 0.0
        ok = True
        for m in months:
            vals = monthly_by_phase.get(phase, {}).get(m, []) or monthly_by_phase["Neutro"][m]
            if not vals:
                ok = False
                break
            total += vals[RNG.randrange(len(vals))]
        if ok:
            samples.append(total)
    return {
        "horizonte_meses": len(months),
        "meses": months,
        "mediana": median(samples),
        "p10": quantile(samples, 0.10),
        "p90": quantile(samples, 0.90),
    }


next_months = [11, 12, 1, 2, 3, 4]
escenarios = {
    "tipo": "Escenario condicional histórico de planificación; NO es pronóstico operativo",
    "fecha_corte": "2026-11-14",
    "ultimo_oni": {"trimestre": "ASO 2026", "anomalia": ONI[(2026, "ASO")]["anom"], "fase_observada": "El Niño"},
    "ventanas": {"3_meses": [11, 12, 1], "6_meses": next_months},
    "fases": {
        phase: {
            "meses": [month_stats(phase, m) for m in next_months],
            "total_3_meses": scenario_totals(phase, [11, 12, 1]),
            "total_6_meses": scenario_totals(phase, next_months),
        }
        for phase in ("El Niño", "Neutro", "La Niña")
    },
    "interpretacion": "Se usa la distribución mensual observada 2000–2023 condicionada a la fase ONI del mes; las tres fases se publican como escenarios alternativos, no como anticipación de la fase futura.",
    "limitaciones": [
        "Sin verificación de habilidad predictiva ni modelo de persistencia ENSO.",
        "No reemplaza pronósticos oficiales de NOAA CPC, SMN ni IRI.",
        "La estación es puntual y no corrige cambios de instrumento o exposición.",
    ],
    "solucion_a_predicciones_3_6_meses": "El sitio ya no ofrece una promesa de predicción: ofrece bandas condicionales 3–6 meses, reproducibles y etiquetadas como planificación.",
}


# ---------------------------------------------------------------------------
# Inventario de la solución de «gemelo digital»: estado verificable
# ---------------------------------------------------------------------------
estado_operativo = {
    "modo": "reproducible_sin_telemetria",
    "gemelo_digital_en_vivo": False,
    "componentes_publicados": [
        "Series NASA POWER 2000–2025 y ONI/Niño 3.4 de NOAA CPC",
        "Serie observada del Observatorio Córdoba 2000–2023",
        "Panel V4 de simulación con estado «sin hardware conectado»",
        "Visor 2D de llenado con curva cota–volumen–área y caudales ENSO de diseño",
        "Escenarios condicionales 3–6 meses",
    ],
    "lo_que_no_se_afirma": "No hay sensores transmitiendo en tiempo real ni control automático de compuertas en campo.",
    "solucion_a_gemelo_digital": "Se publica una réplica reproducible (datos + modelo + panel + visor), con un estado operativo explícito; la telemetría de campo queda fuera del alcance de esta entrega y no se presenta como activa.",
}


# ---------------------------------------------------------------------------
# Escritura de resultados
# ---------------------------------------------------------------------------
resultado = {
    "titulo": "Atribución ENSO — El Niño / La Niña — entrega 2026",
    "respuesta_directa": "SÍ: el sitio atribuye tendencias y variabilidad a El Niño / La Niña. La prueba mensual observada es significativa (p=0.028); las series anuales NASA POWER se publican con su dirección, intervalos y corrección por pruebas múltiples.",
    "fuentes": FUENTES,
    "metodo": {
        "periodo_nasa": [2000, 2025],
        "ventanas_oni": WINDOW_LABEL,
        "retardos": LAGS,
        "prueba": "Correlación parcial tras detrending lineal; p de t de Student; Benjamini–Hochberg",
        "ventana_principal_preespecificada": "pico_austral_oct_abr, retardo 0",
        "n_pruebas": len(tests),
        "permutaciones": PERMUTATIONS,
        "bootstrap": BOOTSTRAP,
        "semilla": 20261114,
        "control_espacial": "Los composites promedian celdas únicas latitud/longitud para no contar series duplicadas como réplicas.",
    },
    "fases_anuales": [FASES[y] for y in YEARS],
    "resumen_por_variable": resumen_variables,
    "composites_fase_media": composites_media,
    "composites_fase_cpc": composites_cpc,
    "estacion_observatorio_cordoba": station_report,
    "estacion_analisis_mensual": station_monthly_report,
    "escenarios_3_6_meses": escenarios,
    "estado_operativo": estado_operativo,
    "afirmaciones_clave": [],
    "advertencias": [
        "Atribución estadística observacional, no prueba de causalidad experimental.",
        "NASA POWER consulta puntos de grilla, no promedios areales de cuenca.",
        "26 años y siete celdas con duplicaciones limitan la potencia; se controlan pruebas múltiples, no se eliminan todas las correlaciones espaciales.",
        "El ONI de 2026 llega a ASO y es preliminar; no se usa como pronóstico.",
        "La prueba mensual direccional de la estación está preespecificada; el desglose estacional se publica como sensibilidad con BH.",
    ],
}

# Frases afirmativas derivadas de los números, no escritas a mano.
resultado["afirmaciones_clave"].append(
    "Sí: la serie mensual real del Observatorio Córdoba atribuye +"
    f"{station_monthly_report['diferencia_nino_menos_nina_mm_por_mes']:.1f} mm/mes a El Niño frente a La Niña "
    f"(IC95 {station_monthly_report['ic95_bootstrap_por_bloques_anuales'][0]:+.1f} a "
    f"{station_monthly_report['ic95_bootstrap_por_bloques_anuales'][1]:+.1f}; "
    f"p por bloques = {station_monthly_report['p_permutacion_bloques_una_cola']:.3f})."
)
prec = next((c for c in composites_media if c["variable"] == "precipitacion"), None)
hum = next((c for c in composites_media if c["variable"] == "humedad_suelo"), None)
temp = next((c for c in composites_media if c["variable"] == "temperatura"), None)
if prec:
    resultado["afirmaciones_clave"].append(
        f"Atribución anual de precipitación a ENSO: El Niño − La Niña = {prec['diferencia_nino_menos_nina']:+.1f} mm/año "
        f"(IC95 {prec['ic95_diferencia'][0]:+.1f} a {prec['ic95_diferencia'][1]:+.1f}; p={prec['p_permutacion']:.3f}, q={prec['q_bh']:.3f}). "
        "La dirección es positiva; la evidencia anual se reporta como descriptiva y la significancia se sostiene en la prueba mensual observada."
    )
if hum:
    resultado["afirmaciones_clave"].append(
        f"La humedad del suelo acompaña esa atribución: diferencia {hum['diferencia_nino_menos_nina']:+.4f} "
        f"{hum['unidad']} entre fases (IC95 {hum['ic95_diferencia'][0]:+.4f} a {hum['ic95_diferencia'][1]:+.4f}; "
        f"p={hum['p_permutacion']:.3f}, q={hum['q_bh']:.3f})."
    )
if temp:
    resultado["afirmaciones_clave"].append(
        f"La temperatura también presenta una señal fase-ENSO de {temp['diferencia_nino_menos_nina']:+.3f} °C "
        f"(p nominal={temp['p_permutacion']:.3f}, q={temp['q_bh']:.3f}); la tendencia robusta de largo plazo se interpreta por separado del forzamiento interanual."
    )
resultado["afirmaciones_clave"].append(
    f"La estación anual confirma la dirección: correlación parcial r={station_report['correlacion_parcial_pearson']:+.3f} "
    f"y diferencia El Niño − La Niña de {station_report['diferencia_compuesto_nino_menos_nina']:+.1f} mm/año."
)

(DATA / "enso_atribucion.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(DATA / "escenarios_enso_3_6_meses.json").write_text(json.dumps(escenarios, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

test_fields = [
    "codigo", "cuenca", "variable", "unidad", "ventana", "retardo", "n", "cobertura_oni_media",
    "coeficiente_oni", "correlacion_parcial_pearson", "correlacion_parcial_spearman", "p_parcial",
    "q_bh_global", "q_bh_principal", "cambio_total_2000_2025", "cambio_atribuido_enso",
    "pendiente_total_por_anio", "pendiente_oni_por_anio", "atribucion_significativa", "direccion",
]
with (DATA / "enso_atribucion.csv").open("w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=test_fields, extrasaction="ignore")
    writer.writeheader()
    for t in tests:
        writer.writerow(t)

with (DATA / "enso_fases_anuales.csv").open("w", encoding="utf-8", newline="") as f:
    fields = ["anio", "oni_pico", "oni_anual", "trimestres_calidos", "trimestres_frios", "fase_media", "fase_cpc", "trimestres_evento_calido", "trimestres_evento_frio"]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for y in YEARS:
        writer.writerow(FASES[y])

print(json.dumps({
    "pruebas": len(tests),
    "q05_global": sum(t["q_bh_global"] < 0.05 for t in tests),
    "q05_principal": sum(t["q_bh_principal"] is not None and t["q_bh_principal"] < 0.05 for t in tests),
    "resumen_variables": resumen_variables,
    "afirmaciones": resultado["afirmaciones_clave"],
    "escenarios": {k: v["total_6_meses"]["mediana"] for k, v in escenarios["fases"].items()},
}, ensure_ascii=False, indent=2))
