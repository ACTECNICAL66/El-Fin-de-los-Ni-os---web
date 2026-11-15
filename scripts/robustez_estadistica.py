#!/usr/bin/env python3
"""Respaldo estadístico para las 42 tendencias de ``public/data/trend_results.csv``.

A partir de las series anuales archivadas de NASA POWER este script calcula:

* autocorrelación de retardo 1 (serie original y serie sin tendencia),
* p de Mann-Kendall con corrección de varianza por tamaño efectivo de muestra,
* p de Mann-Kendall con preblanqueamiento libre de tendencia (TFPW, Yue et al. 2002),
* q de Benjamini-Hochberg para controlar el FDR de las 42 pruebas,
* umbral de Bonferroni (alpha/42),
* series duplicadas por compartir celda de grilla,
* contraste de la sequía 2020-2023 documentada en el informe del proyecto,
* consistencia interna entre precipitación y humedad del suelo,
* la serie elegida para el caso de estudio.

No inventa observaciones: todos los números salen de
``public/data/nasa_power_anual.csv`` y se escriben en un JSON que consume la web.

Uso:
    python3 scripts/robustez_estadistica.py
"""

from __future__ import annotations

import csv
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERIES_CSV = ROOT / "public/data/nasa_power_anual.csv"
TRENDS_CSV = ROOT / "public/data/trend_results.csv"
OUT_JSON = ROOT / "public/data/robustez_estadistica.json"
OUT_CSV = ROOT / "public/data/robustez_estadistica.csv"
ALPHA = 0.05


def normal_two_sided_p(z: float) -> float:
    """Cola bilateral de la normal estándar (``erfc`` es exacta a doble precisión)."""
    return min(1.0, math.erfc(abs(z) / math.sqrt(2.0)))


def mk_statistic(values: list[float]) -> tuple[int, float, float]:
    """S, varianza con corrección de empates y tau de Kendall."""
    n = len(values)
    s = sum(
        1 if values[j] > values[i] else -1 if values[j] < values[i] else 0
        for i in range(n - 1)
        for j in range(i + 1, n)
    )
    counts: dict[float, int] = defaultdict(int)
    for value in values:
        counts[value] += 1
    tie = sum(c * (c - 1) * (2 * c + 5) for c in counts.values() if c > 1)
    variance = (n * (n - 1) * (2 * n + 5) - tie) / 18.0
    tau = s / (n * (n - 1) / 2.0)
    return s, variance, tau


def mk_p(values: list[float], variance_factor: float = 1.0) -> float:
    s, variance, _ = mk_statistic(values)
    variance *= variance_factor
    if variance <= 0 or s == 0:
        return 1.0
    z = (s - 1 if s > 0 else s + 1) / math.sqrt(variance)
    return normal_two_sided_p(z)


def sen_slope(values: list[float], years: list[int]) -> float:
    slopes = sorted(
        (values[j] - values[i]) / (years[j] - years[i])
        for i in range(len(values) - 1)
        for j in range(i + 1, len(values))
        if years[j] != years[i]
    )
    if not slopes:
        return 0.0
    middle = len(slopes) // 2
    return slopes[middle] if len(slopes) % 2 else (slopes[middle - 1] + slopes[middle]) / 2


def lag1_autocorrelation(values: list[float]) -> float:
    """Coeficiente de autocorrelación de retardo 1 (Pearson entre x[t] y x[t+1])."""
    x, y = values[:-1], values[1:]
    if len(x) < 3:
        return 0.0
    mx, my = sum(x) / len(x), sum(y) / len(y)
    num = sum((a - mx) * (b - my) for a, b in zip(x, y))
    den = math.sqrt(sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y))
    return num / den if den > 0 else 0.0


