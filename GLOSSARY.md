# Glosario del Desafío: El Fin de los Niños

## Conceptos Clave

### ENSO (El Niño / Niña / Oscilación del Sur)
Phenomeno climático que aumenta la temperatura de la superficie del océano Pacífico tropical, afectando el régimen de precipitaciones en Córdoba, Argentina.

### NASA POWER
**Powering Agriculture: Research and Applications** - Plataforma de la NASA que proporciona datos climatológicos satellitales de alta resolución.

### Sen's Slope (Pendiente de Sen)
Estimador robusto de la tendencia lineal en series de tiempo, calculado como la mediana de todas las pendientes pairwise.

### Mann-Kendall Test
Prueba estadística no paramétrica para detectar tendencias en series de tiempo. Retorna un coeficiente τ y un p-valor.

### p-valor
Probabilidad de obtener resultados al menos tan extremos como los observados, bajo la hipótesis nula de no tendencia.  
**Significancia:** p < 0.05 indica evidencia de tendencia real.

## Variables Climáticas

| Variable | Unidad | Descripción |
|----------|--------|-------------|
| Precipitación | mm | Acumulación mensual de agua |
| Temperatura | °C | Temperatura media mensual |

## Cuencas Analizadas

| Código | Nombre | Área (km²) |
|--------|--------|------------|
| CN-O | Norte-Oeste | 2850.5 |
| CN | Norte | 3120.3 |
| CC | Centro | 4200.7 |
| CC-S | Centro-Sur | 3950.2 |
| CS | Sur | 3400.1 |
| CE | Este | 2980.4 |
| CO | Oeste | 2670.8 |

## Resultados Clave (2000-2025)

| Cuenca | Variable | Sen Slope | p-valor | Significancia |
|--------|----------|-----------|---------|---------------|
| Norte-Oeste | Precipitación | -112.08 mm/decada | 0.0082 | ✓ Significativa |
| Centro | Precipitación | -80.83 mm/decada | 0.0707 | ✗ No significativa |
| Norte-Oeste | Temperatura | +0.35 °C/decada | 0.0015 | ✓ Significativa |
| Centro | Temperatura | +0.35 °C/decada | 0.0021 | ✓ Significativa |

## Términos Técnicos

- **Tendencia significativa**: Cambio estadísticamente relevante (p < 0.05)
- **Sen slope**: Pendiente de la tendencia (variación anual)
- **τ (tau de Kendall)**: Coeficiente de correlación de rangos
- **Nk (Nk)**: Número de puntos de datos

---

*Documento actualizado: Octubre 2026*  
*Proyecto "El Fin de los Niños" - NASA Space Apps 2026*