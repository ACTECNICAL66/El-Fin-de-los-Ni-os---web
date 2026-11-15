# Simulación de llenado 2D — Cuenca 1 real, integración 2026

Esta carpeta ya **no dibuja elipses sintéticas**. El polígono de inundación y el
límite de cuenca se digitalizaron desde la captura del visor calculado por el
equipo (`../data/captura_simulacion_cuenca1_real.png`). La EVA se calibró con los
valores visibles en esa captura: **cota 1167 m → 809,58 hm³ y 6,51 km²**, con
Q = 0,5 m³/s → ≈51 años de llenado.

## Archivos

- `index.html`: vista funcional. Leaflet/Chart.js locales, fondo limpio local,
  sin tiles externos, sin API key y sin cartel de error de conexión.
- `index_2d_original.html`: aviso/redirección a la vista integrada. La copia
  literal del HTML recibido se conservó fuera del repo para auditoría.
- `data/contorno_cuenca.json`: 150 vértices del polígono azul real, contorno
  exterior escalado, `crop_box` alineado con el PNG, perfiles radiales
  auxiliares y calibración aproximada.
- `data/mapa_cuenca_real.png`: fondo limpio generado desde la captura; conserva
  la forma irregular, el brazo norte y el lóbulo sureste, sin marcas de agua.
- `data/data.js`: `CONFIG`, `EVA_DATA`, `FLOOD_SCENARIOS`,
  `WATERSHED_BOUNDARY` y `MAPA_REAL_URL` para el visor.
- `data/flood_scenarios.geojson`, `watershed_boundary.geojson`,
  `elevation_volume_area.json`, `config.json`, `escena_3d.json`: productos
  vectoriales y curva cota–volumen–área.

## Reproducir

```bash
# 1) Digitalizar otra vez la captura (sólo si cambia la imagen).
#    Requiere: pip install opencv-python-headless numpy
python3 scripts/digitalizar_captura_cuenca.py

# 2) Reconstruir data.js, GeoJSON y EVA (sólo stdlib de Python).
python3 scripts/generar_demo_2d.py
```

`scripts/generar_escenarios_cuenca1.py` y `scripts/servidor_visor_2d.py` son el
generador y el servidor originales aportados por el equipo. El primero necesita
`Tabla dique 1.xlsx`, `Datos,cuenca 1 curvas.gpkg`, `shapely`, `openpyxl` y
`pyproj`. Si se ejecuta en la carpeta local de Cuenca 1, copiar su `data/data.js`
aquí reemplaza la georreferenciación aproximada por las coordenadas y la EVA
exactas del proyecto QGIS.

## Qué conserva del visor original

- Slider indexado por cota: 767–1301 m, con cota inicial 1167 m.
- Interpolación lineal de la tabla EVA a 1 m.
- Volumen, superficie, tiempo de llenado `t = V/Q` y caudal específico.
- Curva cota–volumen–superficie y sección topográfica A–B de 4,16 km.
- Animación continua con `requestAnimationFrame`.
- Presets de caudal ENSO: El Niño 5,0 · Normal 0,8 · La Niña 0,1 m³/s.

**Importante:** esos presets son caudales de diseño, no un pronóstico ENSO ni la
atribución estadística publicada en `/#enso`.

## Correcciones aplicadas al HTML recibido

1. Se eliminó la llamada duplicada a `init()`.
2. Se corrigió el orden de `bounds` en `fitBounds`.
3. Se reemplazaron los tiles CARTO/OpenStreetMap/OpenTopoMap por una imagen
   local: adiós a «API KEY REQUIRED» y al error «Verifica tu conexión a internet».
4. Se vendorizaron Leaflet y Chart.js; no hay CDN de librerías.
5. Se agregó banner de trazado real, nota bajo los chips ENSO y fondo local.
6. `data.js` se genera automáticamente a partir del contorno digitalizado.

## Limitación honesta

La **forma** es la de la cuenca proporcionada; la **georreferenciación** y la
curva EVA por tramos son aproximaciones calibradas con la captura, porque el repo
no contiene el GPKG, el XLSX ni el `data.js` de salida del generador. Para
coordenadas exactas, publicar esos productos o ejecutar el generador original en
el paquete local de >20 GB.
