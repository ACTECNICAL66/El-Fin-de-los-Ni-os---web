#!/usr/bin/env python3
"""Download annual basin series from the official NASA POWER monthly point API."""

import argparse
import calendar
import csv
import json
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PARAMETERS = {
    "PRECTOTCORR": ("precipitacion", "mm/año", "sum"),
    "T2M": ("temperatura", "°C", "mean"),
    "T2M_MAX": ("temperatura_maxima", "°C", "mean"),
    "WS2M": ("viento", "m/s", "mean"),
    "GWETROOT": ("humedad_suelo", "fracción", "mean"),
    "ALLSKY_SFC_SW_DWN": ("radiacion_solar", "kWh/m²/día", "mean"),
}


def representative_point(feature):
    geometry = feature["geometry"]
    coordinates = geometry["coordinates"]
    ring = coordinates[0] if geometry["type"] == "Polygon" else coordinates[0][0]
    longitude = [point[0] for point in ring]
    latitude = [point[1] for point in ring]
    return (min(longitude) + max(longitude)) / 2, (min(latitude) + max(latitude)) / 2


def fetch_basin(feature, start, end):
    lon, lat = representative_point(feature)
    query = urlencode({
        "parameters": ",".join(PARAMETERS), "community": "AG",
        "longitude": lon, "latitude": lat, "format": "JSON",
        "start": start, "end": end,
    })
    request = Request(
        f"https://power.larc.nasa.gov/api/temporal/monthly/point?{query}",
        headers={"User-Agent": "ElFinDeLosNinos/1.0 (student research)"},
    )
    with urlopen(request, timeout=45) as response:
        payload = json.load(response)
    return lon, lat, payload["properties"]["parameter"]


def annual_values(monthly, start, end, aggregation):
    by_year = {}
    for date, raw in monthly.items():
        if date.endswith("13"):
            continue
        year, month = int(date[:4]), int(date[4:6])
        value = float(raw)
        if year < start or year > end or month < 1 or month > 12 or value <= -900:
            continue
        days = calendar.monthrange(year, month)[1]
        by_year.setdefault(year, []).append((value, days))
    return {
        year: (sum(value * days for value, days in values)
               if aggregation == "sum"
               else sum(value * days for value, days in values) / sum(days for _, days in values))
        for year, values in by_year.items() if len(values) == 12
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--geojson", type=Path, default=Path("public/data/cuencas.geojson"))
    parser.add_argument("--output", type=Path, default=Path("data/nasa_power_anual.csv"))
    parser.add_argument("--start", type=int, default=2000)
    parser.add_argument("--end", type=int, default=2025)
    args = parser.parse_args()
    basins = json.loads(args.geojson.read_text(encoding="utf-8"))["features"]
    rows = []
    for index, feature in enumerate(basins):
        props = feature["properties"]
        lon, lat, datasets = fetch_basin(feature, args.start, args.end)
        for parameter, (variable, unit, aggregation) in PARAMETERS.items():
            values = annual_values(datasets.get(parameter, {}), args.start, args.end, aggregation)
            for year, value in sorted(values.items()):
                rows.append({
                    "cuenca": props["nombre"], "codigo": props["codigo"],
                    "variable": variable, "unidad": unit, "anio": year,
                    "valor": round(value, 5), "parametro": parameter,
                    "latitud": round(lat, 6), "longitud": round(lon, 6),
                    "fuente": "NASA POWER Monthly API",
                })
        print(f"{props['codigo']}: descargadas series disponibles de {args.start}-{args.end}")
        if index + 1 < len(basins):
            time.sleep(0.5)
    if not rows:
        parser.error("NASA POWER no devolvió años completos; no se publicó un CSV vacío.")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="") as stream:
        fields = ["cuenca", "codigo", "variable", "unidad", "anio", "valor", "parametro", "latitud", "longitud", "fuente"]
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    print(f"{len(rows)} observaciones anuales guardadas en {args.output}")


if __name__ == "__main__":
    main()
