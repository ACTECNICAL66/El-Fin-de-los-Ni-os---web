# Revisión de la entrega 2026 — «El Fin de los Niños»

**Fecha:** 14 de noviembre de 2026 · **Rama:** `arena/42cadc12-el-fin-de-los-ni-os-web`
**Estado:** cambios en el working tree, **sin commit, sin push, sin deploy**. Este
documento es el «muéstrame todo» que se pidió antes de subir nada.

Material revisado: el repositorio completo, los 15 bloques del informe de Google
Docs (incluidos ahora §1–§4.5, que faltaban en la primera lectura), los CSV/JSON
publicados, las capturas de cuencas y del visor 2D calculado, y la web en vivo en
el puerto 3000.

---

## 1. Resumen ejecutivo

La web ahora responde punto por punto a la devolución que bajaba el puntaje:
mapa comparativo de **puntos** (no cuencas coloreadas), respaldo estadístico con
autocorrelación y 42 pruebas, validación con otra fuente, un caso concreto con
límites y utilidad para un gestor, el dron como diseño futuro, electrónica y
monitoreo, y unificación de la presentación 2026.

La identidad visual **sigue siendo coherente**: mismos fondos azul noche, tarjetas
de vidrio, degradados agua/verde, tipografías y barra de progreso. Las excepciones
—el visor del dron, de estilo «plano técnico» claro, y tres imágenes de aspecto
genérico— quedaron encuadradas con una cabecera oscura, una franja de aviso y
leyendas de contenido ilustrativo.

En una segunda ronda (pedida por el usuario) se agregó además una **sección de
encuadre explícito del desafío 2026** y una **versión V4 del panel de control**
integrada al diseño del sitio, a partir del `PaneldeControlV3.html` aportado.
Detalle en §7.

En una **tercera ronda de corrección** se incorporaron los materiales de cuencas
aportados, ONI / Niño 3.4 de NOAA CPC, una estación mensual real, 504 pruebas de
atribución ENSO, escenarios condicionales 3–6 meses y el visor de llenado 2D
integrado sin CDN. Esa ronda reemplaza tres afirmaciones que ya no corresponden:
el análisis de cuencas **está casi completo**, **sí** hay atribución El Niño /
La Niña y la réplica reproducible resuelve la observación sobre «gemelo digital»
y telemetría. Detalle en §8.

En una **cuarta ronda**, a partir de una nueva captura del visor calculado, se
corrigió la geometría del 2D: se eliminaron las elipses sintéticas, se
digitalizó el polígono azul y el límite naranja reales, se calibró la EVA con
809,58 hm³ / 6,51 km² a cota 1167 m y se quitaron los tiles externos que
mostraban «API KEY REQUIRED» y el error de conexión de Leaflet. Detalle en §9.

El informe es ambicioso y está bien estructurado, pero mezcla **lo ya medido** con
**lo diseñado**, y tiene inconsistencias de año, unidades, nombres de cuenca y
productos satelitales que conviene corregir antes de la entrega. Detalle en §4.

Además se encontró y eliminó una **clave de API de terceros escrita en el código**.
Como estaba en el commit base, debe revocarse/rotarse en el proveedor; quitarla del
archivo no la borra del historial de Git.

---

## 2. Qué se cambió (trazabilidad)

### 2.1 Los cinco puntos de la devolución

| Requerimiento | Implementación | Archivos |
|---|---|---|
| Mapa comparativo con puntos representativos, dirección y significancia, sin promedios de área | SVG con contornos **sin relleno**, marcadores por celda de grilla, flechas ↑/↓, anillo por categoría, panel de detalle, matriz 7 × 6 y descargas | `src/components/sections/ComparativeMapSection.tsx`, `public/data/robustez_estadistica.json` |
| Autocorrelación + 42 pruebas + validación con otra fuente | r1 bruto/sin tendencia, n efectivo, TFPW, Bonferroni, Benjamini–Hochberg, embudo 23 → 5, tabla de 42 filas, contraste con sequía documentada y estación real de 288 meses | `scripts/robustez_estadistica.py`, `scripts/preparar_estacion_cordoba.py`, `scripts/validar_con_estacion.py`, `VALIDACION_Y_ESTADISTICA.md` |
| Caso concreto: cuenca + variable, resultado, límites y utilidad; atribución ENSO analizada por separado | **CS / temperatura media**: +0,41 °C/década, p y q corregidos < 0,05, IC, cambio total ~1,02 °C; contraejemplo CN-O/precipitación que deja de ser significativo; relevancia para demanda/evaporación y enlace a `/#enso` | `src/components/sections/CaseStudySection.tsx`, `src/components/sections/Correccion2026Section.tsx` |
| Alineación con el objetivo del desafío | Sección con las cinco preguntas «qué / dónde / cuánto / significancia / por qué importa», enlaces a la evidencia, ODS 6-13-15 y lista de alcance verificado | `src/components/sections/ChallengeFitSection.tsx`, `HeroSection.tsx`, `Footer.tsx`, `CTASection.tsx` |
| Panel de control mejorado | V4 en React/Tailwind/lucide, simulación declarada, compuerta, ejes solares, seis lecturas, TDS/turbidez, error `-999.0`, pausa/reinicio; V3 original conservado con aviso | `src/components/ControlPanelDemo.tsx`, `src/pages/PanelPage.tsx`, `public/panel/PaneldeControlV3.html` |
| Dron como aplicación futura tras el análisis | `FutureTechSection` después del caso de estudio; etiqueta «Dron (futuro)»; `DronePage` con estado, hoja de ruta y aviso; textos del bundle 3D pasados a condicional y franja «no recoge datos» | `src/components/sections/FutureTechSection.tsx`, `src/pages/DronePage.tsx`, `public/drone/index.html`, `Navigation.tsx` |
| Unificar 2026 | Título/descripción, hero, about, resultados, área, CTA, footer, login, legacy `frontend/`, chat y etiquetas; se conservan `2000–2025` (periodo de datos) y «precios marzo–octubre 2025» porque son correctos | `index.html`, `src/**`, `frontend/**` |