def prewhitened_p(values: list[float], years: list[int]) -> tuple[float, float]:
    """TFPW: quita la pendiente de Sen, preblanquea el residuo AR(1), reincorpora la tendencia."""
    slope = sen_slope(values, years)
    detrended = [v - slope * (year - years[0]) for v, year in zip(values, years)]
    r1 = lag1_autocorrelation(detrended)
    # Para r1 <= 0 no hay persistencia que inflar los falsos positivos.
    if r1 <= 0.05:
        return mk_p(values), r1
    whitened = [detrended[i + 1] - r1 * detrended[i] for i in range(len(detrended) - 1)]
    blended = [
        whitened[i] + slope * (years[i + 1] - years[0])
        for i in range(len(whitened))
    ]
    return mk_p(blended), r1


def benjamini_hochberg(p_values: list[float]) -> list[float]:
    """q-valores (FDR BH) en el mismo orden de entrada."""
    m = len(p_values)
    order = sorted(range(m), key=lambda i: p_values[i])
    q = [0.0] * m
    previous = 1.0
    for rank in range(m, 0, -1):
        idx = order[rank - 1]
        value = min(previous, p_values[idx] * m / rank)
        q[idx] = min(1.0, value)
        previous = q[idx]
    return q


def pearson(a: list[float], b: list[float]) -> float:
    if len(a) < 3 or len(a) != len(b):
        return float("nan")
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
    return num / den if den > 0 else float("nan")


