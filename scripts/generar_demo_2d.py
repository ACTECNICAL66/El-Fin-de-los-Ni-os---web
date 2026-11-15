#!/usr/bin/env python3
"""Reconstruye los datos del visor 2D a partir de la cuenca REAL digitalizada.

Ya no dibuja elipses sintéticas. Lee `contorno_cuenca.json`, generado por
`digitalizar_captura_cuenca.py` desde la captura del visor del equipo, y produce
polígonos de inundación que conservan los entrantes, el brazo norte y el lóbulo
sureste de Cuenca 1. La curva EVA se calibró con los valores visibles en esa
captura: cota 1167 m → 809,58 hm³ y 6,51 km²; Q = 0,5 m³/s → ≈51 años.

Limitación explícita: sin `Tabla dique 1.xlsx`, `Datos,cuenca 1 curvas.gpkg` ni
el `data.js` original, la georreferenciación y la EVA por tramos son
aproximadas. La forma, en cambio, proviene de la captura real. Para reemplazar
este producto por la salida exacta, ejecutar el generador original en la carpeta
local de Cuenca 1 y copiar su `data/data.js` aquí.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/simulacion-2d/data"
CONTOUR = OUT / "contorno_cuenca.json"
OUT.mkdir(parents=True, exist_ok=True)

ELEV_MIN, ELEV_MAX = 767, 1301
REF_ELEV = 1167
REF_VOL_HM3 = 809.58
REF_AREA_KM2 = 6.51
AB_LENGTH_M = 4160.0

# V(x) = V_total · x^(p+1), S(h) = dV/dh. Con V(1167)=809.58 hm³ y
# S(1167)=6.51 km² se despejan p y V_total de forma exacta.
H_REF = REF_ELEV - ELEV_MIN
SPAN = ELEV_MAX - ELEV_MIN
P_PLUS_1 = REF_AREA_KM2 * H_REF / REF_VOL_HM3
P = P_PLUS_1 - 1.0
X_REF = H_REF / SPAN
V_TOTAL = REF_VOL_HM3 / (X_REF ** P_PLUS_1)


def eva(elev: int) -> dict:
    x = (elev - ELEV_MIN) / SPAN
    vol_hm3 = V_TOTAL * (x ** P_PLUS_1)
    area_m2 = V_TOTAL * P_PLUS_1 / SPAN * (x ** P) * 1_000_000.0
    return {
        "elevation": elev,
        "slice_area_m2": round(area_m2, 1),
        "surface_area_m2": round(area_m2, 1),
        "partial_vol_m3": round(area_m2, 1),
        "cum_vol_m3": round(vol_hm3 * 1_000_000.0, 1),
        "cum_vol_hm3": round(vol_hm3, 6),
        "cum_vol_L": round(vol_hm3 * 1_000_000_000.0, 1),
    }


def px_to_lonlat(x: float, y: float, d: dict) -> list[float]:
    cx, cy = d["centroid_px"]
    center_lon, center_lat = d["centro_lonlat"]
    sc = d["escala"]
    return [
        round(center_lon + (x - cx) * sc["grados_lon_por_pixel"], 7),
        round(center_lat - (y - cy) * sc["grados_lat_por_pixel"], 7),
    ]


def angle_bin(x: float, y: float, d: dict) -> int:
    cx, cy = d["centroid_px"]
    a = math.atan2(y - cy, x - cx)
    n = d["n_bins"]
    return int((a + math.pi) / (2 * math.pi) * n) % n


def contour_polygon(d: dict, contour: list[list[float]]) -> list[list[float]]:
    """Convierte un contorno en píxeles a un anillo GeoJSON [lon, lat]."""
    pts = [px_to_lonlat(x, y, d) for x, y in contour]
    pts.append(pts[0])
    return [pts]


def scenario_polygon(d: dict, e: int, eva_row: dict, s_max: float) -> list[list[float]]:
    """Escala el contorno REAL; no genera elipses ni perfiles radiales con cuerdas."""
    cx, cy = d["centroid_px"]
    blue = d["blue_contour"]
    outer_factor = float(d["outer_factor"])
    s = math.sqrt(max(eva_row["surface_area_m2"] / (REF_AREA_KM2 * 1_000_000.0), 1e-6))
    t = 0.0 if s_max <= 1 else min(max((s - 1.0) / (s_max - 1.0), 0.0), 1.0)
    scale = s if e <= REF_ELEV else 1.0 + (outer_factor - 1.0) * t
    pts = []
    for x, y in blue:
        a = math.atan2(y - cy, x - cx)
        r = max(math.hypot(x - cx, y - cy) * scale, 6.0)
        pts.append(px_to_lonlat(cx + r * math.cos(a), cy + r * math.sin(a), d))
    pts.append(pts[0])
    return [pts]


def main() -> None:
    if not CONTOUR.exists():
        raise SystemExit(
            "Falta contorno_cuenca.json. Ejecutar primero "
            "scripts/digitalizar_captura_cuenca.py (requiere opencv-python-headless)."
        )
    d = json.loads(CONTOUR.read_text(encoding="utf-8"))

    eva_table = [eva(e) for e in range(ELEV_MIN, ELEV_MAX + 1)]
    eva_by = {r["elevation"]: r for r in eva_table}
    elevations = list(range(ELEV_MIN, ELEV_MAX, 25))
    if ELEV_MAX not in elevations:
        elevations.append(ELEV_MAX)
    s_max = math.sqrt(eva_by[ELEV_MAX]["surface_area_m2"] / (REF_AREA_KM2 * 1_000_000.0))

    features = []
    for e in elevations:
        row = eva_by[e]
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": scenario_polygon(d, e, row, s_max)},
                "properties": {
                    "elevation": e,
                    "volume_hm3": round(row["cum_vol_hm3"], 2),
                    "area_m2": round(row["surface_area_m2"], 0),
                    "area_km2": round(row["surface_area_m2"] / 1_000_000.0, 3),
                    "origen": "trazado_captura_real",
                },
            }
        )

    outer_coords = contour_polygon(d, d["outer_contour"])
    # El PNG limpio ya viene recortado con crop_box. Sus esquinas definen los
    # mismos límites del imageOverlay: así el fondo y los vectores coinciden.
    x0, y0, x1, y1 = d["crop_box"]
    sw = px_to_lonlat(x0, y1, d)
    ne = px_to_lonlat(x1, y0, d)
    west, south, east, north = sw[0], sw[1], ne[0], ne[1]
    pad_lon = (east - west) * 0.06
    pad_lat = (north - south) * 0.06
    bounds = [round(west, 7), round(south, 7), round(east, 7), round(north, 7)]

    config = {
        "elevation_range": [ELEV_MIN, ELEV_MAX],
        "default_elevation": REF_ELEV,
        "bounds": bounds,
        "scenario_elevations": elevations,
        "total_volume_hm3": round(eva_by[ELEV_MAX]["cum_vol_hm3"], 2),
        "max_surface_area_m2": round(eva_by[ELEV_MAX]["surface_area_m2"], 0),
        "crs": "EPSG:4326",
        "origen_geometria": "Digitalización de captura_simulacion_cuenca1_real.png",
        "origen_eva": "Curva calibrada con cota 1167 m: 809.58 hm³ y 6.51 km²",
        "advertencia": "Forma real trazada desde la captura; coordenadas y EVA por tramos aproximadas. Usar data.js del generador original para reemplazo exacto.",
        "demo": False,
    }
    flood = {
        "type": "FeatureCollection",
        "features": features,
        "origen": "captura_simulacion_cuenca1_real.png",
    }
    watershed = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": outer_coords},
                "properties": {"origen": "limite_naranja_captura", "demo": False},
            }
        ],
    }

    n_profile = 80
    s_vals = [AB_LENGTH_M * i / (n_profile - 1) for i in range(n_profile)]
    z_vals = [
        round(767 + 488 * ((v / AB_LENGTH_M) ** 0.82) + 9 * math.sin(6 * math.pi * v / AB_LENGTH_M), 1)
        for v in s_vals
    ]
    profile = {
        "a": [round((south + north) / 2, 7), round(west + pad_lon, 7)],
        "b": [round((south + north) / 2, 7), round(east - pad_lon, 7)],
        "s": [round(v, 1) for v in s_vals],
        "z": z_vals,
        "length_m": AB_LENGTH_M,
        "origen": "corte_A-B_4.16_km_captura",
    }

    (OUT / "elevation_volume_area.json").write_text(json.dumps(eva_table, separators=(",", ":")), encoding="utf-8")
    (OUT / "flood_scenarios.geojson").write_text(json.dumps(flood, separators=(",", ":")), encoding="utf-8")
    (OUT / "watershed_boundary.geojson").write_text(json.dumps(watershed, separators=(",", ":")), encoding="utf-8")
    (OUT / "config.json").write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUT / "escena_3d.json").write_text(json.dumps({"profile": profile}, separators=(",", ":")), encoding="utf-8")

    data_js = (
        "// Cuenca 1 — forma REAL trazada desde la captura del visor del equipo\n"
        "// Generado por scripts/digitalizar_captura_cuenca.py + scripts/generar_demo_2d.py\n"
        "// NO EDITAR A MANO. Reemplazar por data/data.js del generador original para exactitud GIS.\n\n"
        f"const CONFIG = {json.dumps(config, ensure_ascii=False, separators=(',', ':'))};\n\n"
        f"const EVA_DATA = {json.dumps(eva_table, separators=(',', ':'))};\n\n"
        f"const FLOOD_SCENARIOS = {json.dumps(flood, separators=(',', ':'))};\n\n"
        f"const WATERSHED_BOUNDARY = {json.dumps(watershed, separators=(',', ':'))};\n\n"
        "const MAPA_REAL_URL = 'data/mapa_cuenca_real.png';\n"
    )
    (OUT / "data.js").write_text(data_js, encoding="utf-8")

    fill_years = REF_VOL_HM3 * 1_000_000 / (0.5 * 3600 * 24 * 365)
    print(
        f"{len(eva_table)} filas EVA · {len(features)} escenarios · "
        f"cota {REF_ELEV}: {REF_VOL_HM3:.2f} hm³ / {REF_AREA_KM2:.2f} km² · "
        f"Q=0.5 m³/s → {fill_years:.1f} años"
    )
    print(f"Volumen máximo {config['total_volume_hm3']:.2f} hm³ · bounds {bounds}")


if __name__ == "__main__":
    main()
