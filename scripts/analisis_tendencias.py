#!/usr/bin/env python3
"""Analyze annual observations with Sen slope and Mann-Kendall."""

import argparse
import csv
import math
from pathlib import Path


def sen_slopes(values, years):
    slopes = [
        (values[j] - values[i]) / (years[j] - years[i])
        for i in range(len(values) - 1)
        for j in range(i + 1, len(values))
        if years[j] != years[i]
    ]
    return sorted(slopes)


def sen_slope(values, years):
    slopes = sen_slopes(values, years)
    middle = len(slopes) // 2
    if not slopes:
        return 0.0
    return slopes[middle] if len(slopes) % 2 else (slopes[middle - 1] + slopes[middle]) / 2


def mann_kendall(values):
    n = len(values)
    if n < 3:
        return 0.0, 1.0
    score = sum(
        1 if values[j] > values[i] else -1 if values[j] < values[i] else 0
        for i in range(n - 1)
        for j in range(i + 1, n)
    )
    counts = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    tie_adjustment = sum(c * (c - 1) * (2 * c + 5) for c in counts.values() if c > 1)
    variance = (n * (n - 1) * (2 * n + 5) - tie_adjustment) / 18
    tau = score / (n * (n - 1) / 2)
    if variance <= 0 or score == 0:
        return tau, 1.0
    z = (score - 1 if score > 0 else score + 1) / math.sqrt(variance)
    # Two-sided normal approximation (no autocorrelation correction).
    x = abs(z)
    t = 1 / (1 + 0.2316419 * x)
    density = math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
    tail = density * (
        0.319381530 * t - 0.356563782 * t**2 + 1.781477937 * t**3
        - 1.821255978 * t**4 + 1.330274429 * t**5
    )
    return tau, min(1.0, 2 * tail)


def analyze(values, years):
    slopes = sen_slopes(values, years)
    slope = sen_slope(values, years)
    tau, p_value = mann_kendall(values)
    # Approximate 95% Sen interval; ties/autocorrelation are not adjusted here.
    n = len(values)
    variance = n * (n - 1) * (2 * n + 5) / 18
    radius = 1.96 * math.sqrt(variance) / 2
    low = max(0, int(math.floor(len(slopes) / 2 - radius)))
    high = min(len(slopes) - 1, int(math.ceil(len(slopes) / 2 + radius)))
    return {
        "sen_slope": slope,
        "sen_slope_por_decada": slope * 10,
        "sen_slope_ic95_inf": slopes[low] * 10,
        "sen_slope_ic95_sup": slopes[high] * 10,
        "mann_kendall_tau": tau,
        "mann_kendall_p_valor": p_value,
        "significancia": "significativa" if p_value < 0.05 else "no_significativa",
        "n_puntos": n,
        "periodo_inicio": years[0],
        "periodo_fin": years[-1],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True,
                        help="CSV anual: cuenca,codigo,variable,unidad,anio,valor")
    parser.add_argument("--output", type=Path, default=Path("public/data/trend_results.csv"))
    args = parser.parse_args()

    groups = {}
    with args.input.open("r", encoding="utf-8-sig", newline="") as stream:
        for row_number, row in enumerate(csv.DictReader(stream), start=2):
            try:
                year = int(row.get("anio") or row.get("year"))
                value = float(row.get("valor") or row.get("value"))
            except (TypeError, ValueError):
                parser.error(f"Fila {row_number}: se requieren anio/year y valor/value numéricos.")
            if not math.isfinite(value) or value <= -900:
                continue
            basin, code, variable, unit = (row.get(k, "").strip() for k in ("cuenca", "codigo", "variable", "unidad"))
            if not all((basin, code, variable, unit)):
                parser.error(f"Fila {row_number}: faltan cuenca, codigo, variable o unidad.")
            key = (basin, code, variable, unit)
            observations = groups.setdefault(key, {})
            if year in observations:
                parser.error(f"Fila {row_number}: año duplicado {year} para {code}/{variable}.")
            observations[year] = value

    if not groups:
        parser.error("El archivo no contiene observaciones válidas.")

    rows = []
    for (basin, code, variable, unit), observations in groups.items():
        years = sorted(observations)
        if len(years) < 3:
            parser.error(f"{code}/{variable}: se requieren al menos 3 años válidos.")
        result = analyze([observations[y] for y in years], years)
        rows.append({"cuenca": basin, "codigo": code, "variable": variable, "unidad": unit, **result})

    fields = ["cuenca", "codigo", "variable", "unidad", "periodo_inicio", "periodo_fin", "sen_slope", "sen_slope_por_decada", "sen_slope_ic95_inf", "sen_slope_ic95_sup", "mann_kendall_tau", "mann_kendall_p_valor", "significancia", "n_puntos"]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Resultados calculados para {len(rows)} series a partir de {args.input} -> {args.output}")


if __name__ == "__main__":
    main()
