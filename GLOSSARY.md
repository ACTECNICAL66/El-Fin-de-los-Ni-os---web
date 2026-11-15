# Glosario del Desafío: El Fin de los Niños

## Conceptos Clave

### ENSO (El Niño / Niña / Oscilación del Sur)
Fenómeno climático acoplado del océano Pacífico tropical y la atmósfera que puede afectar la precipitación en Córdoba. En la entrega 2026 **sí se analiza y se atribuye** mediante el índice ONI / Niño 3.4 de NOAA CPC: 504 pruebas parciales, composites por fase y una serie mensual observada. La prueba significativa reporta +17,3 mm/mes en El Niño frente a La Niña (IC95 +3,6 a +30,6; p por bloques = 0,028).

### NASA POWER
NASA Prediction Of Worldwide Energy Resources. Proporciona series meteorológicas y de radiación derivadas de observaciones y modelos; no debe describirse simplemente como una medición satelital de alta resolución.

### Sen's Slope (Pendiente de Sen)
Estimador robusto de la tendencia lineal en series de tiempo, calculado como la mediana de todas las pendientes pairwise.

### Mann–Kendall (test)
Prueba estadística no paramétrica para detectar una tendencia monotónica. La aproximación normal usada en el explorador **no corrige la autocorrelación temporal**; las correcciones se publican por separado.

### p-valor
Probabilidad de obtener resultados al menos tan extremos como los observados, bajo la hipótesis nula de no tendencia.
**Significancia:** p < 0.05 aporta evidencia contra la hipótesis nula de ausencia de tendencia bajo los supuestos del test; no prueba causalidad ni que la tendencia sea “real” en cualquier modelo.

### Autocorrelación temporal (r1)
Correlación entre una observación y la del año anterior. Si es positiva, Mann–Kendall subestima la varianza y produce p demasiado pequeños (más falsos positivos). En este proyecto la mediana de r1 sobre la serie sin tendencia es 0,215.

### Preblanqueamiento libre de tendencia (TFPW)
Procedimiento de Yue et al. (2002): quitar la pendiente de Sen, preblanquear el residuo AR(1), reincorporar la tendencia y recalcular Mann–Kendall. Produce el `p_preblanqueado`.

### n efectivo
Tamaño de muestra corregido por persistencia: `n_ef = n · (1 − r1)/(1 + r1)`. También se usa como corrección de varianza `Var*(S) = Var(S) · (1 + r1)/(1 − r1)`.

### Comparaciones múltiples, Bonferroni y BH
Con 42 pruebas a α = 0,05 hay un 88,4 % de probabilidad de al menos un falso positivo. **Bonferroni** exige p < α/42 = 0,00119. **Benjamini–Hochberg** controla la tasa de falsos descubrimientos (FDR) y produce un `q`. El sitio llama *robusta* a una tendencia con p preblanqueado < 0,05 y q ≤ 0,05.

### Punto representativo / celda de grilla
Centro de la caja envolvente de cada polígono esquemático. NASA POWER devuelve la celda de grilla que contiene ese punto: **no es un promedio de toda la cuenca**. Varias consultas comparten valores idénticos, por lo que no son réplicas independientes.

### Categorías del mapa
**Robusta** (sobrevive TFPW + BH), **indicio nominal** (p < 0,05 sin corregir) y **sin evidencia**.

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

Las cifras se recalculan desde `public/data/nasa_power_anual.csv` (descarga documentada del 11/11/2026) y se publican en `public/data/trend_results.csv` y `public/data/robustez_estadistica.json`. Resumen 2026: 23 series con p nominal < 0,05; 8 al ajustar varianza por n efectivo; 10 con TFPW; 5 robustas (todas de temperatura media, 4 señales independientes); 0 tendencias de precipitación robustas. **Esto no contradice la atribución ENSO**: son preguntas distintas. El módulo `atribucion_enso.py` publica 504 pruebas, composites y el contraste mensual significativo. Detalle en `VALIDACION_Y_ESTADISTICA.md`, `/#enso` y `public/data/enso_atribucion.json`.

## Términos Técnicos

- **Tendencia significativa**: Cambio estadísticamente relevante (p < 0.05)
- **Sen slope**: Pendiente de la tendencia (variación anual)
- **τ (tau de Kendall)**: Coeficiente de correlación de rangos
- **n**: Número de observaciones anuales válidas
- **Be an Earth System Trend Detective!**: desafío 2026 que pide responder qué cambió, dónde, cuánto, si es significativo y por qué importa. La sección `#encuadre-desafio` indexa cada respuesta.
- **Panel V4**: recreación en React del panel de control del equipo; simulación local explícita, no telemetría. Ruta `/panel`; original en `/panel/PaneldeControlV3.html`.
- **ONI / Niño 3.4**: media móvil trimestral de anomalías de SST ERSST.v5 en 5°N–5°S, 120°–170°O, publicada por NOAA CPC; umbral ±0,5 °C y mínimo cinco trimestres consecutivos para definir episodio. El archivo del repo cubre 1998–ASO 2026.
- **Compuesto ENSO**: diferencia de anomalías entre años/meses El Niño y La Niña, con IC95 por bootstrap y p por permutación; se reporta junto a q de Benjamini–Hochberg.
- **Escenario condicional 3–6 meses**: banda histórica P10–P90 por fase ONI para planificación. No anticipa la fase futura ni equivale a un pronóstico.
- **Réplica reproducible**: solución publicada ante la idea de «gemelo digital en vivo»: datos abiertos, scripts, modelo, panel V4 y visor 2D con estado explícito de simulación y sin sensores conectados.
- **Inventario de cuencas**: registro del paquete de >20 GB con QGIS, DEM, curvas, tablas EVA, GeoJSON y visores 2D/3D; los archivos pesados quedan fuera del repo por tamaño, no por falta de análisis.
- **EVA (cota–volumen–área)**: tabla que relaciona elevación, volumen acumulado y superficie; el visor `/simulacion-2d/` la interpola a 1 m para estimar llenado. La versión integrada se calibró con la captura real de Cuenca 1: 809,58 hm³ y 6,51 km² a cota 1167 m.

---

*Documento actualizado: 14 de noviembre de 2026*
*Proyecto "El Fin de los Niños" - NASA Space Apps 2026*
