# El Fin de los Niños — Panel Hídrico (entrega 2026)

> Proyecto del **NASA Space Apps Challenge 2026** · Desafío *Be an Earth System Trend Detective!* · IPET N°66 Dr. José Antonio Balseiro, Córdoba, Argentina.
> Última actualización: noviembre 2026.

Análisis reproducible de tendencias climáticas en siete puntos de cuenca de
Córdoba, atribución ENSO con ONI / Niño 3.4, inventario de cuencas y simulador
de llenado 2D, con mapa comparativo, correcciones estadísticas, un caso de
estudio y la réplica del prototipo electrónico.

**Idea rectora:** primero los datos y sus límites; después la tecnología
propuesta. **Sí se atribuye variabilidad a El Niño y La Niña**: 504 pruebas con
ONI de NOAA CPC, composites, escenarios condicionales de 3–6 meses y una serie
mensual real del Observatorio Córdoba. El dron, los sensores y el panel de
monitoreo se publican como réplica reproducible sin telemetría en vivo.

## Contenido de la web

| Sección |Qué muestra |
|---|---|
| Detective Mode | Series anuales NASA POWER 2000–2025, pendiente de Sen, Mann–Kendall nominal y ahora también p corregido y q de FDR |
| Mapa comparativo | 7 puntos de grilla (no polígonos coloreados) con dirección y nivel de respaldo, más matriz 7 × 6 |
| Respaldo estadístico | Autocorrelación, 42 pruebas, Bonferroni/BH, tabla de las 42 series y contraste con una estación real |
| Cuencas y ENSO | `/#cuencas`: QGIS, DEM, EVA, inventario, capturas y visor 2D con la forma real de Cuenca 1 digitalizada. `/#enso`: 504 pruebas, serie observada, composites y escenarios |
| Caso de estudio | Cuenca Sur · temperatura media: resultado robusto, límites y relevancia para la gestión; más un contraejemplo de precipitación |
| Encuadre del desafío | Las cinco preguntas del reto 2026 enlazadas a su evidencia, más el alcance verificado de cuencas, ENSO, escenarios y réplica reproducible |
| Electrónica y monitoreo | Resumen en el inicio y página completa en `/monitoreo` (ESP32, BOM, firmware, hoja de ruta) |
| Panel de control V4 | `/panel`: simulación interactiva integrada al diseño del sitio; conserva `/panel/PaneldeControlV3.html` como archivo original del equipo |
| Aplicaciones futuras | Dron AG-01 como concepto de diseño, NDVI/GPM pendientes, ampliación de la red de estaciones y piloto de campo |

## Datos

- `public/data/nasa_power_anual.csv` — 1.092 observaciones (7 puntos × 6 variables × 26 años), descarga NASA POWER Monthly API del 11/11/2026.
- `public/data/trend_results.csv` — 42 resultados originales (p nominal, sin corregir autocorrelación).
- `public/data/robustez_estadistica.json` y `.csv` — p con varianza ajustada, p con preblanqueamiento (TFPW), q de Benjamini–Hochberg, categorías y validaciones.
- `public/data/oni_ascii_cpc_1998_2026.txt` y `oni_cpc_fuente.json` — subconjunto raw y metadatos del ONI oficial de NOAA CPC.
- `public/data/enso_atribucion.json/.csv`, `enso_fases_anuales.csv`, `enso_mensual_estacion.json` — 504 pruebas, composites y contraste mensual significativo.
- `public/data/escenarios_enso_3_6_meses.json` — bandas condicionales históricas P10–P90; no es pronóstico operativo.
- `public/data/estacion_cordoba_observatorio_mensual.csv` y `validacion_local_cordoba.csv` — 288 meses reales y 24 totales anuales del Observatorio Córdoba.
- `public/data/validacion_estacion_cordoba.json` — r = 0,71, Spearman 0,76, sesgo −34,1 mm/año e igualdad de signo de Sen.
- `public/data/inventario_cuencas.json`, `captura_cuencas_*.png` y `captura_simulacion_cuenca1_real.png` — inventario del paquete de >20 GB, capturas de archivos y referencia del visor calculado.
- `public/data/cuencas.geojson` — polígonos esquemáticos de referencia (rectángulos), no delineaciones hidrológicas.

Ver [`VALIDACION_Y_ESTADISTICA.md`](VALIDACION_Y_ESTADISTICA.md) para la
metodología, los resultados y las referencias.

## Reproducir

```bash
npm ci
npm run dev          # http://localhost:3000
npm run check        # TypeScript
npm run build        # genera dist/public para GitHub Pages
```

Análisis en Python (sin dependencias externas):

```bash
python3 scripts/descargar_nasa_power.py        # requiere acceso a la API NASA POWER
python3 scripts/analisis_tendencias.py --input data/nasa_power_anual.csv --output public/data/trend_results.csv
python3 scripts/robustez_estadistica.py        # genera los productos corregidos
python3 scripts/preparar_estacion_cordoba.py  # reproduce los 288 meses observados
python3 scripts/validar_con_estacion.py --salida public/data/validacion_estacion_cordoba.json
python3 scripts/atribucion_enso.py            # ONI, 504 pruebas, composites, escenarios
python3 scripts/digitalizar_captura_cuenca.py  # opcional: requiere opencv-python-headless
python3 scripts/generar_demo_2d.py           # forma real, EVA calibrada y GeoJSON del visor 2D
```

> Nota: `package-lock.json` tiene URLs `resolved` apuntando a un mirror de npm.
> Si `npm ci` falla por conectividad, usar `npm ci --registry=https://registry.npmjs.org`
> o regenerar el lockfile contra el registro oficial.

## Estructura

```
src/components/sections/   Secciones de la portada (mapa, respaldo, caso, encuadre del desafío, monitoreo)
src/components/ControlPanelDemo.tsx  Panel de control V4 (React, simulación explícita)
src/pages/                 Rutas: /, /detective-mode, /monitoreo, /panel, /drone, /paradigmas, /documentacion
src/lib/analisis.ts        Tipos y carga compartida de los productos del análisis
scripts/                   Descarga, tendencias, robustez, estación real, ENSO y demo 2D
public/data/               CSV, JSON, GeoJSON, ONI, inventario y capturas publicados
public/simulacion-2d/      Visor 2D sin tiles externos, forma real trazada, fondo local y datos vectorizados
public/panel/              HTML V3 original aportado por el equipo, con aviso de simulación
public/drone/index.html    Visor 3D del concepto de dron (bundle estático)
frontend/                  Copia legacy de una versión anterior; la app desplegada es la de src/
```

## Enlaces

- [Informe completo (Google Docs)](https://docs.google.com/document/d/11dXRoOLjMCFvs1rITCMewpi3_DfsOlHDD8drtrgiccY/edit?usp=sharing)
- [Guía de demostración](DEMO_GUIDE.md) · [Glosario](GLOSSARY.md) · [Revisión de la entrega 2026](REVISION_2026.md)
- [Sitio publicado](https://actecnical66.github.io/El-Fin-de-los-Ni-os---web/)
