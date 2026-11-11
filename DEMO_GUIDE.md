# Demo Guide: Detective Mode

## Objetivos del Desafío

- **Objetivo 3:** Implementar análisis de tendencias climáticas con significancia estadística
- **Objetivos 3 y 4:** visualizar una serie histórica y probar su tendencia con datos observados.

## Prerrequisitos

1. Node.js 20+ instalado
2. npm o yarn
3. Conexión a internet para consultar NASA POWER; la interfaz es estática y no requiere MySQL.

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
- Elegir una variable habilitada. Precipitación, temperaturas, viento, humedad del suelo y radiación consultan NASA POWER.
- NDVI y GPM aparecen en el catálogo como futuras integraciones y permanecen deshabilitadas.

### 3. Ver el Gráfico
- Se muestran únicamente años con 12 meses válidos entre 2000 y 2025.
- El gráfico usa los valores anuales obtenidos en esa consulta, no una curva simulada.

### 4. Anexo de la Veredicto
- **Sen Slope**: Pendiente anual en unidades por década
- **Mann-Kendall p**: Valor p del test (< 0.05 = significativa)
- **Verdict**: ✓ Significativa / ✗ No significativa

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

## Resultados para presentar

No uses los p-valores de los CSV de ejemplo anteriores como hallazgos. Ejecuta la consulta para la cuenca y variable que vas a presentar; guarda la respuesta fuente y anota fecha de consulta, parámetro NASA POWER, coordenadas y período para poder reproducirla.

## Arquitectura Técnica

### Frontend estático (GitHub Pages)
- **src/components/sections/DetectiveMode.tsx**: consulta, estadística y gráfico.
- **src/pages/DetectiveModePage.tsx**: ruta y límite de error visible.
- **public/data/cuencas.geojson**: polígonos usados para elegir puntos representativos.
- **public/data/variables.json**: variables habilitadas y pendientes de integración.

### Análisis reproducible offline
Descarga primero observaciones anuales de NASA POWER para las cuencas del GeoJSON; después calcula pendiente, IC 95 % aproximado y Mann–Kendall:
```bash
python scripts/descargar_nasa_power.py --geojson public/data/cuencas.geojson --output data/nasa_power_anual.csv
python scripts/analisis_tendencias.py --input data/nasa_power_anual.csv --output public/data/trend_results.csv
```
El CSV registra parámetro, coordenadas y fuente. El script estadístico requiere una observación anual por fila en columnas `cuenca,codigo,variable,unidad,anio,valor`; no fabrica resultados si falta el archivo de datos.

## Recursos Adicionales

- **Python Script**: `scripts/analisis_tendencias.py` - Código fuente del análisis estadístico
- **Glosario**: `GLOSSARY.md` - Definiciones de términos técnicos
- **Datos**: `public/data/*` - Datos del proyecto

---

*Documento preparado para la presentación del Desafío NASA Space Apps 2026*
*El Fin de los Niños - Córdoba, Argentina*