### 2.2 Electrónica y aplicación de monitoreo (pedido adicional)

- Diagrama de bloques SVG: ESP32-S3, HC-SR04, YF-S201, DS18B20, TDS/TSW-20M,
  SEN0189, compuerta/LED/buzzer, panel web y alimentación solar.
- Página `/monitoreo`: BOM, firmware y endpoints `/data`, `/toggleCompuerta`,
  `/toggleX`, `/toggleY`, error `-999.0`, panel ilustrativo con falla de sensor,
  presupuesto del informe, hoja de ruta y descargas.
- Todo se rotula **prototipo de laboratorio / maqueta**, con la aclaración de que
  las capturas del informe se tomaron con el microcontrolador sin sensores
  conectados y que faltan calibración, IP65, watchdog, LoRaWAN y un piloto de
  6–12 meses.

### 2.3 Datos y reproducibilidad

| Producto | Contenido |
|---|---|
| `public/data/robustez_estadistica.json` / `.csv` | 42 filas con p nominal, p varianza ajustada, p TFPW, q de BH, r1, n efectivo y categoría |
| `public/data/oni_ascii_cpc_1998_2026.txt`, `oni_cpc_fuente.json` | ONI oficial NOAA CPC 1998–ASO 2026 y metadatos de fuente/definición |
| `public/data/estacion_cordoba_observatorio_mensual.csv`, `validacion_local_cordoba.csv` | 288 meses reales y 24 totales anuales del Observatorio Córdoba |
| `public/data/enso_atribucion.json/.csv`, `enso_mensual_estacion.json`, `escenarios_enso_3_6_meses.json` | 504 pruebas, composites, contraste mensual y bandas condicionales |
| `public/data/inventario_cuencas.json`, `captura_*.png` | Inventario del paquete de cuencas >20 GB y capturas aportadas |
| `scripts/robustez_estadistica.py` | Recalcula todo con stdlib de Python; reproduce `max |p_nominal − p_publicado| ≈ 1,5 × 10⁻⁷` |
| `scripts/validar_con_estacion.py` | Contraste realizado con estación: r = 0,7051, Spearman 0,7606, sesgo, MAE/RMSE y signo de Sen |
| `scripts/atribucion_enso.py`, `scripts/generar_demo_2d.py` | Atribución ENSO stdlib y reconstrucción vectorial del visor 2D |
| `.github/workflows/deploy.yml` | Verifica que los JSON/CSV de robustez, ONI, ENSO, estación, inventario, 2D y panel lleguen a `dist/public` |

Números clave: 1.092 observaciones (7 × 6 × 26 años), 7 celdas de grilla
distintas, 7 grupos de series duplicadas, α/42 = 0,00119, 88,4 % de probabilidad
de al menos un falso positivo, 5 resultados robustos (4 señales independientes),
**0 tendencias de precipitación robustas**, sequía 2020–2023: 7/7 puntos con
anomalía negativa y −26,0 % promedio. La corrección ENSO añade 504 pruebas y
un contraste mensual observado de +17,34 mm/mes (El Niño − La Niña; p = 0,028).

### 2.4 Correcciones de contenido y seguridad

- `ClimateSection` y `ProblemSection`: en la primera ronda ENSO quedó como
  contexto bibliográfico; en la tercera ronda se sustituyó esa salvedad por el
  enlace a la atribución ONI/Niño 3.4 publicada (§8).
- `DetectiveMode`: además del p nominal muestra p preblanqueado, q de BH, r1 y la
  categoría corregida.
- `SatelliteSection`, `ResultsSection`, `Footer`, `ChatWidget`: sin productos
  satelitales falsamente conectados ni «sistema online» de sensores; las
  predicciones 3–6 meses se resolvieron como escenarios condicionales con
  bandas P10–P90 y etiqueta «no es pronóstico» (§8).
- `frontend/` (copia legacy, **no desplegada**): su base de conocimiento se
  reescribió dos veces; ahora remite a la atribución ENSO de la web activa y a la
  réplica reproducible. Su `predictNDVI` sigue siendo un ejemplo didáctico sin
  valor predictivo, no la fuente de la atribución. Se eliminaron «4 datasets
  NASA», «7 cuencas monitoreadas con ESP32» y «85 % más barato demostrado».
