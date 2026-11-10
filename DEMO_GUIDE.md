# Demo Guide: Detective Mode

## Objetivos del Desafío

- **Objetivo 3:** Implementar análisis de tendencias climáticas con significancia estadística
- **Objetivo 4:** Visualizar propuestas de adaptación al cambio climático

## Prerrequisitos

1. Node.js 20+ instalado
2. npm o yarn
3. Conector MySQL/mariaDB (opcional, los datos se cargan desde archivos JSON)

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
- Elegir entre:
  - **Precipitación** (mm)
  - **Temperatura** (°C)

### 3. Ver el Gráfico
- Se muestra el gráfico de tendencia 2000-2025
- La línea se colorea según la dirección de la pendiente

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
- **p < 0.05**: La tendencia es real (no debido al azar)
- **p ≥ 0.05**: La tendencia no es estadísticamente confiable

## Resultados Clave para la Presentación

| Cuenca | Variable | Trend | p-valor | Interpretación |
|--------|----------|-------|---------|----------------|
| Norte-Oeste | Precipitación | ↓ -112.08 mm/decada | 0.0082 | ✓ Seco y significativo |
| Centro | Precipitación | ↓ -80.83 mm/decada | 0.0707 | ↓ Casi significativo |
| Norte-Oeste | Temperatura | ↑ +0.35 °C/decada | 0.0015 | ✓ Calentamiento significativo |
| Centro | Temperatura | ↑ +0.35 °C/decada | 0.0021 | ✓ Calentamiento significativo |

## Arquitectura Técnica

### Backend (Hono + TypeScript)
- **api/boot.ts**: Punto de entrada del servidor
- **api/routes/**: API REST para datos
- **db/schema.ts**: Esquema Drizzle ORM (MySQL)

### Frontend (React + Vite)
- **src/components/DetectiveMode.tsx**: Componente principal
- **src/pages/DetectiveModePage.tsx**: Página de la función
- **public/data/cuencas.geojson**: Datos geoespaciales
- **public/data/trend_results.csv**: Resultados de tendencias

### Estructura de la API
```
/api/cuencas          -> Lista de cuencas
/api/cuencas/:id       -> Datos de una cuenca
/api/variables         -> Lista de variables
/api/trends?cuenca=... -> Tendencias filtradas
```

## Recursos Adicionales

- **Python Script**: `scripts/analisis_tendencias.py` - Código fuente del análisis estadístico
- **Glosario**: `GLOSSARY.md` - Definiciones de términos técnicos
- **Datos**: `public/data/*` - Datos del proyecto

---

*Documento preparado para la presentación del Desafío NASA Space Apps 2026*  
*El Fin de los Niños - Córdoba, Argentina*