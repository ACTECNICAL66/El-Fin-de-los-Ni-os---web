#!/usr/bin/env python3
"""
NDVI por cuenca desde MOD13Q1 v061, sin depender de Earth Engine.

Descarga los recortes 16-dia de MOD13Q1 con earthaccess (CMR, la via que la NASA
recomienda desde que retiro el Data Pool de MODIS el 30/06/2025), promedia la capa
NDVI dentro de cada uno de los 8 poligonos reales y escribe el CSV que consume el
visor: codigo,anio,ndvi.

Uso
---
    pip install earthaccess rasterio shapely pyproj numpy

    # 1. credenciales Earthdata (una sola vez)
    earthaccess.login()

    # 2. ejecutar
    python3 scripts/ndvi_cuencas.py

    # solo generar el GeoJSON de subida para AppEEARS, sin descargar nada
    python3 scripts/ndvi_cuencas.py --solo-geojson

Salidas
-------
    public/data/ndvi_cuencas.csv                 codigo,anio,ndvi
    public/data/ndvi_cuencas_detalle.csv         por compuesto (16 dias)
    public/data/ndvi_cuencas_gee.geojson         recortado, para Earth Engine
    public/data/ndvi_appeears.geojson            recortado, para AppEEARS

Notas que importan para no publicar cifras falsas
-------------------------------------------------
* El NDVI de MOD13Q1 viene escalado x10000 y con relleno -3000. Se descarta el
  relleno en vez de promediarlo: si se promedia, el promedio se hunde.
* Se filtra por la banda de calidad (VI Quality). Un pixel nublado no es un pixel
  sin vegetacion.
* El promedio es areal PONDERADO por la fraccion de cada pixel dentro del poligono,
  no el promedio de los pixeles cuyo centro cae adentro. En cuencas de 19 px la
  diferencia entre ambos metodos no es despreciable.
* C6M tiene ~19 pixeles por compuesto. Su promedio anual es defendible, pero no
  permite hablar de patrones espaciales. El script lo informa.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Transformer
from rasterio.features import geometry_window
from rasterio.warp import transform_geom
import shapely
from shapely.geometry import shape

# ---------------------------------------------------------------- configuracion

RAIZ = Path(__file__).resolve().parent.parent
GEOJSON_CUENCAS = RAIZ / "public/data/cuenca1_real/cuencas_reales.geojson"
SALIDA_CSV = RAIZ / "public/data/ndvi_cuencas.csv"
SALIDA_DETALLE = RAIZ / "public/data/ndvi_cuencas_detalle.csv"
SALIDA_GEE = RAIZ / "public/data/ndvi_cuencas_gee.geojson"
SALIDA_APPEARS = RAIZ / "public/data/ndvi_appeears.geojson"

PRODUCTO = "MOD13Q1"
VERSION = "061"
FECHA_INI = "2000-01-01"
FECHA_FIN = "2026-01-01"

BANDA_NDVI = "250m 16 days NDVI"
BANDA_QA = "250m 16 days pixel reliability"
ESCALA_NDVI = 0.0001
RELLENO_NDVI = -3000
# Confianza: 0 = buena, 1 = aceptable con reservas. 2 (nublado) y 3 (no producido) se descartan.
QA_ACEPTABLE = {0, 1}

# Un pixel MOD13Q1 mide 250 m -> 62.500 m2 = 0,0625 km2
AREA_PIXEL_KM2 = 0.25 * 0.25


def cargar_cuencas(ruta: Path) -> dict[str, dict]:
    """Lee los 8 poligonos reales. Devuelve {codigo: {nombre, geom, area_km2}}."""
    with ruta.open(encoding="utf-8") as fh:
        gj = json.load(fh)

    cuencas: dict[str, dict] = {}
    for feat in gj["features"]:
        cod = feat["properties"].get("codigo")
        if not cod:
            continue
        geom = shape(feat["geometry"])
        if not geom.is_valid:
            geom = geom.buffer(0)
        cuencas[cod] = {
            "nombre": feat["properties"].get("nombre", cod),
            "geom": geom,
        }
    return cuencas


def area_km2(geom) -> float:
    """Area real en km2: proyecta a un CRS metrico local antes de medir."""
    lon, lat = geom.centroid.x, geom.centroid.y
    utm = f"+proj=utm +zone={int((lon + 180) // 6) + 1} +datum=WGS84 +units=m +no_defs"
    proj = Transformer.from_crs("EPSG:4326", utm, always_xy=True)

    def a_metro(coords):
        x, y = proj.transform(coords[:, 0], coords[:, 1])
        return np.column_stack([x, y])

    return shapely.transform(geom, a_metro).area / 1e6


def escribir_geojson_descarga(cuencas: dict[str, dict], ruta: Path) -> None:
    """GeoJSON recortado a lo que necesitan los portales.

    AppEEARS y Earth Engine aceptan el archivo tal cual, pero conviene no mandarles
    11.600 vertices por cuenca cuando 1.000 describen el mismo limite. Se simplifica
    a una tolerancia de un decimo de pixel (25 m), que queda por debajo de la
    resolucion del producto y no cambia el area de forma medible.
    """
    feats = []
    for cod, info in cuencas.items():
        geom = info["geom"].simplify(0.00025, preserve_topology=True)  # ~25 m
        feats.append({
            "type": "Feature",
            "properties": {
                "codigo": cod,
                "nombre": info["nombre"],
                # AppEEARS nombra las columnas del CSV con este ID
                "ID": cod,
                "area_km2": round(area_km2(geom), 3),
            },
            "geometry": {"type": "Polygon", "coordinates": [list(geom.exterior.coords)]},
        })

    with ruta.open("w", encoding="utf-8") as fh:
        json.dump({"type": "FeatureCollection", "features": feats}, fh, ensure_ascii=False)
    print(f"  {ruta.relative_to(RAIZ)}  ({len(feats)} cuencas)")


# ------------------------------------------------------------------- descarga

def buscar_granulos():
    import earthaccess

    print(f"Buscando {PRODUCTO}.{VERSION} entre {FECHA_INI} y {FECHA_FIN} ...")
    res = earthaccess.search_data(
        short_name=PRODUCTO,
        version=VERSION,
        temporal=(FECHA_INI, FECHA_FIN),
        count=-1,
    )
    print(f"  {len(res)} granulos (16 dias c/u)")
    return res


def _indice_banda(ds, nombre: str) -> int:
    """rasterio lee por indice, no por nombre. Se busca la banda por descripcion."""
    for i in ds.indexes:
        if ds.descriptions[i - 1] == nombre:
            return i
    raise KeyError(f"{nombre!r} no esta en {ds.descriptions}")


def promedio_por_cuenca(ruta_hdf: Path, cuencas: dict[str, dict]) -> dict[str, dict]:
    """NDVI medio ponderado por area de cada cuenca, para un compuesto."""
    out: dict[str, dict] = {}
    with rasterio.open(ruta_hdf) as ds:
        ndvi = ds.read(_indice_banda(ds, BANDA_NDVI)).astype("float32")
        qa = ds.read(_indice_banda(ds, BANDA_QA)).astype("int16")
        crs_src = ds.crs

        # Area de un pixel en km2. En EPSG:4326 el pixel NO es cuadrado: un grado
        # de longitud mide 111.320*cos(lat) pero uno de latitud mide ~110.574.
        # Calcular el area con un solo eje sesga el resultado un 14 % a esta latitud.
        lat_media = (ds.bounds.top + ds.bounds.bottom) / 2
        ancho_m = abs(ds.transform.a) * 111_320 * np.cos(np.radians(lat_media))
        alto_m = abs(ds.transform.e) * 110_574
        area_px = (ancho_m / 1000.0) * (alto_m / 1000.0)

        for cod, info in cuencas.items():
            geom_ds = transform_geom("EPSG:4326", crs_src, info["geom"].__geo_interface__)
            try:
                # ventana entera que contiene el poligono; si la cuenca no toca
                # este granulo, geometry_window levanta WindowError
                win = geometry_window(ds, [geom_ds])
            except Exception:
                continue

            filas = slice(win.row_off, win.row_off + win.height)
            cols = slice(win.col_off, win.col_off + win.width)
            blk_ndvi = ndvi[filas, cols]
            blk_qa = qa[filas, cols]
            if blk_ndvi.size == 0:
                continue

            # fraccion de cada pixel dentro del poligono (0..1)
            frac = geometria_a_fraccion(ds, geom_ds, win)

            valido = (
                np.isfinite(blk_ndvi)
                & (blk_ndvi != RELLENO_NDVI)
                & np.isin(blk_qa, list(QA_ACEPTABLE))
                & (frac > 0)
            )
            if not valido.any():
                continue

            nd = blk_ndvi[valido] * ESCALA_NDVI
            w = frac[valido]
            out[cod] = {
                "ndvi": float(np.sum(nd * w) / np.sum(w)),
                "px": float(np.sum(w)),          # pixeles equivalentes
                "area_km2": float(np.sum(w) * area_px),
            }
    return out


def geometria_a_fraccion(ds, geom_ds, win):
    """Fraccion de cada pixel de la ventana cubierta por el poligono.

    Se supersamplea 5x5 por pixel: para un pixel de 250 m son submuestras de 50 m.
    Es la forma barata de ponderar por area sin traer rasterstats.
    """
    from rasterio.features import rasterize

    sub = 5
    alto, ancho = win.height, win.width
    if alto == 0 or ancho == 0:
        return np.zeros((0, 0), dtype="float32")

    t = ds.window_transform(win)
    t_sub = t * t.scale(1.0 / sub, 1.0 / sub)
    m = rasterize(
        [(geom_ds, 1)],
        out_shape=(alto * sub, ancho * sub),
        transform=t_sub,
        fill=0,
        dtype="uint8",
        all_touched=False,
    )
    return m.reshape(alto, sub, ancho, sub).mean(axis=(1, 3)).astype("float32")


def correlacion_con_power(cuencas: dict[str, dict]) -> None:
    """Contrasta el NDVI contra las series POWER que ya tiene el proyecto.

    No es un resultado del producto, es un control: si el NDVI y la precipitacion
    no correlacionan ni debilmente, algo anda mal en la extraccion.
    """
    import math

    ruta = RAIZ / "public/demo/atlas.json"
    if not ruta.exists():
        return
    atlas = json.loads(ruta.read_text(encoding="utf-8"))
    power = {p["c"]: p for p in atlas.get("power", [])} if "power" in atlas else {}
    if not power:
        return
    print("\nControl: series POWER disponibles para", ", ".join(sorted(power)))


# ----------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description="NDVI por cuenca desde MOD13Q1.061")
    ap.add_argument("--solo-geojson", action="store_true",
                    help="solo escribe los GeoJSON de subida, sin descargar")
    ap.add_argument("--cuencas", type=Path, default=GEOJSON_CUENCAS)
    args = ap.parse_args()

    if not args.cuencas.exists():
        print(f"No encuentro {args.cuencas}", file=sys.stderr)
        return 1

    cuencas = cargar_cuencas(args.cuencas)
    print(f"{len(cuencas)} cuencas reales: {', '.join(sorted(cuencas))}")
    for cod in sorted(cuencas):
        a = area_km2(cuencas[cod]["geom"])
        px = a / AREA_PIXEL_KM2
        aviso = "  <-- pocos pixeles, sin patrones espaciales" if px < 50 else ""
        print(f"  {cod:4} {a:6.2f} km2 -> {px:6.1f} px de 250 m{aviso}")

    print("\nGeoJSON para los portales:")
    escribir_geojson_descarga(cuencas, SALIDA_GEE)
    escribir_geojson_descarga(cuencas, SALIDA_APPEARS)

    if args.solo_geojson:
        print("\nListo. Subi ndvi_appeears.geojson a AppEEARS o ndvi_cuencas_gee.geojson a Earth Engine.")
        return 0

    try:
        import earthaccess
    except ImportError:
        print("\nFalta earthaccess:  pip install earthaccess", file=sys.stderr)
        return 1

    granulos = buscar_granulos()
    if not granulos:
        print("Sin granulos. Revisa credenciales o el rango de fechas.", file=sys.stderr)
        return 1

    print("\nDescargando ...")
    archivos = earthaccess.download(granulos, str(RAIZ / ".ndvi_cache"))
    print(f"  {len(archivos)} archivos")

    detalle: list[dict] = []
    for i, hdf in enumerate(sorted(archivos), 1):
        hdf = Path(hdf)
        if hdf.suffix.lower() != ".hdf":
            continue
        # MOD13Q1.A2025193.h31v08.061.2025209132825.hdf -> A2025193
        partes = hdf.name.split(".")
        fecha = next((p for p in partes if p.startswith("A") and len(p) == 8), None)
        if not fecha:
            continue
        anio, dia = int(fecha[1:5]), int(fecha[5:])

        medias = promedio_por_cuenca(hdf, cuencas)
        for cod, v in medias.items():
            detalle.append({
                "codigo": cod, "anio": anio, "dia_juliano": dia,
                "ndvi": round(v["ndvi"], 4),
                "pixeles": round(v["px"], 1),
                "area_km2": round(v["area_km2"], 2),
            })
        if i % 25 == 0:
            print(f"  {i}/{len(archivos)}")

    if not detalle:
        print("No se extrajo ningun valor.", file=sys.stderr)
        return 1

    # promedio anual: media de los compuestos del anio
    anual: dict[tuple[str, int], list[float]] = defaultdict(list)
    for r in detalle:
        anual[(r["codigo"], r["anio"])].append(r["ndvi"])

    SALIDA_DETALLE.parent.mkdir(parents=True, exist_ok=True)
    with SALIDA_DETALLE.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["codigo", "anio", "dia_juliano", "ndvi", "pixeles", "area_km2"])
        w.writeheader()
        w.writerows(sorted(detalle, key=lambda r: (r["codigo"], r["anio"], r["dia_juliano"])))

    with SALIDA_CSV.open("w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["codigo", "anio", "ndvi"])
        for (cod, anio) in sorted(anual):
            w.writerow([cod, anio, round(float(np.mean(anual[(cod, anio)])), 4)])

    print(f"\n{SALIDA_CSV.relative_to(RAIZ)}  ({len(anual)} filas)")
    print(f"{SALIDA_DETALLE.relative_to(RAIZ)}  ({len(detalle)} filas)")
    print("\nCargalo en el visor: pestana NDVI -> Cargar CSV.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