- `src/pages/Paradigmas.tsx`: se quitó una **clave de API de Google embebida**, se
  pasó a `VITE_GEMINI_API_KEY`, y el «Asistente de IA» pasó a ser un asistente
  local determinista. Se eliminó el «Panel del Creador» que simulaba un backend
  vivo. **Acción pendiente para el equipo: revocar/rotar esa clave**, porque sigue
  visible en el historial del repositorio.
- `README.md`, `DEMO_GUIDE.md`, `GLOSSARY.md`, `VALIDACION_Y_ESTADISTICA.md`:
  reescritos/actualizados con guion de 7 minutos, glosario de TFPW/FDR/n efectivo,
  atribución ENSO, estación real, inventario de cuencas y límites.

---

## 3. Validación técnica realizada

| Prueba | Resultado |
|---|---|
| `npm run build` | **OK** (Vite 7.3.0; aviso no bloqueante de chunk > 500 kB) |
| Verificación de salida Pages | OK en la ronda 2: `index.html`, `404.html`, 6 productos de `data/`, `drone/index.html`; ampliada en §8.5 |
| `npm run check` (`tsc -b`) | 30 errores, **todos preexistentes** en el scaffolding `api/`, `db/`, `trpc`, `Admin`, `useAuth` y dos variables sin usar. El commit base `a591168` tiene 31; no se introdujo ninguno y se redujo uno al quitar una llamada tRPC inválida. La app de Vite compila igual. |
| Servidor en vivo | `0.0.0.0:3000`, `allowedHosts: true`, HMR activo |
| Rutas HTTP | `/`, `/monitoreo`, `/drone`, `/detective-mode`, `/paradigmas`, `/documentacion`, JSON/CSV y visor 3D → **200** |
| Anclas | `#mapa-comparativo` y `#respaldo-estadistico` existen; `Home` ahora respeta el hash entrante en lugar de forzar `scrollTo(0,0)` |

No se pudo generar una captura automatizada del navegador (no hay Chromium ni
Playwright en el sandbox). La valoración visual se basa en el CSS, los
componentes, el build y la preview abierta; conviene que la recorras en el
navegador antes de aprobar.

---

## 4. Revisión del informe: qué encontré

Leído completo: portada (AÑO 2026, 15 de noviembre de 2026, 6.º A, IPET N°66,
13.562 palabras, ~88 páginas), índice, §1–§15 y Anexo.

### 4.1 Fortalezas

- Estructura muy completa: problema hídrico, marco teórico, propósito, QGIS,
  electrónica, programación, materiales, procedimiento, riesgos, simulación,
  Gantt, conclusión, bibliografía y anexo.
- §4 describe un procedimiento real y ordenado (ver §4.2 más abajo).
- §5–§6 documentan componentes, endpoints y códigos de error con nivel de
  detalle poco común en un proyecto escolar.
- §10.4.5 es honesto: DEM de 30 m, prisma trapezoidal, prototipo de laboratorio,
  sin geotecnia de campo, consulta comunitaria limitada y piloto de 6–12 meses
  pendiente. Esa sección es la que ahora gobierna el encuadre de la web.

### 4.2 Procedimiento QGIS §4.1–4.4 (ya disponible)

1. **DEM:** descarga desde USGS EarthExplorer o Copernicus, GeoTIFF, 30 o 90 m;
   carga de tiles en QGIS; unión con *Combinar*; *Hillshade*; paleta de colores.
2. **Drenaje:** complementos ArkGeek, TauDEM y GRASS `r.watershed` para dirección
   de flujo, acumulación de flujo y extracción de ríos/cauces; puntos de salida
   para delimitar cuencas (`Watershed` / `r.water.outlet`); conversión a vectorial
   y superposición con uso del suelo, infraestructura y agua.
3. **Volúmenes:** recorte de polígonos de curvas de nivel con *Clip*, generación
   de curvas cada **1 m** desde el MDE, cálculo de áreas/perímetros por franja con
   ArkGeek, volumen parcial por **prisma trapezoidal (prismoide)** y exportación a
   Excel con fórmulas y conversiones a hm³ y litros.
4. **Espectral:** composición en falso color **NIR-R-G** para agua/vegetación,
   y NDVI con rangos de densidad vegetal; §4.6 concluye que NDVI > 0,6 queda
   mayormente fuera del área de inundación proyectada.

**Para que sea reproducible faltan:** proveedor y fecha exactos del DEM, IDs de
los tiles, CRS, resolución final, tratamiento de sumideros/depresiones, umbral de
acumulación de flujo usado, coordenadas de los puntos de salida, la planilla de
Excel, las imágenes con fecha/sensor y un cálculo de incertidumbre del volumen.
Las fórmulas del §4.3.4 y §4.5 están como imágenes; en la exportación de texto no
se pueden verificar.

### 4.3 Inconsistencias y sobreafirmaciones (priorizadas)

