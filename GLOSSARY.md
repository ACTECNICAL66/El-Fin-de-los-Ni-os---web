# Glosario del Desafío: El Fin de los Niños

## Conceptos Clave

### ENSO (El Niño / Niña / Oscilación del Sur)
Fenómeno climático acoplado del océano Pacífico tropical y la atmósfera que puede afectar la precipitación en Córdoba.

### NASA POWER
NASA Prediction Of Worldwide Energy Resources. Proporciona series meteorológicas y de radiación derivadas de observaciones y modelos; no debe describirse simplemente como una medición satelital de alta resolución.

### Sen's Slope (Pendiente de Sen)
Estimador robusto de la tendencia lineal en series de tiempo, calculado como la mediana de todas las pendientes pairwise.

### Mann-Kendall Tes
Prueba estadística no paramétrica para detectar una tendencia monotónica. La aproximación usada en este prototipo no corrige la autocorrelación temporal.

### p-valor
Probabilidad de obtener resultados al menos tan extremos como los observados, bajo la hipótesis nula de no tendencia.
**Significancia:** p < 0.05 aporta evidencia contra la hipótesis nula de ausencia de tendencia bajo los supuestos del test; no prueba causalidad ni que la tendencia sea “real” en cualquier modelo.

## Variables Climáticas

| Variable | Unidad | Descripción |
|----------|--------|-------------|
| Precipitación | mm/año | Total anual estimado desde medias mensuales de NASA POWER |
| Temperatura | °C | Media anual de valores mensuales |
| Temperatura máxima | °C | Media anual de máximos mensuales |
| Viento | m/s | Media anual de velocidad a 2 m |
| Humedad del suelo | fracción | Humedad modelada en zona de raíces |
| Radiación solar | kWh/m²/día | Media anual diaria en superficie |
| NDVI / GPM IMERG | — | En catálogo; integración pendiente |

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

## Resultados

No se incluyen cifras aquí porque los valores de versiones anteriores del CSV se generaron con series sintéticas. Los resultados deben obtenerse de una consulta NASA POWER o de un CSV anual de observaciones documentadas antes de presentarse como hallazgos.

## Términos Técnicos

- **Tendencia significativa**: Cambio estadísticamente relevante (p < 0.05)
- **Sen slope**: Pendiente de la tendencia (variación anual)
- **τ (tau de Kendall)**: Coeficiente de correlación de rangos
- **n**: Número de observaciones anuales válidas

---

*Documento actualizado: Octubre 2026*
*Proyecto "El Fin de los Niños" - NASA Space Apps 2026*