def main() -> None:
    # --- series anuales ---
    grouped: dict[tuple[str, str], dict[int, float]] = defaultdict(dict)
    meta: dict[tuple[str, str], dict] = {}
    with SERIES_CSV.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            key = (row["codigo"], row["variable"])
            grouped[key][int(row["anio"])] = float(row["valor"])
            meta[key] = {
                "cuenca": row["cuenca"],
                "unidad": row["unidad"],
                "latitud": float(row["latitud"]),
                "longitud": float(row["longitud"]),
                "parametro": row["parametro"],
                "fuente": row["fuente"],
                "fecha_descarga": row["fecha_descarga"],
            }

    # --- resultados publicados (para verificar consistencia) ---
    published = {}
    with TRENDS_CSV.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            published[(row["codigo"], row["variable"])] = row

    results = []
    for key in sorted(grouped):
        code, variable = key
        years = sorted(grouped[key])
        values = [grouped[key][y] for y in years]
        row = published.get(key, {})
        p_nominal = mk_p(values)
        published_p = float(row.get("mann_kendall_p_valor", p_nominal))
        p_prewhitened, r1_detrended = prewhitened_p(values, years)
        r1_raw = lag1_autocorrelation(values)
        # Corrección de varianza por n efectivo: Var*(S) = Var(S) * (1+r1)/(1-r1).
        r1_for_variance = min(max(r1_detrended, 0.0), 0.95)
        variance_factor = (1 + r1_for_variance) / (1 - r1_for_variance)
        p_variance = mk_p(values, variance_factor)
        n_eff = len(values) / variance_factor
        slope_decade = float(row.get("sen_slope_por_decada", sen_slope(values, years) * 10))
        results.append(
            {
                "codigo": code,
                "cuenca": meta[key]["cuenca"],
                "variable": variable,
                "unidad": meta[key]["unidad"],
                "latitud": meta[key]["latitud"],
                "longitud": meta[key]["longitud"],
                "parametro": meta[key]["parametro"],
                "n": len(values),
                "periodo": [years[0], years[-1]],
                "sen_slope_por_decada": slope_decade,
                "ic95_inf": float(row.get("sen_slope_ic95_inf", float("nan"))),
                "ic95_sup": float(row.get("sen_slope_ic95_sup", float("nan"))),
                "p_publicado": published_p,
                "p_nominal": p_nominal,
                "p_varianza_ajustada": p_variance,
                "p_preblanqueado": p_prewhitened,
                "r1_bruto": r1_raw,
                "r1_sin_tendencia": r1_detrended,
                "n_efectivo": n_eff,
                "direccion": "sube" if slope_decade > 0 else "baja" if slope_decade < 0 else "estable",
            }
        )

    n_tests = len(results)
    q_nominal = benjamini_hochberg([r["p_nominal"] for r in results])
    q_prewhitened = benjamini_hochberg([r["p_preblanqueado"] for r in results])
    bonferroni = ALPHA / n_tests
    for item, q_n, q_p in zip(results, q_nominal, q_prewhitened):
        item["q_bh_nominal"] = q_n
        item["q_bh_preblanqueado"] = q_p
        item["significativa_nominal"] = item["p_nominal"] < ALPHA
        item["significativa_bonferroni"] = item["p_nominal"] < bonferroni
        item["significativa_bh_nominal"] = q_n <= ALPHA
        item["significativa_preblanqueada"] = item["p_preblanqueado"] < ALPHA
        item["robusta"] = q_p <= ALPHA and item["p_preblanqueado"] < ALPHA
        # Categoría usada por el mapa comparativo.
        item["categoria"] = (
            "robusta" if item["robusta"]
            else "nominal" if item["significativa_nominal"]
            else "sin_evidencia"
        )

    # --- series duplicadas por compartir celda de grilla ---
    fingerprint: dict[tuple, list[tuple[str, str]]] = defaultdict(list)
    for key in grouped:
        values = [grouped[key][y] for y in sorted(grouped[key])]
        fingerprint[tuple(round(v, 6) for v in values)].append(key)
    duplicates = [
        {"series": [f"{c}/{v}" for c, v in group], "codigos": sorted({c for c, _ in group})}
        for group in fingerprint.values()
        if len(group) > 1
    ]

    # --- contraste con fuente documental independiente: sequía 2020-2023 ---
    # El informe del proyecto (bibliografía: INA 2023, Aguas Cordobesas 2023) documenta
    # la sequía 2020-2023 y La Quebrada al 15 % / San Roque al 30 % en 2023.
    drought = []
    for (code, variable), observations in sorted(grouped.items()):
        if variable != "precipitacion":
            continue
        baseline = [observations[y] for y in sorted(observations) if 2000 <= y <= 2019]
        event = [observations[y] for y in sorted(observations) if 2020 <= y <= 2023]
        baseline_mean = sum(baseline) / len(baseline)
        event_mean = sum(event) / len(event)
        ordered = sorted(baseline)
        q1 = ordered[len(ordered) // 4]
        drought.append(
            {
                "codigo": code,
                "cuenca": meta[(code, variable)]["cuenca"],
                "media_2000_2019_mm": baseline_mean,
                "media_2020_2023_mm": event_mean,
                "anomalia_mm": event_mean - baseline_mean,
                "anomalia_porcentaje": 100 * (event_mean - baseline_mean) / baseline_mean,
                "anios_bajo_percentil25": sum(1 for v in event if v < q1),
                "anios_evento": len(event),
                "valores_2020_2023": [
                    {"anio": y, "valor": observations[y]}
                    for y in sorted(observations) if 2020 <= y <= 2023
                ],
            }
        )

    # --- consistencia interna entre precipitación y humedad de la zona radicular ---
    consistency = []
    for code in sorted({c for c, _ in grouped}):
        p_key, h_key = (code, "precipitacion"), (code, "humedad_suelo")
        if p_key not in grouped or h_key not in grouped:
            continue
        common = sorted(set(grouped[p_key]) & set(grouped[h_key]))
        p_values = [grouped[p_key][y] for y in common]
        h_values = [grouped[h_key][y] for y in common]
        p_trend = next(r for r in results if r["codigo"] == code and r["variable"] == "precipitacion")
        h_trend = next(r for r in results if r["codigo"] == code and r["variable"] == "humedad_suelo")
        consistency.append(
            {
                "codigo": code,
                "cuenca": meta[p_key]["cuenca"],
                "correlacion_precip_humedad": pearson(p_values, h_values),
                "signos_tendencia_coinciden": p_trend["direccion"] == h_trend["direccion"],
                "pendiente_precipitacion": p_trend["sen_slope_por_decada"],
                "pendiente_humedad": h_trend["sen_slope_por_decada"],
            }
        )

    # --- caso de estudio: tendencia más sólida, priorizando precipitación ---
    robust = [r for r in results if r["robusta"]]
    precipitation_robust = [r for r in robust if r["variable"] == "precipitacion"]
    elegida = min(
        precipitation_robust or robust or results,
        key=lambda r: r["p_preblanqueado"],
    )
    case_key = (elegida["codigo"], elegida["variable"])
    case_years = sorted(grouped[case_key])
    case = {
        **elegida,
        "years": case_years,
        "values": [grouped[case_key][y] for y in case_years],
        "media_serie": sum(grouped[case_key][y] for y in case_years) / len(case_years),
        "cambio_total_estimado": elegida["sen_slope_por_decada"] * (case_years[-1] - case_years[0]) / 10,
        "seleccion": "menor p tras preblanqueamiento entre resultados que sobreviven BH-FDR"
        if elegida["robusta"] else "serie con menor p tras preblanqueamiento (sin corrección multiple)",
    }

    # Caso de contraste: la señal de precipitación que parecía más fuerte y no
    # sobrevive las correcciones. Sirve para explicar los límites en la web.
    contraste_elegido = min(
        (r for r in results if r["variable"] == "precipitacion"),
        key=lambda r: r["p_nominal"],
    )
    contraste_key = (contraste_elegido["codigo"], contraste_elegido["variable"])
    contraste_years = sorted(grouped[contraste_key])
    caso_contraste = {
        **contraste_elegido,
        "years": contraste_years,
        "values": [grouped[contraste_key][y] for y in contraste_years],
        "media_serie": sum(grouped[contraste_key][y] for y in contraste_years) / len(contraste_years),
    }

    # Resultados robustos contando una sola vez las series idénticas.
    unique_fingerprints = {tuple(round(grouped[(r["codigo"], r["variable"])][y], 6)
                                 for y in sorted(grouped[(r["codigo"], r["variable"])]))
                           for r in robust}

    summary = {
        "n_pruebas": n_tests,
        "alpha": ALPHA,
        "umbral_bonferroni": bonferroni,
        "probabilidad_al_menos_un_falso_positivo": 1 - (1 - ALPHA) ** n_tests,
        "significativas_nominal": sum(r["significativa_nominal"] for r in results),
        "significativas_bonferroni": sum(r["significativa_bonferroni"] for r in results),
        "significativas_bh_nominal": sum(r["significativa_bh_nominal"] for r in results),
        "significativas_preblanqueadas": sum(r["significativa_preblanqueada"] for r in results),
        "significativas_varianza_ajustada": sum(r["p_varianza_ajustada"] < ALPHA for r in results),
        "robustas": sum(r["robusta"] for r in results),
        "robustas_sin_series_duplicadas": len(unique_fingerprints),
        "robustas_precipitacion": sum(r["robusta"] for r in results if r["variable"] == "precipitacion"),
        "significativas_precipitacion_nominal": sum(
            r["significativa_nominal"] for r in results if r["variable"] == "precipitacion"
        ),
        "r1_mediana": sorted(r["r1_sin_tendencia"] for r in results)[n_tests // 2],
        "r1_maximo": max(r["r1_sin_tendencia"] for r in results),
        "r1_positivas": sum(r["r1_sin_tendencia"] > 0.05 for r in results),
        "grupos_series_duplicadas": len(duplicates),
        "series_duplicadas": sum(len(g["series"]) - 1 for g in duplicates),
        "celdas_consultadas": len({(v["latitud"], v["longitud"]) for v in meta.values()}),
        "sequia_2020_2023": {
            "puntos_con_anomalia_negativa": sum(d["anomalia_mm"] < 0 for d in drought),
            "total_puntos": len(drought),
            "anomalia_promedio_porcentaje": sum(d["anomalia_porcentaje"] for d in drought) / len(drought),
            "anios_bajo_percentil25": sum(d["anios_bajo_percentil25"] for d in drought),
            "anios_evaluados": sum(d["anios_evento"] for d in drought),
        },
    }

    payload = {
        "meta": {
            "titulo": "Respaldo estadístico de las 42 tendencias",
            "fuente_series": "public/data/nasa_power_anual.csv (NASA POWER Monthly API, descarga 2026-11-11)",
            "fuente_resultados": "public/data/trend_results.csv",
            "generado_por": "scripts/robustez_estadistica.py",
            "fuentes_externas": [
                {
                    "tipo": "informe del proyecto",
                    "referencia": "El Fin de los Niños (2026), capítulos 1-2 y §10.4.5",
                    "url": "https://docs.google.com/document/d/11dXRoOLjMCFvs1rITCMewpi3_DfsOlHDD8drtrgiccY/edit?usp=sharing",
                    "uso": "documenta la sequía 2020-2023 y los bajos niveles de embalses; fuente documental, no mediciones locales",
                },
                {
                    "tipo": "fuente externa contemporánea",
                    "referencia": "La Voz del Interior, 1 de febrero de 2023: tres años consecutivos (2020-2022) con precipitaciones por debajo de la media y diques lejos del vertedero",
                    "url": "https://www.lavoz.com.ar/ciudadanos/tras-las-lluvias-los-diques-de-cordoba-subieron-pero-siguen-lejos-del-nivel-esperable-para-esta-epoca/",
                    "uso": "constatación independiente del evento seco; la atribución ENSO se evalúa por separado con ONI / Niño 3.4 en scripts/atribucion_enso.py",
                },
                {
                    "tipo": "metodología institucional",
                    "referencia": "INA-CIRSA, Evaluación de sequías hidrológicas en los tributarios de la cuenca alta del río Suquía (SDI)",
                    "url": "https://www.ina.gov.ar/cirsa/pdf/Actualizacion_Evaluacion_sequias_hidrologicas_tributarios_dique_San_Roque.pdf",
                    "uso": "referencia para futuros contrastes con caudales; no aporta la serie usada en este cálculo",
                },
            ],
            "metodos": {
                "p_nominal": "Mann-Kendall con aproximación normal y corrección de empates (sin ajustar autocorrelación)",
                "p_varianza_ajustada": "Var(S) multiplicada por (1+r1)/(1-r1) con r1 de la serie sin tendencia (n efectivo)",
                "p_preblanqueado": "Preblanqueamiento libre de tendencia (TFPW, Yue et al., 2002): se quita la pendiente de Sen, se preblanquea el residuo AR(1) y se reincorpora la tendencia",
                "q_bh": "Benjamini-Hochberg sobre el conjunto de 42 pruebas (FDR 5 %)",
                "bonferroni": "alpha/42",
            },
            "advertencias": [
                "Las 42 pruebas no son independientes: algunas cuencas comparten la misma celda de grilla NASA POWER y varias variables están correlacionadas.",
                "El contraste con la sequía 2020-2023 es de consistencia con un evento documentado, no una validación instrumento a instrumento.",
                "Este módulo corrige las 42 tendencias; la atribución a ENSO se publica por separado en scripts/atribucion_enso.py (ONI / Niño 3.4, 504 pruebas y estación mensual real).",
                "Los intervalos de Sen del CSV original son aproximados y no corrigen autocorrelación.",
            ],
        },
        "resumen": summary,
        "resultados": results,
        "series_duplicadas": duplicates,
        "validacion_fuente_documental": drought,
        "consistencia_interna": consistency,
        "caso_estudio": case,
        "caso_contraste": caso_contraste,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    fields = [
        "codigo", "cuenca", "variable", "unidad", "direccion", "sen_slope_por_decada",
        "p_nominal", "p_varianza_ajustada", "p_preblanqueado", "q_bh_nominal",
        "q_bh_preblanqueado", "r1_bruto", "r1_sin_tendencia", "n_efectivo",
        "significativa_nominal", "significativa_bonferroni", "significativa_bh_nominal",
        "significativa_preblanqueada", "robusta", "categoria",
    ]
    with OUT_CSV.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    print(f"{n_tests} pruebas -> {OUT_JSON.name} y {OUT_CSV.name}")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print("caso de estudio:", case["codigo"], case["variable"], "p_tfpw=", case["p_preblanqueado"])
    print("duplicados:", duplicates)


if __name__ == "__main__":
    main()
