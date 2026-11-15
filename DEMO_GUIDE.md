# Demo Guide: Detective Mode

## Objetivos del Desafío

- **Objetivo 3:** Implementar análisis de tendencias climáticas con significancia estadística
- **Objetivos 3 y 4:** visualizar una serie histórica y probar su tendencia con datos observados.

## Prerrequisitos

1. Node.js 20+ instalado
2. npm o yarn
3. La web sirve una descarga archivada de NASA POWER; internet solo es necesario para abrir GitHub Pages o refrescar los datos con el script.

## Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev
```

Abrir `http://localhost:3000` en el navegador.

## Flujo de Uso del Detective Mode

### 1. Seleccionar Cuenca
- Usar el selector desplegable para elegir una de las 7 cuencas:
  - Norte-Oeste, Norte, Centro, Centro-Sur, Sur, Este, Oeste

### 2. Seleccionar Variable
- Elegir una variable habilitada. Precipitación, temperaturas, viento, humedad del suelo y radiación tienen series NASA POWER archivadas.
- NDVI y GPM aparecen en el catálogo como futuras integraciones y permanecen deshabilitadas.

### 3. Ver el Gráfico
- Se muestran los años completos disponibles entre 2000 y 2025 (26 observaciones por variable/cuenca en la descarga actual).
- El gráfico usa valores anuales archivados, una recta de Sen y una regresión lineal; no genera datos simulados.
- La tarjeta indica el punto representativo y la fecha de descarga.
- El archivo de la entrega contiene 1.092 observaciones (7 cuencas × 6 variables × 26 años) y 42 resultados de tendencia.

### 4. Interpretar los resultados
- **Pendiente de Sen**: cambio robusto estimado en unidades por década
- **Regresión lineal**: cambio lineal estimado en las mismas unidades por década
- **Mann-Kendall p**: Valor p del test (< 0.05 = significativa)
- **IC 95 % de Sen**: intervalo aproximado para la pendiente por década
- **Veredicto**: significativa o no significativa según Mann–Kendall (α = 0,05)

## Interpretación de Resultados

### Pendientes Negativas (cambio hacia abajo)
- **Precipitación**: Disminución anual → riesgo de sequía
- **Temperatura**: Aumento anual → calentamiento

### Pendientes Positivas (cambio hacia arriba)
- **Precipitación**: Aumento anual → riesgo de inundaciones
- **Temperatura**: Disminución anual → enfriamiento

### Significancia Estadística
- **p < 0.05**: evidencia estadística de una tendencia bajo los supuestos del test; no prueba causalidad.
- El explorador calcula un p nominal con aproximación normal, sin corregir autocorrelación. La sección **Respaldo estadístico** publica además el p con varianza por n efectivo, el p con preblanqueamiento libre de tendencia (TFPW), el q de Benjamini–Hochberg para las 42 pruebas y el umbral de Bonferroni.
- El intervalo de Sen del CSV original es aproximado y no ajusta autocorrelación; se muestra con esa salvedad.
- Tras las correcciones sobreviven 5 resultados (todos de temperatura media) y **ninguna tendencia de precipitación**. Eso no contradice la atribución ENSO: son preguntas distintas. La sección `/#enso` publica 504 pruebas ONI / Niño 3.4 y una diferencia mensual significativa de +17,3 mm/mes entre El Niño y La Niña.

## Resultados para presentar

Los resultados nominales se recalculan desde `public/data/nasa_power_anual.csv`; las correcciones se publican en `public/data/robustez_estadistica.json` y el mapa comparativo los consume directamente. El punto guardado es el centro de la caja envolvente del polígono; NASA POWER devuelve la celda de grilla asociada a esa ubicación. No equivale a un promedio espacial de toda la cuenca: por eso el mapa dibuja **puntos** y los polígonos solo como contorno, sin relleno.

Antes de exponer un número, aclarar tres cosas: (1) el p del explorador es nominal, (2) las 42 pruebas y la autocorrelación cambian el veredicto, (3) 7 grupos de series son idénticos por compartir celda y no deben contarse como réplicas.

## Guion sugerido para la presentación (7 minutos, entrega 2026)

1. **Problema (45 s):** por qué detectar cambios de lluvia y temperatura en Córdoba ayuda a formular preguntas sobre disponibilidad de agua.
2. **Pregunta (30 s):** ¿exhibe tendencia una variable en un punto de cuenca entre 2000 y 2025?
3. **Evidencia (90 s):** Detective Mode: observaciones anuales, pendiente de Sen, regresión, IC aproximado, p nominal y, debajo, p corregido y q de BH.
4. **Mapa comparativo (60 s):** elegir variable; mostrar que cada marcador es una celda de grilla, que la flecha indica sube/baja y que el anillo distingue un resultado robusto de un indicio nominal. Recorrer la matriz 7 × 6.
5. **Respaldo estadístico (90 s):** explicar la autocorrelación (r1 mediana 0,215), el 88,4 % de probabilidad de al menos un falso positivo con 42 pruebas, Bonferroni, BH y el embudo de 23 → 5 resultados. Mostrar la sequía 2020–2023 documentada (−26 % promedio) y la estación real del Observatorio Córdoba (288 meses, r = 0,71).
6. **Cuencas y ENSO (75 s):** en `/#cuencas` mostrar el inventario de QGIS/DEM/EVA y abrir el visor 2D; señalar que el polígono y el límite se digitalizaron de la captura real (809,58 hm³ / 6,51 km² a cota 1167 m) y que sólo la georreferenciación es aproximada sin GPKG/XLSX. En `/#enso` mostrar ONI de NOAA CPC, las 504 pruebas, el +17,3 mm/mes con IC95 y p = 0,028, y las bandas condicionales 3–6 meses (no pronóstico).
7. **Caso concreto y encuadre (60 s):** Cuenca Sur · temperatura media (+0,41 °C/década, robusta) y el contraejemplo de precipitación que deja de ser significativo al corregir. Recorrer las cinco tarjetas del desafío y la lista de alcance verificado: cuencas, ENSO, escenarios y réplica reproducible.
8. **Electrónica, panel y futuro (75 s):** prototipo ESP32, abrir `/panel` y mover la compuerta o simular el error `-999.0` para mostrar que es una réplica reproducible sin hardware conectado; dron AG-01 como concepto de diseño que hoy no recoge datos; NDVI/GPM y ampliación de la red local como próximos pasos.
9. **Cierre (30 s):** series, ONI, estación, scripts, panel y visor 2D están publicados; el siguiente paso es ampliar y calibrar la red de campo.

