#!/usr/bin/env python3
"""Prepara la serie observada del Observatorio Córdoba para el contraste local.

Fuente: Canziani, Lakkis & Yuchechen (2025), dataset Zenodo 15013403 hoja
"Córdoba original data". La publicación describe la estación en 31.3°S,
64.2°O, 425 m s.n.m., con registro 1873–2023. Aquí se conserva el tramo
2000–2023, coincidente con NASA POWER 2000–2025. Los valores son precipitación
mensual en mm, sin homogeneizar, tal como aparecen en el archivo fuente.

Uso:
    python3 scripts/preparar_estacion_cordoba.py

Salidas:
    public/data/estacion_cordoba_observatorio_mensual.csv
    public/data/validacion_local_cordoba.csv
"""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/data"

ESTACION = "Observatorio Córdoba"
FUENTE = "Canziani, Lakkis & Yuchechen (2025), Zenodo 15013403 — Córdoba original data"
DOI = "https://doi.org/10.5281/zenodo.15013403"
LATITUD = "-31.3"
LONGITUD = "-64.2"
ALTITUD = "425"

# anio, ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic (mm)
RAW = """
2000,150.8,136.6,105.1,116.3,36.5,0.2,10,1.1,13.3,103.8,165.5,119.7
2001,185,28,183.7,111.8,15,4.9,4.3,21.1,78,99.4,82.4,87.7
2002,103.2,51.4,108.5,51,11.1,1.6,29,20.2,5.1,84.3,165.7,94.6
2003,161.1,115.4,152.8,78.1,16.9,11.3,9.4,0,0,69,135.6,297.3
2004,44.5,58.5,123.2,50.2,34.9,0,28.4,0,6.1,50.9,98.9,193.1
2005,158.7,81.8,133.6,29.9,1.7,1.2,22.7,7.7,12,72,154,139.1
2006,160.5,70.4,51.5,93.1,3.7,10.5,4,0,12,59.7,116.6,192.3
2007,103.6,84.2,194.8,53.2,21.6,2.1,4.4,0,44.9,11.2,47.9,63.5
2008,144.6,122.6,143.6,7,3.2,0.1,0,6,53.2,44.4,87.9,87
2009,90.1,57.5,56.7,3,14.8,0,18.9,0,29.4,10.8,103.1,135.5
2010,41.3,180,135.7,51.2,26,6.6,0,1,91.4,34.3,71,71.8
2011,131.9,129.8,39.2,31.1,2,20,4,3.5,0,88.3,113.9,50.2
2012,195.7,191.5,38.2,30.7,6.2,0,0,32.9,72,132.9,76.7,124.5
2013,65.8,108.5,101,42.1,27,0.8,0,1,4.2,100.5,105.6,95.7
2014,33.5,211,91.4,90,14.5,3.3,5.7,0,49.7,126,104.5,108.4
2015,112.9,382.6,66.3,75.8,14.3,1.8,12.8,15,10.2,24.3,77.7,79.1
2016,101.3,447.2,58.9,127.4,13.7,48,3.9,1,0,100.4,43.1,152.2
2017,163.6,108.4,83,63.8,21.5,9.5,0,2.3,81.7,46.7,38.6,146.9
2018,79.6,114.5,3.2,22.7,120,0,0,3,37.8,82.3,142,119.6
2019,235.2,28.1,163.5,86.5,28.2,8.2,2.4,0,6,53.7,86,192
2020,48.5,135,70.2,35.5,0,0,0,0,7.2,43.5,45,106
2021,190.7,67.8,130.1,39.2,20.5,6.2,0,0,24,88,155.3,73
2022,185.5,74.7,90,7.8,7,6,0,15,20.4,30,68.7,84.7
2023,133.7,39.7,151.8,29.2,27,0.1,16.7,0,7.2,13.3,83.1,139.8
""".strip()

MESES = ("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    monthly_path = OUT / "estacion_cordoba_observatorio_mensual.csv"
    annual_path = OUT / "validacion_local_cordoba.csv"

    registros = []
    for linea in RAW.splitlines():
        partes = [p.strip() for p in linea.split(",")]
        if len(partes) != 13:
            raise ValueError(f"Fila inválida: {linea}")
        anio = int(partes[0])
        valores = [float(p) for p in partes[1:]]
        if any(v < 0 for v in valores):
            raise ValueError(f"Precipitación negativa en {anio}")
        for mes, valor in enumerate(valores, start=1):
            registros.append({
                "anio": anio,
                "mes": f"{mes:02d}",
                "precipitacion_mm": valor,
                "estacion": ESTACION,
                "fuente": FUENTE,
                "doi": DOI,
                "latitud": LATITUD,
                "longitud": LONGITUD,
                "altitud_m": ALTITUD,
            })

    with monthly_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(registros[0]))
        writer.writeheader()
        writer.writerows(registros)

    anuales: dict[int, float] = {}
    for r in registros:
        anuales[int(r["anio"])] = anuales.get(int(r["anio"]), 0.0) + float(r["precipitacion_mm"])

    with annual_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["anio", "precipitacion_mm", "estacion", "fuente", "doi", "latitud", "longitud", "altitud_m"])
        writer.writeheader()
        for anio, total in sorted(anuales.items()):
            writer.writerow({
                "anio": anio,
                "precipitacion_mm": round(total, 1),
                "estacion": ESTACION,
                "fuente": FUENTE,
                "doi": DOI,
                "latitud": LATITUD,
                "longitud": LONGITUD,
                "altitud_m": ALTITUD,
            })

    print(f"{len(registros)} registros mensuales → {monthly_path}")
    print(f"{len(anuales)} totales anuales → {annual_path}")


if __name__ == "__main__":
    main()
