#!/usr/bin/env python3
"""Contraste entre NASA POWER y una serie pluviométrica observada real.

La entrega 2026 usa la serie mensual del Observatorio Córdoba (31.3°S,
64.2°O, 425 m) publicada en Zenodo 15013403, agregada a totales anuales
2000–2023. No se inventan mediciones: `preparar_estacion_cordoba.py`
documenta la transcripción y conserva la serie mensual con su fuente.

Uso directo (contraste con la celda CC, la más cercana a la estación):
    python3 scripts/validar_con_estacion.py \
        --salida public/data/validacion_estacion_cordoba.json

El CSV de la estación debe tener, como mínimo: anio,precipitacion_mm.

Criterios sobre los años en común:
* correlaciones de Pearson y Spearman anuales,
* sesgo medio, error absoluto medio y RMSE (mm/año),
* coincidencia del signo de la pendiente de Sen,
* p de Mann-Kendall de la serie local (sin corregir autocorrelación).

Interpretación: una correlación alta y un sesgo pequeño respaldan el uso del
punto de grilla como aproximación; una discrepancia en el signo de la tendencia
obliga a revisar la serie antes de usarla para decisiones de gestión. Es un
contraste punto–grilla, no una validación instrumental completa.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path

from robustez_estadistica import benjamini_hochberg, mk_p, sen_slope

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SERIES = ROOT / "public/data/nasa_power_anual.csv"
DEFAULT_STATION = ROOT / "public/data/validacion_local_cordoba.csv"


def pearson(a: list[float], b: list[float]) -> float:
    if len(a) < 3 or len(a) != len(b):
        return float("nan")
    ma, mb = sum(a) / len(a), sum(b) / len(b)
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    den = math.sqrt(sum((x - ma) ** 2 for x in a) * sum((y - mb) ** 2 for y in b))
    return num / den if den > 0 else float("nan")


def rangos(values: list[float]) -> list[float]:
    orden = sorted(range(len(values)), key=lambda i: values[i])
    out = [0.0] * len(values)
    i = 0
    while i < len(orden):
        j = i
        while j + 1 < len(orden) and values[orden[j + 1]] == values[orden[i]]:
            j += 1
        promedio = (i + j + 2) / 2
        for k in range(i, j + 1):
            out[orden[k]] = promedio
        i = j + 1
    return out


def spearman(a: list[float], b: list[float]) -> float:
    return pearson(rangos(a), rangos(b))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--estacion", type=Path, default=DEFAULT_STATION, help="CSV con mediciones locales")
    parser.add_argument("--series", type=Path, default=DEFAULT_SERIES, help="CSV anual NASA POWER")
    parser.add_argument("--codigo", default="CC", help="Código de cuenca, por ejemplo CC")
    parser.add_argument("--variable", default="precipitacion")
    parser.add_argument("--salida", type=Path, help="JSON opcional con el resultado")
    args = parser.parse_args()

    with args.estacion.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        required = {"anio", "precipitacion_mm"}
        if not required.issubset(reader.fieldnames or []):
            parser.error(f"Faltan columnas {sorted(required - set(reader.fieldnames or []))}")
        station: dict[int, float] = {}
        station_meta: dict[str, str] = {}
        for row in reader:
            try:
                year = int(row["anio"])
                value = float(row["precipitacion_mm"])
            except (TypeError, ValueError):
                continue
            if not math.isfinite(value) or value < 0:
                continue
            station[year] = value
            station_meta = {k: row.get(k, "") for k in ("estacion", "fuente", "doi", "latitud", "longitud", "altitud_m")}

    nasa: dict[int, float] = {}
    with args.series.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            if row["codigo"] == args.codigo and row["variable"] == args.variable:
                nasa[int(row["anio"])] = float(row["valor"])

    common = sorted(set(station) & set(nasa))
    if len(common) < 5:
        parser.error(
            f"Solo {len(common)} años en común para {args.codigo}/{args.variable}; "
            "se necesitan al menos 5 para un contraste mínimamente informativo."
        )

    local = [station[y] for y in common]
    satellite = [nasa[y] for y in common]
    slope_local = sen_slope(local, common) * 10
    slope_satellite = sen_slope(satellite, common) * 10
    error = [a - b for a, b in zip(local, satellite)]

    report = {
        "codigo": args.codigo,
        "variable": args.variable,
        "estacion": station_meta,
        "anios_en_comun": len(common),
        "periodo": [common[0], common[-1]],
        "correlacion_pearson": pearson(local, satellite),
        "correlacion_spearman": spearman(local, satellite),
        "sesgo_medio_local_menos_nasa": sum(error) / len(error),
        "error_absoluto_medio": sum(abs(e) for e in error) / len(error),
        "rmse": math.sqrt(sum(e * e for e in error) / len(error)),
        "pendiente_sen_local_por_decada": slope_local,
        "pendiente_sen_nasa_por_decada": slope_satellite,
        "coincide_signo_tendencia": (slope_local > 0) == (slope_satellite > 0),
        "mann_kendall_p_local": mk_p(local),
        "q_bh_local": benjamini_hochberg([mk_p(local)])[0],
        "advertencia": "Contraste punto–grilla descriptivo; no prueba significancia de la diferencia ni reemplaza calibración instrumental.",
    }

    print(json.dumps(report, ensure_ascii=False, indent=2))
    if args.salida:
        args.salida.parent.mkdir(parents=True, exist_ok=True)
        args.salida.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Guardado en {args.salida}")


if __name__ == "__main__":
    main()