| # | Hallazgo | Impacto / corrección sugerida |
|---|---|---|
| 1 | **Dos conjuntos de cuencas distintos.** §4.6 dice «seis polígonos» + Dique San Roque, con nombres Norte-Oeste, Norte-Este, Centro, Centro-Sur, **Sur-Este dos veces** y áreas en m². La web usa 7 códigos CN-O, CN, CC, CC-S, CS, CE, CO con `cuencas.geojson` de rectángulos esquemáticos. | Publicar los polígonos QGIS con sus IDs y metadata, o dejar claro —como ya hace la web— que el GeoJSON son **puntos de consulta**, no delineaciones. Unificar la tabla de nombres y corregir el duplicado «Sur-Este». |
| 2 | **Coordenada con error** en §4.6, Cuenca Centro-Sur, vértice C: dice `Latitud: -64° 38' 41.6" W, Longitud: -64° 36' 0.3" W` (falta la latitud). | Revisar los cuatro vértices y publicar también en decimales. |
| 3 | **NDVI: informe vs web.** §4.5 dice que se procesaron imágenes y se generaron mapas; `variables.json` y la web declaran NDVI/GPM **pendientes**. | No es contradicción si se aclara: el informe describe un análisis visual en QGIS sin serie publicada; la web solo integra NASA POWER en las 42 pruebas. Agregar sensor, fechas y raster para convertirlo en dato reproducible. |
| 4 | **ENSO como causa.** §2.5 y §4.7 afirman que El Niño produce inundaciones y La Niña sequías sin cuantificar la relación. La entrega web ahora sí publica ONI/Niño 3.4, 504 pruebas y un contraste mensual significativo. | El informe debería citar magnitudes, intervalos y el carácter estadístico de la atribución, sin presentarla como causalidad mecanicista. La web ya lo distingue en `/#enso`. |
| 5 | **«Gemelo Digital implementado»** (§2.7) y «datos en tiempo real» (§1, §3, §7), frente a un panel estático con CSV archivados y una maqueta de laboratorio. | Cambiar a «réplica reproducible / prototipo con datos simulados». La web publica datos, scripts, modelo, panel V4 y visor 2D con `gemelo_digital_en_vivo: false`; §10.4.5 del informe ya admite que no hay telemetría. |
| 6 | **Stack y productos sobredimensionados.** §7 menciona React 19/Vite 7/Tailwind/shadcn, Hono+tRPC+Drizzle+MySQL, TRMM/GPM/MODIS/SMAP/GRACE/Landsat, capas en tiempo real, simulador Leaflet 2D y Three.js 3D (§11), y un asistente «Google Gemini» descrito como «Gemma 4B». En el repo activo: NASA POWER; `api/`/`db/` son scaffolding con errores de tipos; el chat es FAQ local; el visor 3D es del dron. | Distinguir «usado», «prototipo» y «planeado». Corregir el nombre del modelo. La web ya no presenta esas integraciones como vivas. |
| 7 | **Unidades/órdenes de magnitud en el Anexo.** `~1,3 Hm³/año (1.300 millones de litros)` es una conversión correcta (1 Hm³ = 10⁹ L), pero con 1,6 M hab × 250–300 L/día el consumo domiciliario sería ≈146–175 Hm³/año, unas **~120 veces** mayor. Además, `1.800 → 2.600 Hm³/año` de demanda total (§1) y «agricultura > 70 %» no cierran con esa cifra sin aclarar alcance. | Explicitar si 1,3–2,0 Hm³ corresponde a **un dique**, a una localidad o a toda la provincia; citar la fuente y el año de cada cifra. |
| 8 | **Años mezclados.** Portada y entrega 2026; bibliografía cita el proyecto como 2024; presupuesto con precios marzo–octubre 2025; Gantt con hitos 2025 en la copia legacy. | Unificar la narrativa 2026. **No** borrar `2000–2025` (periodo de datos) ni los precios de 2025: son legítimos. |
| 9 | **Enlaces de repositorio.** §13 apunta a `ACTECNICAL66/elfindelosni-os.github.io`; §7.6 al sitio `actecnical66.github.io/El-Fin-de-los-Ni-os---web/`; el repo de esta rama es `ACTECNICAL66/El-Fin-de-los-Ni-os---web`. | Dejar un único repositorio canónico y una única URL publicada. |
| 10 | **Afirmaciones de campo.** §4.4 dice «validar en campo la existencia de vegetación natural»; §10.4.5 reconoce consulta comunitaria limitada y ausencia de geotecnia; el informe admite que las capturas del MCU se hicieron sin sensores conectados. | Usar «revisión visual / validación pendiente» donde corresponda. La web ya rotula la electrónica como maqueta. |

### 4.4 Validación externa usada en la web

