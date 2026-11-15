# Respaldo estadístico y validación — El Fin de los Niños (2026)

Documento de trabajo que acompaña a la web. Todos los números se recalculan desde
`public/data/nasa_power_anual.csv` (NASA POWER Monthly API, descarga 2026-11-11,
1092 observaciones = 7 puntos × 6 variables × 26 años, 2000–2025).

```bash
python3 scripts/robustez_estadistica.py   # genera public/data/robustez_estadistica.{json,csv}
python3 scripts/analisis_tendencias.py --input data/nasa_power_anual.csv --output public/data/trend_results.csv
python3 scripts/preparar_estacion_cordoba.py
python3 scripts/validar_con_estacion.py --salida public/data/validacion_estacion_cordoba.json
python3 scripts/atribucion_enso.py      # 504 pruebas, composites y escenarios ENSO
```

## 1. Qué se publicó originalmente

`public/data/trend_results.csv` contiene 42 resultados (7 cuencas × 6 variables)
con pendiente de Sen, regresión lineal, IC 95 % aproximado y un p de
Mann–Kendall con aproximación normal. Ese p **no corrige autocorrelación** y se
interpretó de a uno por vez con α = 0,05. Con ese criterio, 23 de las 42 series
aparecen como "significativas".

## 2. Autocorrelación temporal

Una serie anual climática suele tener "memoria": un año húmedo tiende a seguir a
otro. Mann–Kendall supone observaciones independientes; si hay autocorrelación
positiva, la varianza del estadístico S se subestima, los |z| se inflan y los
p salen **demasiado pequeños** (más falsos positivos).

- Autocorrelación de retardo 1 calculada sobre la serie sin tendencia: mediana
  **0,215**, máximo **0,467**; 30 de las 42 series tienen r1 > 0,05.
- Corrección 1 — **varianza por n efectivo**: `Var*(S) = Var(S)·(1+r1)/(1−r1)`
  con `n_ef = n·(1−r1)/(1+r1)` (aproximación AR(1) de primer orden).
  Con este ajuste bajan de 23 a **8** las series con p < 0,05.
- Corrección 2 — **preblanqueamiento libre de tendencia (TFPW)**: se quita la
  pendiente de Sen, se preblanquea el residuo AR(1), se reincorpora la tendencia
  y se recalcula Mann–Kendall (Yue, Pilon, Phinney & Cavadias, *Hydrological
  Processes* 16, 2002). Quedan **10** series con p < 0,05.
- Si r1 ≤ 0 no se aplica corrección: la autocorrelación negativa no infla los
  falsos positivos bajo este criterio.

Ambas correcciones son aproximaciones con n = 26; se publican juntas para que
se vea la sensibilidad del resultado al método, no para elegir la "mejor".

## 3. Las 42 pruebas (comparaciones múltiples)

Con 42 tests independientes a α = 0,05, la probabilidad de al menos un falso
positivo es `1 − (1 − 0,05)^42 = 0,884` (**88,4 %**). Por eso:

- **Bonferroni**: umbral `α/42 = 0,00119`. Ninguna serie lo supera.
- **Benjamini–Hochberg (FDR 5 %)**: 5 resultados sobreviven sobre el p nominal.
- **Criterio estricto del sitio** (`p_preblanqueado < 0,05` **y**
  `q_BH(preblanqueado) ≤ 0,05`): **5 resultados robustos**, todos de
  temperatura media. Al descontar series idénticas quedan **4 señales
  independientes**.

> Advertencia adicional: las 42 pruebas tampoco son espacialmente independientes.
> Hay **7 grupos de series con valores idénticos** (por ejemplo CC y CE en cinco
> variables), compatibles con consultas que caen en la misma celda de grilla del
> producto consultado. Deben tratarse como una sola señal, no como réplicas.

Consecuencia directa para la comunicación del proyecto: **ninguna tendencia de
precipitación sobrevive las correcciones**. Las 4 señales nominales de lluvia
(CN-O, CN, CC, CE) pasan a ser "indicios que requieren más datos", no hallazgos
confirmados.

## 4. Validación con otra fuente

### 4.1 Contraste con un evento documentado (realizado)