## Arquitectura Técnica

### Frontend estático (GitHub Pages)
- **src/components/sections/DetectiveMode.tsx**: consulta, estadística, gráfico y p corregido.
- **src/components/sections/ComparativeMapSection.tsx**: mapa SVG de puntos, leyenda y matriz cuenca × variable.
- **src/components/sections/StatisticalRigorSection.tsx**: correcciones, validación y tabla de las 42 pruebas.
- **src/components/sections/CaseStudySection.tsx**: caso robusto + contraejemplo.
- **src/components/sections/Correccion2026Section.tsx**: cuencas casi completas, visor 2D, atribución ENSO, escenarios y réplica reproducible.
- **src/components/sections/ChallengeFitSection.tsx**: las cinco preguntas del desafío 2026 y alcance verificado.
- **src/components/ControlPanelDemo.tsx** y **src/pages/PanelPage.tsx**: panel V4 integrado, con simulación y error -999.0.
- **src/components/sections/MonitoringTeaserSection.tsx** y **src/pages/Monitoreo.tsx**: electrónica y aplicación de monitoreo.
- **src/components/sections/FutureTechSection.tsx** y **src/pages/DronePage.tsx**: dron como aplicación futura.
- **src/lib/analisis.ts**: carga compartida de series, tendencias y robustez.
- **public/data/cuencas.geojson**: polígonos esquemáticos usados para elegir puntos representativos.
- **public/data/variables.json**: variables habilitadas y pendientes de integración.
- **public/data/nasa_power_anual.csv**: observaciones anuales y metadatos de fuente, parámetro, coordenadas y fecha de descarga.
- **public/data/robustez_estadistica.{json,csv}**: productos corregidos que consume la web.

### Análisis reproducible offline
Descarga primero observaciones anuales de NASA POWER para las cuencas del GeoJSON; después calcula pendiente, IC 95 % aproximado y Mann–Kendall:
```bash
python scripts/descargar_nasa_power.py --geojson public/data/cuencas.geojson --output data/nasa_power_anual.csv --public-output public/data/nasa_power_anual.csv
python scripts/analisis_tendencias.py --input data/nasa_power_anual.csv --output public/data/trend_results.csv
python scripts/robustez_estadistica.py
python scripts/preparar_estacion_cordoba.py
python scripts/validar_con_estacion.py --salida public/data/validacion_estacion_cordoba.json
python scripts/atribucion_enso.py
python scripts/digitalizar_captura_cuenca.py  # opcional, requiere OpenCV
python scripts/generar_demo_2d.py
```
El primer script descarga seis variables habilitadas para las siete cuencas y guarda parámetro, coordenadas, fuente y fecha de descarga. El segundo calcula regresión lineal, pendiente de Sen, IC 95 % aproximado y Mann–Kendall nominal. El tercero genera las correcciones por autocorrelación y pruebas múltiples. El cuarto transcribe la serie observada del Observatorio Córdoba; el quinto la contrasta con NASA POWER; el sexto ejecuta las 504 pruebas ENSO y produce composites/escenarios; el séptimo digitaliza la forma real del visor 2D desde la captura y el octavo reconstruye `data.js`, la EVA y los GeoJSON. NDVI y GPM IMERG permanecen en catálogo como futuras integraciones; no se presentan como datos ya analizados.

La fuente es la [API mensual de punto NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/). Para cada polígono se consulta el centro de su caja envolvente. Se conservan años con los 12 meses disponibles: la precipitación mensual (mm/día) se multiplica por los días del mes y se suma para obtener mm/año; las demás variables mensuales se promedian ponderando por días. Parámetros: `PRECTOTCORR`, `T2M`, `T2M_MAX`, `WS2M`, `GWETROOT` y `ALLSKY_SFC_SW_DWN`.

## Recursos Adicionales

- **Python Script**: `scripts/analisis_tendencias.py` - Código fuente del análisis estadístico
- **Glosario**: `GLOSSARY.md` - Definiciones de términos técnicos
- **Datos**: `public/data/*` - Datos del proyecto

---

*Documento preparado para la presentación del Desafío NASA Space Apps 2026*
*El Fin de los Niños - Córdoba, Argentina*