El informe documenta la sequía 2020–2023 y los niveles bajos de San Roque y La
Quebrada. Se verificó además una fuente contemporánea independiente de La Voz
del Interior (1/2/2023) [2](https://www.lavoz.com.ar/ciudadanos/tras-las-lluvias-los-diques-de-cordoba-subieron-pero-siguen-lejos-del-nivel-esperable-para-esta-epoca/):
informa tres años consecutivos con lluvia por debajo de la media y embalses lejos
del vertedero, según mediciones de la APRHI. El INA publica además una metodología
SDI para sequías hidrológicas en la cuenca alta del Suquía [1](https://www.ina.gov.ar/cirsa/pdf/Actualizacion_Evaluacion_sequias_hidrologicas_tributarios_dique_San_Roque.pdf),
útil para un futuro contraste con caudales.

Las series NASA POWER reproducen cualitativamente ese evento (7/7 puntos, −26 %).
**Esto es consistencia documental de un evento, no validación instrumento a
instrumento ni prueba de la tendencia de largo plazo.** La atribución a La Niña
que menciona la nota no se toma de la nota: se evalúa por separado con ONI de
NOAA CPC en `scripts/atribucion_enso.py` (§8). La validación local ya se realizó
con 288 meses del Observatorio Córdoba y `scripts/validar_con_estacion.py`;
la plantilla vacía se eliminó.

---

## 5. Coherencia de la identidad visual

**Veredicto: sí, se mantiene coherente**, con tres salvedades.

- Las secciones nuevas reutilizan `glass-card`, `section-alt`, `section-dark`,
  `font-display`, `text-water-*`/`text-eco-*` y la misma retícula de 7 columnas.
  El mapa SVG, el diagrama de hardware y las tablas no introducen otra paleta.
- **Visor del dron:** es un bundle apropiadamente técnico, con fondo claro y
  tipografía mono. Se encuadró dentro de `DronePage` con cabecera oscura, tarjetas
  de estado y una franja ámbar de «concepto de diseño». Así se lee como anexo
  técnico y no como un cambio de identidad.
- **Imágenes:** `hero-bg.jpg` (embalse aéreo de aspecto generado), `micro-presas.jpg`
  y `sensor-esp32.jpg` son ilustrativas y no muestran hardware identificable;
  `study-area.jpg` es un mapa hipsométrico en inglés sin leyenda de los 7 códigos.
  Ya están marcadas como ilustrativas; si se quiere subir el nivel, conviene
  sustituirlas por capturas QGIS etiquetadas y una foto real de la maqueta.
- Las fuentes se cargan desde Google Fonts. Hay fallbacks definidos, pero si la
  evaluación es sin conexión conviene alojarlas localmente.

---

## 6. Estado del repositorio y qué falta

- Archivos trackeados modificados y rutas nuevas sin trackear; el recuento exacto
  se toma de `git status` al cierre de la ronda. Sin commits ni push en esta sesión.
- `dist/` se genera pero está fuera del control de versiones; `node_modules/`
  instalado localmente.
- Pendiente de decisión humana:
  1. recorrer la preview y aprobar el diseño;
  2. **revocar/rotar la clave de API presente en el historial**;
  3. corregir en Google Docs los puntos §4.3 (sobre todo cuencas, NDVI, ENSO,
     unidades y año);
  4. ampliar la red de estación con sensores calibrados y repetir `validar_con_estacion.py`;
  5. recién entonces: commit → push a esta rama → deploy.

---

## 7. Segunda ronda: encuadre del desafío y panel V4

### 7.1 Objetivo de la categoría, ahora explícito

Los resúmenes públicos del desafío 2026 *Be an Earth System Trend Detective!*
plantean encontrar variables medidas por misiones o modelos de NASA, visualizar
cómo cambian en el tiempo y determinar **qué cambia, dónde, cuánto y si el cambio
es estadísticamente significativo** [1](https://edeon.sonoma.edu/nasaspaceapps-26/).
Otras implementaciones del mismo reto organizan la entrega como
*What → Where → How Much → Is It Significant → Why It Matters* [10](https://github.com/rezaulkarim-dev/NASC26).

Ese era el eslabón que faltaba en la web: todo estaba implementado, pero no
rotulado con el vocabulario del desafío. Se agregó `ChallengeFitSection` con
cinco tarjetas que enlazan cada pregunta a Detective Mode, mapa comparativo,
caso de estudio, respaldo estadístico y contexto hídrico. En la tercera ronda su
caja de límites pasó a «Alcance verificado y decisiones resueltas»: cuencas 2D,
atribución ENSO, escenarios condicionales, réplica reproducible y estación real.
El hero, el footer, el CTA y la navegación apuntan también a esas secciones.

### 7.2 Panel de control: de V3 a V4

El archivo aportado (`PaneldeControlV3.html`, 40 KB) es un dashboard standalone
con CSS propio, FontAwesome por CDN y un `setInterval` de 3 s que genera valores
aleatorios. Tiene compuerta, ejes X/Z del seguidor solar, seis lecturas,
indicadores de TDS/turbidez y volumen evacuado. Es valioso, pero en el contexto
2026 tenía tres riesgos: estilo distinto al sitio, dependencia externa y
comentarios tipo «datos de sensores realistas» que podían leerse como telemetría
real.

Se hizo una **versión nueva integrada**, no un iframe:

| V3 | V4 |
|---|---|
| Segoe UI + FontAwesome CDN | Tailwind, `glass-card`, `lucide-react`, sin CDN |
| Simulación implicita | Franja permanente «SIMULACIÓN · sin hardware conectado» |
| Errores por sensor en el código | Interruptor visible para reproducir `-999.0` del DS18B20 |
| Badge sin año | NASA Space Apps 2026, ODS 6, vínculo al informe y al análisis |
| Sin control de la demo | Pausar, reanudar, reiniciar, falla, compuerta y ejes interactivos |

Rutas: `/panel` (V4 a pantalla completa, con tabla comparativa) y
`/panel/PaneldeControlV3.html` (original conservado con una franja de aviso).
`/monitoreo` ahora incrusta el V4 en lugar del panel estático anterior; el
teaser del inicio, el footer y el CTA enlazan a él. El workflow de Pages verifica
que el archivo original llegue a `dist/public`.

### 7.3 Validación de esta ronda

- `npm run build`: **OK** (1.962 módulos; aviso no bloqueante de chunk > 500 kB).
- `npm run check`: 30 errores, los mismos preexistentes del scaffolding; **0 nuevos**.
- HTTP 200 en `/`, `/panel`, `/monitoreo`, `/panel/PaneldeControlV3.html`,
  `/#encuadre-desafio` y los productos de `data/`.
- `dist/public/panel/PaneldeControlV3.html` presente.
- Sin captura automatizada de navegador (no hay Chromium/Playwright): la
  comprobación visual queda para la preview abierta.

**No se subió ni se envió nada.** La preview y este documento son la entrega para
revisión.

---

## 8. Tercera ronda: cuencas completas, ENSO atribuido y réplica reproducible

### 8.1 Material recibido y decisión de alcance

Se revisaron seis adjuntos: dos capturas del explorador de archivos, el HTML del
visor 2D de Cuenca 1, su generador de escenarios, su servidor estático y el
panel V3 ya integrado en la ronda anterior. Las capturas muestran un proyecto
local de **más de 20 GB** con `Proyecto MD V10.qgz`, un TIFF infrarrojo de
795 MB, seis `Tabla dique *.xlsx`, `cuencas.json`, scripts/visores multi-cuenca
y carpetas `Cuenca 1/2/3/5/6/SA`, `Mapas`, `Molinos` y `Complementos`. Cuenca 1
incluye GPKG, DEM, curvas, XLSX de EVA, GLTF, `data/`, `vendor/`, `index_2d.html`,
`index_3d.html`, generador 3D y servidor.

**Conclusión corregida:** el análisis geomorfológico no estaba incompleto; está
**casi completo**. Los archivos pesados no se versionan por tamaño. Se publicó
`public/data/inventario_cuencas.json` con el estado, las capturas, la lista de
carpetas/archivos y la decisión de repo. La web muestra ese inventario en `/#cuencas`.

### 8.2 Visor 2D integrado, sin CDN de librerías

> Estado de la **primera** integración. La corrección posterior que reemplaza las
> elipses por la cuenca real está en **§9**; estos archivos se conservan como
> trazabilidad del proceso.

- `public/simulacion-2d/index_2d_original.html`: inicialmente copia literal del
  visor recibido; hoy es una página de aviso que redirige a `index.html`. La
  copia literal quedó fuera del repo para auditoría.
- `public/simulacion-2d/index.html`: primera vista integrada con banner de modo
  demo, `fitBounds` corregido y una sola llamada a `init()`. En §9 se eliminan
  también los tiles externos y el cartel de error de conexión.
- `public/simulacion-2d/vendor/`: Leaflet, Chart.js e imágenes copiados de
  `node_modules` para que el visor funcione sin CDN.
- `scripts/generar_escenarios_cuenca1.py` y `scripts/servidor_visor_2d.py`:
  generador y servidor originales del equipo.
- `scripts/generar_demo_2d.py`: en su primera versión producía 535 filas EVA y
  23 escenarios elípticos ilustrativos. En §9 se reescribe para consumir el
  contorno real digitalizado.

Los caudales `ENSO_FLOWS = {El Niño: 5,0; Normal: 0,8; La Niña: 0,1}` m³/s se
conservan como **caudales de diseño**, no como pronóstico ni atribución.

### 8.3 Atribución ENSO: sí, con ONI / Niño 3.4

`public/data/oni_ascii_cpc_1998_2026.txt` contiene la tabla textual oficial de
NOAA CPC desde 1998 hasta ASO 2026; `oni_cpc_fuente.json` registra fuente,
definición ERSST.v5 / Niño 3.4, umbral ±0,5 °C, regla de cinco trimestres y la
advertencia de que ASO 2026 es preliminar. El índice se usa para:

1. **504 pruebas** (`scripts/atribucion_enso.py`, stdlib): cuatro ventanas ONI,
   retardos −1/0/+1, detrending, correlación parcial de Pearson/Spearman, p de
   t de Student, Benjamini–Hochberg global y para la ventana principal
   preespecificada. Semilla 20261114; 9999 permutaciones/bootstrap.
2. **Composites** El Niño − La Niña por variable, controlando celdas duplicadas:
   precipitación +68,7 mm/año (IC95 −47,5 a +183,2; p = 0,273; q = 0,273),
   temperatura −0,505 °C (p = 0,021; q = 0,128) y humedad +0,0271
   (IC95 +0,0016 a +0,0514; p = 0,059; q = 0,178).
3. **Prueba mensual observada**: 288 meses del Observatorio Córdoba,
   +17,34 mm/mes en El Niño frente a La Niña, IC95 por bloques [+3,58, +30,56]
   y p de permutación por bloques = **0,02768**. Es la base de la afirmación
   «sí se atribuye», sin convertirla en causalidad mecanicista.

Los resultados se publican en `enso_atribucion.json/.csv`,
`enso_fases_anuales.csv`, `enso_mensual_estacion.json` y en la nueva sección
`Correccion2026Section.tsx` (`/#enso`). `VALIDACION_Y_ESTADISTICA.md` §4.4
documenta el método y la distinción entre tendencia de largo plazo —ninguna
precipitación robusta— y variabilidad por fase ENSO.

### 8.4 Estación, predicciones 3–6 meses y «gemelo digital»

- **Estación real:** `scripts/preparar_estacion_cordoba.py` transcribe los 288
  meses 2000–2023 de Zenodo DOI `10.5281/zenodo.15013403`.
  `scripts/validar_con_estacion.py` ya no depende de una plantilla: usa por
  defecto `validacion_local_cordoba.csv` y reporta r = 0,7051, Spearman 0,7606,
  sesgo −34,05 mm/año, MAE 104,88, RMSE 127,87 e igualdad de signo de Sen.
  `public/data/validacion_local_plantilla.csv` se eliminó.
- **Escenarios 3–6 meses:** `escenarios_enso_3_6_meses.json` publica medianas y
  P10–P90 condicionadas a la fase ONI histórica. Medianas a 6 meses: El Niño
  726,0 mm; Neutro 580,3; La Niña 552,5. Se publican las tres fases; no se
  anticipa la fase futura y ASO 2026 (+2,46) queda como observación preliminar.
- **Réplica reproducible:** `enso_atribucion.json.estado_operativo` declara
  `modo: reproducible_sin_telemetria` y `gemelo_digital_en_vivo: false`. La
  solución incluye datos, scripts, modelo, panel V4 y visor 2D con estado
  explícito de simulación; no promete sensores activos ni control en vivo.

Se reescribieron las afirmaciones negativas en `ClimateSection`,
`StatisticalRigorSection`, `CaseStudySection`, `ChallengeFitSection`,
`AboutSection`, `FutureTechSection`, `ChatWidget`, `Footer`, `Monitoreo`, la base
legacy `frontend/`, `README.md`, `DEMO_GUIDE.md`, `GLOSSARY.md` y esta revisión.
`Navigation.tsx` y `CTASection.tsx` enlazan `/#cuencas` y `/#enso`.

### 8.5 Validación de la ronda

| Prueba | Resultado |
|---|---|
| `python3 scripts/preparar_estacion_cordoba.py` | 288 mensuales y 24 anuales reales; sin dependencias externas |
| `python3 scripts/validar_con_estacion.py --salida ...` | 24 años, r = 0,7051, Spearman 0,7606, sesgo −34,05 mm/año, mismo signo de Sen |
| `python3 scripts/atribucion_enso.py` | 504 pruebas; composites, estación mensual, escenarios y `estado_operativo` generados |
| `python3 scripts/robustez_estadistica.py` | 42 pruebas regeneradas; se eliminó la frase que negaba el análisis ENSO |
| `python3 scripts/generar_demo_2d.py` | Primera versión: 535 filas EVA y 23 escenarios demo. Forma real calibrada en §9 |
| `node --check data.js` y `node --check` del script inline del visor | **OK**; los cinco JSON del visor también parsean correctamente |
| `npm run build` | **OK**: 1.963 módulos, CSS 124,47 kB, JS 960,35 kB (gzip 275,76 kB), `dist/boot.js` 66,0 kB, 13,55 s; aviso no bloqueante de chunk > 500 kB |
| `npm run check` | 30 errores preexistentes del scaffolding (`api/`, `db/`, `Admin`, `useAuth`, `trpc`, `Paradigmas`, `ProblemSection`); **0 en los archivos nuevos** |
| Verificación local del workflow | Primera versión: 27 `test -s`; ampliada a 30 en §9 para incluir captura real, contorno y fondo local |
| HTTP en preview `0.0.0.0:3000` | 200 en `/`, `/panel`, `/monitoreo`, `/panel/PaneldeControlV3.html`, los JSON/CSV nuevos, `/simulacion-2d/index.html`, `data/data.js`, `mapa_cuenca_real.png`, `contorno_cuenca.json`, la captura real y ambos vendor JS |
| Working tree al cierre | 32 archivos trackeados modificados (812 inserciones / 555 borrados), 41 rutas nuevas; `.review/` y `__pycache__/` quedan fuera de Git por `.gitignore` |

No hay navegador/Chromium/Playwright en el sandbox: la comprobación visual del
iframe y los gráficos sigue pendiente de revisión humana en la preview. La forma
real se verificó rasterizando los vectores generados (§9). No se hizo
**commit, push, deploy, carga ni envío** de la entrega.


---

## 9. Cuarta ronda: la simulación 2D sigue la cuenca real

### 9.1 Qué se detectó

La captura nueva (`image-3.png`, copiada como
`public/data/captura_simulacion_cuenca1_real.png`) mostraba el visor del equipo
con la cuenca irregular calculada: brazo norte, lóbulo sureste, límite naranja,
**cota 1167 m**, **809,58 hm³**, **6,51 km²** y ≈**51 años** a 0,5 m³/s. La
vista integrada anterior dibujaba elipses y un fondo de 37,85 hm³: no seguía la
cuenca proporcionada. Además, los tiles CARTO devolvían «API KEY REQUIRED» y el
HTML recibido mostraba «No se pudo cargar Leaflet. Verifica tu conexión a
internet».

El `generar_escenarios.py` adjunto es **idéntico** al ya integrado
(`sha256 e07a8fb9…`): sigue necesitando `Tabla dique 1.xlsx` y
`Datos,cuenca 1 curvas.gpkg`, que no están en el repo. Por eso se reconstruyó la
forma desde la captura y se dejó explicitado qué falta para exactitud GIS.

### 9.2 Digitalización y productos nuevos

| Archivo | Contenido |
|---|---|
| `scripts/digitalizar_captura_cuenca.py` | Extrae el polígono azul y el límite naranja con OpenCV; produce `contorno_cuenca.json` y `mapa_cuenca_real.png` |
| `public/simulacion-2d/data/contorno_cuenca.json` | 150 vértices del polígono azul real, contorno exterior escalado, perfiles radiales auxiliares de 720 bines, centro y escala 9,06 m/px calibrada con el corte A-B de 4,16 km |
| `public/simulacion-2d/data/mapa_cuenca_real.png` | Fondo limpio: sólo forma azul y límite naranja; sin marcas de agua ni cartel de error |
| `scripts/generar_demo_2d.py` (reescrito) | Lee el contorno y genera 535 filas EVA, 23 escenarios vectoriales, `WATERSHED_BOUNDARY`, `CONFIG`, `escena_3d.json` y `data.js` |
| `public/simulacion-2d/data/data.js` | `MAPA_REAL_URL` + productos con `origen_geometria: Digitalización de captura...` y `demo: false` |

Curva EVA calibrada analíticamente: `V(x)=V_total·x^3,2165`, con
`V(1167)=809,58 hm³`, `S(1167)=6,51 km²`, `V(1301)=2050,54 hm³` y
`Q=0,5 m³/s → 51,3 años`. Los 23 escenarios conservan los entrantes y el brazo
norte al escalar el contorno real; el límite naranja se expande desde el perfil
azul con el factor observado.

### 9.3 Correcciones del visor

- `index.html`: eliminados los tres proveedores de tiles y el handler de
  fallback; ahora usa `L.imageOverlay(MAPA_REAL_URL, bounds)` con fondo local.
- `attributionControl: false`, sin URL externa y sin «API KEY REQUIRED».
- Banner cambiado de «MODO DEMO REPRODUCIBLE» a **«FORMA REAL DE CUENCA 1»**,
  con la salvedad de georreferenciación aproximada.
- `index_2d_original.html`: dejó de ser una copia rota y ahora redirige a la
  vista integrada. La copia literal se conservó fuera del repo para auditoría.
- `Correccion2026Section.tsx`: nota del iframe actualizada; el inventario suma
  la captura calculada como tercer registro visual.
- `public/simulacion-2d/README.md`, `README.md`, `inventario_cuencas.json` y
  `.github/workflows/deploy.yml`: documentan los nuevos productos y los
  verifican en `dist/public`.

### 9.4 Límite honesto y validación

La **forma** es la cuenca real proporcionada; las **coordenadas** y la EVA por
tramos son aproximadas porque no se adjuntaron el GPKG, el XLSX ni el `data.js`
de salida. Si el equipo ejecuta `generar_escenarios.py` en su carpeta local y
publica `data/data.js`, basta copiarlo sobre
`public/simulacion-2d/data/data.js` para reemplazar esta reconstrucción por la
geometría exacta.

| Prueba | Resultado |
|---|---|
| `PYTHONPATH=... python3 scripts/digitalizar_captura_cuenca.py` | 150 vértices del polígono azul; bbox 459×474 px; escala 9,06 m/px; factor exterior 1,186; PNG limpio de 674×654 px |
| `python3 scripts/generar_demo_2d.py` | 535 filas EVA, 23 escenarios, cota 1167 → 809,58 hm³ / 6,51 km² / 51,3 años; volumen máximo 2.050,54 hm³ |
| `node --check data.js` + script inline del visor | **OK**; 0 URLs de tiles externos, 0 textos «API KEY REQUIRED», `MAPA_REAL_URL` presente |
| Los seis JSON del visor | Parsean correctamente; `CONFIG.bounds` y `crop_box` usan el mismo recuadro, por eso fondo raster y vectores coinciden |
| Rasterizado de control | El GeoJSON de cota 1167 reproduce el brazo norte, los entrantes y el lóbulo sureste de la captura |
| `npm run build` | **OK**: 1.963 módulos, JS 960,35 kB, 13,55 s; `dist/public` incluye captura real, contorno, fondo local, `data.js` y el redirect del HTML recibido |
| `npm run check` | 30 errores preexistentes; **0 nuevos** |
| Checks de deploy | **30/30** `test -s` pasan sobre `dist/public` |
| HTTP preview | 200 en `/`, `/panel`, `/monitoreo`, `/simulacion-2d/index.html`, `data.js`, `mapa_cuenca_real.png`, `contorno_cuenca.json`, `captura_simulacion_cuenca1_real.png` e inventario |
| Working tree | 32 modificados (812/555) y 41 rutas nuevas; sin commit, push, deploy, carga ni envío |

No hay navegador/Chromium/Playwright: la comprobación final del iframe en el
navegador queda para la preview. La forma real, en cambio, se verificó
rasterizando los vectores generados y comparándola con la captura aportada.