El informe del proyecto documenta la sequía 2020–2023 (La Quebrada al 15 % y
San Roque al 30 % de capacidad en 2023) apoyándose en bibliografía institucional.
Además se verificó una fuente externa contemporánea e independiente: [La Voz del
Interior, 1 de febrero de 2023](https://www.lavoz.com.ar/ciudadanos/tras-las-lluvias-los-diques-de-cordoba-subieron-pero-siguen-lejos-del-nivel-esperable-para-esta-epoca/)
informa tres años consecutivos (2020–2022) con precipitaciones por debajo de la
media y embalses lejos de sus vertederos, con mediciones de la APRHI. El INA
mantiene a su vez una [metodología SDI para sequías hidrológicas en la cuenca
alta del río Suquía](https://www.ina.gov.ar/cirsa/pdf/Actualizacion_Evaluacion_sequias_hidrologicas_tributarios_dique_San_Roque.pdf),
útil para un futuro contraste con caudales.

**Usamos esas fuentes para constatar el evento seco**, no para estimar la fase
ENSO. La nota periodística menciona La Niña; la atribución cuantitativa se hace
por separado en §4.4 con el índice oficial ONI / Niño 3.4. Comparamos el evento
con nuestra serie:

| Resultado | Valor |
|---|---|
| Puntos con anomalía negativa en 2020–2023 vs media 2000–2019 | 7 de 7 |
| Anomalía promedio | **−26,0 %** |
| Años (punto-año) por debajo del percentil 25 de la referencia | 21 de 28 |

La rejilla satelital reproduce cualitativamente la sequía documentada. **Esto es
una validación de consistencia de un evento, no una validación instrumento a
instrumento ni una prueba de la tendencia de largo plazo.** Se publica con esa
salvedad en la web.

### 4.2 Consistencia interna (realizada)

Precipitación anual y humedad de la zona radicular (`GWETROOT`) correlacionan
entre r = 0,77 y r = 0,93 según el punto, y el signo de la tendencia coincide en
los 7 puntos. Es una comprobación de coherencia física **dentro del mismo
producto modelado**, por lo que no reemplaza a una fuente independiente.

### 4.3 Estación observada del Observatorio Córdoba (realizada)

La plantilla vacía se eliminó: se transcribieron 288 meses reales de
precipitación (2000–2023) del conjunto [Zenodo 15013403](https://zenodo.org/records/15013403)
(DOI 10.5281/zenodo.15013403), reconstruido desde GHCN-M y Anales de la OMA.
`scripts/preparar_estacion_cordoba.py` regenera
`public/data/estacion_cordoba_observatorio_mensual.csv` y
`public/data/validacion_local_cordoba.csv`; `validar_con_estacion.py` contrasta
la celda CC de NASA POWER con la serie local:

```bash
python3 scripts/preparar_estacion_cordoba.py
python3 scripts/validar_con_estacion.py --salida public/data/validacion_estacion_cordoba.json
```

| Métrica | Resultado |
|---|---|
| Años en común | 24 (2000–2023) |
| Pearson / Spearman | **0,7051 / 0,7606** |
| Sesgo local − NASA | −34,05 mm/año |
| MAE / RMSE | 104,88 / 127,87 mm |
| Pendiente Sen local / NASA | −59,56 / −125,13 mm/década (mismo signo) |
| Mann–Kendall local | p = 0,1970 |

Es un contraste punto–grilla con una estación: respalda la dirección de la
señal, no autoriza a dimensionar obras ni reemplaza una calibración instrumental
en campo.

### 4.4 Atribución ENSO con ONI / Niño 3.4 (realizada)

`scripts/atribucion_enso.py` usa únicamente biblioteca estándar. Lee
`public/data/oni_ascii_cpc_1998_2026.txt` (subconjunto textual del
[ONI oficial de NOAA CPC](https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt)),
las 42 series anuales de NASA POWER y la serie mensual de la estación. Evalúa
cuatro ventanas ONI (`pico_austral_oct_abr`, `anual_calendario`, `djf`,
`son_previo`), tres retardos (−1, 0, +1), correlación parcial tras detrending
lineal, p de t de Student, corrección de Benjamini–Hochberg global y para la
ventana principal preespecificada, composites El Niño − La Niña e intervalos por
bootstrap/permutación con 9999 réplicas (semilla 20261114). Los composites
promedian celdas únicas para no contar coordenadas duplicadas como réplicas.

| Producto / resultado | Valor |
|---|---|
| Pruebas parciales | **504** (4 ventanas × 3 retardos × 42 series) |
| Resultados con q global < 0,05 | 0 |
| Resultados con q < 0,05 en ventana principal | 2 (CC / CE, viento) |
| Coeficiente medio precipitación, ventana principal | +42,94 mm/°C; r parcial ≈ 0,293 |
| Compuesto anual precipitación El Niño − La Niña | **+68,7 mm/año**, IC95 [−47,5, +183,2], p = 0,273, q = 0,273 |
| Compuesto anual temperatura | −0,505 °C, p = 0,021, q = 0,128 |
| Compuesto anual humedad del suelo | +0,0271, IC95 [+0,0016, +0,0514], p = 0,059, q = 0,178 |
| **Prueba mensual observada, El Niño > La Niña** | **+17,34 mm/mes**, IC95 de bloques [+3,58, +30,56], p por permutación de bloques = **0,02768** |

La significancia afirmativa se sostiene en la prueba direccional preespecificada
sobre 288 meses observados (72 El Niño, 82 La Niña). Los composites anuales se
publican como magnitud, dirección e incertidumbre: describen la señal, pero no
todos sobreviven a la corrección por comparaciones múltiples. La atribución es
estadística, no una demostración de causalidad mecanicista ni un pronóstico.

`public/data/escenarios_enso_3_6_meses.json` publica bandas condicionales
históricas por fase ONI (medianas y P10–P90) para 3 y 6 meses. Las tres fases
aparecen como alternativas de planificación; el último ONI ASO 2026 (+2,46) se
reporta como observación preliminar, no se proyecta su persistencia. Por eso los
escenarios **no son predicciones operativas**. El estado de la réplica se declara
en `enso_atribucion.json.estado_operativo`: `reproducible_sin_telemetria`, sin
sensores activos ni control en vivo.

## 5. Límites que se mantienen visibles en la web

- Cada cuenca se aproxima con **un punto** (centro de la caja envolvente del
  polígono esquemático); NASA POWER devuelve la celda de grilla asociada. No es
  un promedio espacial de la cuenca.
- Los polígonos del GeoJSON son rectángulos de referencia; las cuencas reales
  del informe se delimitaron en QGIS con DEM, y no coinciden con esos rectángulos.
- NASA POWER combina observaciones y modelos (reanálisis); no es un pluviómetro.
- 26 años es una serie corta para atribución climática.
- Los IC 95 % de Sen del CSV son aproximados y no corrigen autocorrelación.
- **Sí se atribuye variabilidad a ENSO**: 504 pruebas ONI / Niño 3.4, composites
  y una prueba mensual significativa. Las tendencias de largo plazo y las
  diferencias entre fases se interpretan por separado, con sus intervalos, q y
  advertencias (§4.4).

## 6. Referencias metodológicas

- Mann, H. B. (1945). *Nonparametric tests against trend*. Econometrica 13.
- Kendall, M. G. (1975). *Rank Correlation Methods*. Griffin.
- Sen, P. K. (1968). *Estimates of the regression coefficient based on Kendall's tau*. JASA 63.
- Hamed, K. H. & Rao, A. R. (1998). *A modified Mann-Kendall trend test for autocorrelated data*. Journal of Hydrology 204.
- Yue, S., Pilon, P., Phinney, B. & Cavadias, G. (2002). *The influence of autocorrelation on the ability to detect trend in hydrological series*. Hydrological Processes 16.
- Benjamini, Y. & Hochberg, Y. (1995). *Controlling the false discovery rate*. JRSS B 57.
- NASA POWER (2026). *Data Access Viewer / Monthly API documentation*, NASA Langley Research Center.
- NOAA CPC (2026). *Oceanic Niño Index (ONI), ERSST.v5, Niño 3.4* — `https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt`; definición en `ONI_v5.php` y `ONI_change.html`.
- Zenodo (2025). *Monthly precipitation series for Argentine stations*, DOI `10.5281/zenodo.15013403`; estación Córdoba Observatorio, 1873–2023.
