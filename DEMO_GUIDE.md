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
- La implementación web usa aproximación normal y no corrige autocorrelación temporal.
- El intervalo de Sen es aproximado y tampoco ajusta autocorrelación.

## Resultados para presentar

Los resultados publicados se recalculan desde `public/data/nasa_power_anual.csv`. El punto guardado es el centro de la caja envolvente del polígono; NASA POWER devuelve la celda de grilla asociada a esa ubicación. No equivale a un promedio espacial de toda la cuenca. Antes de exponerlos, explica que el test usa una aproximación normal sin corrección de autocorrelación.

## Guion sugerido para la presentación (5 minutos)

1. **Problema (45 s):** explicar por qué detectar cambios de lluvia y temperatura en las cuencas de Córdoba ayuda a formular preguntas sobre disponibilidad de agua y adaptación.
2. **Pregunta (30 s):** mostrar una cuenca y preguntar si la lluvia o la temperatura anual exhiben una tendencia entre 2000 y 2025.
3. **Evidencia (90 s):** seleccionar la cuenca y la variable; recorrer observaciones anuales, pendiente de Sen, regresión lineal, intervalo aproximado y Mann–Kendall. Leer el valor p junto con la magnitud y el intervalo, sin confundir significancia con causalidad.
4. **Sistema Tierra (60 s):** relacionar lluvia y temperatura con el ciclo del agua y el balance de energía; presentar las relaciones como contexto científico, no como causas demostradas por esta serie.
5. **Límites y siguiente paso (45 s):** señalar que cada polígono se aproxima con un punto de grilla, que el test no corrige autocorrelación y que NDVI/GPM siguen pendientes de integración.
6. **Cierre (30 s):** proponer validar el patrón con mediciones locales y luego integrar datos espaciales para evaluar si el hallazgo se sostiene a escala de toda la cuenca.

## Arquitectura Técnica

### Frontend estático (GitHub Pages)
- **src/components/sections/DetectiveMode.tsx**: consulta, estadística y gráfico.
- **src/pages/DetectiveModePage.tsx**: ruta y límite de error visible.
- **public/data/cuencas.geojson**: polígonos usados para elegir puntos representativos.
- **public/data/variables.json**: variables habilitadas y pendientes de integración.
- **public/data/nasa_power_anual.csv**: observaciones anuales y metadatos de fuente, parámetro, coordenadas y fecha de descarga.

### Análisis reproducible offline
Descarga primero observaciones anuales de NASA POWER para las cuencas del GeoJSON; después calcula pendiente, IC 95 % aproximado y Mann–Kendall:
```bash
python scripts/descargar_nasa_power.py --geojson public/data/cuencas.geojson --output data/nasa_power_anual.csv --public-output public/data/nasa_power_anual.csv
python scripts/analisis_tendencias.py --input data/nasa_power_anual.csv --output public/data/trend_results.csv
```
El script descarga seis variables habilitadas para las siete cuencas y guarda parámetro, coordenadas, fuente y fecha de descarga. Luego calcula regresión lineal, pendiente de Sen, IC 95 % aproximado y Mann–Kendall. NDVI y GPM IMERG permanecen en catálogo como futuras integraciones; no se presentan como datos ya analizados.

La fuente es la [API mensual de punto NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/). Para cada polígono se consulta el centro de su caja envolvente. Se conservan años con los 12 meses disponibles: la precipitación mensual (mm/día) se multiplica por los días del mes y se suma para obtener mm/año; las demás variables mensuales se promedian ponderando por días. Parámetros: `PRECTOTCORR`, `T2M`, `T2M_MAX`, `WS2M`, `GWETROOT` y `ALLSKY_SFC_SW_DWN`.

## Recursos Adicionales

- **Python Script**: `scripts/analisis_tendencias.py` - Código fuente del análisis estadístico
- **Glosario**: `GLOSSARY.md` - Definiciones de términos técnicos
- **Datos**: `public/data/*` - Datos del proyecto

---

*Documento preparado para la presentación del Desafío NASA Space Apps 2026*
*El Fin de los Niños - Córdoba, Argentina*
