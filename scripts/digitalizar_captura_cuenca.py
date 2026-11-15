#!/usr/bin/env python3
"""Digitaliza la forma real de Cuenca 1 desde la captura del visor del equipo.

El generador original (`generar_escenarios_cuenca1.py`) necesita
`Tabla dique 1.xlsx` y `Datos,cuenca 1 curvas.gpkg`, que no están en el repo.
Para que la vista integrada deje de dibujar elipses sintéticas, este script
extrae el polígono azul y el límite naranja de
`public/data/captura_simulacion_cuenca1_real.png` y produce:

* `public/simulacion-2d/data/contorno_cuenca.json` — contorno y perfiles radiales.
* `public/simulacion-2d/data/mapa_cuenca_real.png` — fondo limpio, sin tiles,
  sin marcas «API KEY REQUIRED» y sin el cartel de error de Leaflet.

Después ejecutar `python3 scripts/generar_demo_2d.py` para reconstruir
`data.js`, el GeoJSON y la curva EVA calibrada.

Dependencias para VOLVER A DIGITALIZAR (no para usar la web):
    pip install opencv-python-headless numpy

La georreferenciación es aproximada: se calibra con los 4,16 km del corte A-B
que muestra la captura y con el centro de trabajo de Córdoba. Para coordenadas
exactas hay que reemplazar `data.js` por la salida del generador original con el
GPKG y el XLSX reales.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public/data/captura_simulacion_cuenca1_real.png"
OUT = ROOT / "public/simulacion-2d/data"
OUT.mkdir(parents=True, exist_ok=True)

# Centro aproximado del área de trabajo y escala derivada del corte A-B.
CENTER_LON = -64.42
CENTER_LAT = -31.38
AB_LENGTH_M = 4160.0
N_BINS = 720


def fill_circular(values: list[float]) -> list[float]:
    """Interpola los bines sin observación alrededor de los 360°."""
    idx = [i for i, v in enumerate(values) if v > 0]
    if not idx:
        raise RuntimeError("No se encontraron píxeles del contorno exterior")
    pos = sorted([i - N_BINS for i in idx] + idx + [i + N_BINS for i in idx])
    val = [values[i % N_BINS] for i in pos]
    out = []
    j = 0
    for i in range(N_BINS):
        while j + 1 < len(pos) and pos[j + 1] < i:
            j += 1
        if pos[j] == i:
            out.append(val[j])
        elif j + 1 < len(pos):
            p0, p1 = pos[j], pos[j + 1]
            v0, v1 = val[j], val[j + 1]
            out.append(v0 + (v1 - v0) * (i - p0) / (p1 - p0))
        else:
            out.append(val[j])
    # Suavizado circular para cerrar los tramos discontinuos de la línea naranja.
    k = 11
    ext = out[-k:] + out + out[:k]
    smoothed = []
    for i in range(k, k + N_BINS):
        smoothed.append(sum(ext[i - k // 2 : i + k // 2 + 1]) / k)
    return smoothed


def main() -> None:
    try:
        import cv2
        import numpy as np
    except ImportError as exc:
        raise SystemExit(
            "Se necesitan opencv-python-headless y numpy para redigitalizar la captura. "
            "Los archivos ya generados están en public/simulacion-2d/data/"
        ) from exc

    img = cv2.imread(str(SRC), cv2.IMREAD_COLOR)
    if img is None:
        raise SystemExit(f"No se pudo leer {SRC}")
    h, w = img.shape[:2]
    # La barra lateral termina en x≈362 en la captura de 1862 px.
    x0 = round(w * 362 / 1862)
    crop = img[:, x0:, :]
    ch, cw = crop.shape[:2]
    B, G, R = cv2.split(crop)

    # Azul de relleno #253D60 (BGR 96,61,37); excluye el panel #16213E.
    blue = ((B > 70) & (B > R + 22) & (B > G + 12) & (R < 140) & (G < 160)).astype(np.uint8) * 255
    blue = cv2.morphologyEx(blue, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    blue = cv2.morphologyEx(blue, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    contours, _ = cv2.findContours(blue, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        raise SystemExit("No se detectó el polígono azul de inundación")
    largest = max(contours, key=cv2.contourArea)
    filled = np.zeros_like(blue)
    cv2.drawContours(filled, [largest], -1, 255, thickness=cv2.FILLED)
    approx = cv2.approxPolyDP(largest, 2.0, True).reshape(-1, 2)
    blue_contour = [[float(x), float(y)] for x, y in approx]

    bx, by, bw, bh = cv2.boundingRect(largest)
    cx, cy = bx + bw / 2.0, by + bh / 2.0
    m_per_px = AB_LENGTH_M / float(bw)
    lon_scale = m_per_px / (111_320.0 * math.cos(math.radians(CENTER_LAT)))
    lat_scale = m_per_px / 110_540.0

    # Naranja #FF6B35 (BGR 53,107,255); se filtra el cartel de error a la izquierda.
    orange = ((R > 170) & (G > 40) & (G < 175) & (B < 115)).astype(np.uint8) * 255
    # La línea naranja es discontinua; dilatarla evita tramos rectos largos al
    # interpolar bines angulares sin observación.
    orange = cv2.dilate(orange, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    ys, xs = np.where(orange > 0)
    keep = (xs > cw * 0.50) & (xs < cw * 0.98) & (ys > ch * 0.20) & (ys < ch * 0.98)
    xs, ys = xs[keep], ys[keep]

    def angle_bin(x: float, y: float) -> int:
        a = math.atan2(y - cy, x - cx)
        return int((a + math.pi) / (2 * math.pi) * N_BINS) % N_BINS

    blue_radii = [0.0] * N_BINS
    for x, y in blue_contour:
        i = angle_bin(x, y)
        blue_radii[i] = max(blue_radii[i], math.hypot(x - cx, y - cy))
    blue_radii = fill_circular(blue_radii)

    orange_radii = [0.0] * N_BINS
    for x, y in zip(xs.tolist(), ys.tolist()):
        i = angle_bin(float(x), float(y))
        orange_radii[i] = max(orange_radii[i], math.hypot(float(x) - cx, float(y) - cy))
    orange_radii = fill_circular(orange_radii)

    # El límite de cuenca se obtiene escalando el CONTORNO AZUL COMPLETO, no
    # un perfil radial: así se conservan los entrantes, el brazo norte y el
    # lóbulo sureste sin crear cuerdas rectas en zonas cóncavas.
    ratio = []
    for rb, ro in zip(blue_radii, orange_radii):
        ratio.append(min(max(ro / rb if rb else 1.12, 1.06), 1.34))
    ratio = fill_circular(ratio)
    ordered = sorted(ratio)
    factor = min(max(ordered[len(ordered) // 2], 1.10), 1.24)
    outer_radii = [rb * factor for rb in blue_radii]
    outer_contour = [
        [cx + (x - cx) * factor, cy + (y - cy) * factor] for x, y in blue_contour
    ]

    data = {
        "origen": "captura_simulacion_cuenca1_real.png",
        "crop": {"x0": x0, "y0": 0, "width": cw, "height": ch},
        "blue_contour": blue_contour,
        "outer_contour": outer_contour,
        "outer_factor": factor,
        "blue_bbox": [bx, by, bw, bh],
        "centroid_px": [cx, cy],
        "centro_lonlat": [CENTER_LON, CENTER_LAT],
        "escala": {
            "ab_longitud_m": AB_LENGTH_M,
            "ab_pixeles": bw,
            "m_por_pixel": m_per_px,
            "grados_lon_por_pixel": lon_scale,
            "grados_lat_por_pixel": lat_scale,
        },
        "n_bins": N_BINS,
        "blue_radii_px": blue_radii,
        "outer_radii_px": outer_radii,
        "orange_pixels": int(len(xs)),
        "blue_area_px": float(cv2.contourArea(largest)),
        "advertencia": "Georreferenciación aproximada desde la captura; usar config.json/data.js del generador original para coordenadas exactas.",
    }

    # Fondo limpio: sólo el relleno azul real y el límite naranja trazado.
    bg = np.full((ch, cw, 3), (32, 24, 16), dtype=np.uint8)  # BGR de #101820
    cv2.fillPoly(bg, [largest], (96, 61, 37), lineType=cv2.LINE_AA)  # #253D60
    cv2.polylines(bg, [largest], True, (149, 113, 89), 2, lineType=cv2.LINE_AA)  # #597195
    outer_pts = [[int(round(x)), int(round(y))] for x, y in outer_contour]
    ox = [p[0] for p in outer_pts]
    oy = [p[1] for p in outer_pts]
    pad_x = (max(ox) - min(ox)) * 0.12
    pad_y = (max(oy) - min(oy)) * 0.12
    crop_box = [
        max(0, int(min(ox) - pad_x)),
        max(0, int(min(oy) - pad_y)),
        min(cw, int(max(ox) + pad_x)),
        min(ch, int(max(oy) + pad_y)),
    ]
    data["crop_box"] = crop_box
    # Límite continuo y limpio; el estilo discontinuo lo aplica Leaflet al
    # vector WATERSHED_BOUNDARY, no al fondo raster.
    cv2.polylines(
        bg,
        [np.array(outer_pts, dtype=np.int32)],
        True,
        (53, 107, 255),
        2,
        lineType=cv2.LINE_AA,
    )  # #FF6B35
    (OUT / "contorno_cuenca.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    x0, y0, x1, y1 = crop_box
    cv2.imwrite(str(OUT / "mapa_cuenca_real.png"), bg[y0:y1, x0:x1])

    print(
        f"Contorno azul: {len(blue_contour)} vértices, bbox {bw}×{bh} px, "
        f"{m_per_px:.2f} m/px; píxeles naranja {len(xs)}"
    )
    print("Escritos contorno_cuenca.json y mapa_cuenca_real.png")


if __name__ == "__main__":
    main()
