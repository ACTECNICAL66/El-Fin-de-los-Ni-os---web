# NDVI de las 8 cuencas reales

El visor tiene la pestaña **NDVI** en modo `SIN DATO · NO SIMULADO` porque en el
repositorio no hay ninguna serie de vegetación. Esto es lo necesario para llenarla
con datos reales de MOD13Q1 v061.

## Primero: qué polígonos

`public/data/cuenca1_real/cuencas_reales.geojson` tiene las **8 cuencas reales**
en CRS84. **No usar** `public/data/cuencas.geojson`: ese archivo son 7 celdas de
grilla NASA POWER de 5 vértices y 2.638 km² cada una, no cuencas.

| código | nombre | km² | px de 250 m |
|---|---|---|---|
| C1 | Cuenca 1 | 8,53 | 136 |
| C2 | Cuenca 2 Norte | 14,91 | 239 |
| C3 | Cuenca 3 / Centro | 8,92 | 143 |
| C5 | Cuenca 5 | 3,13 | 50 |
| C6 | Cuenca 6 | 22,12 | 354 |
| CSA | Cuenca San Antonio | 4,54 | 73 |
| C6M | Molinos · Cuenca 6-1 | 1,20 | **19** |
| C7M | Molinos · Cuenca 7-2 | 7,93 | 127 |

**C6M tiene 19 píxeles por compuesto.** El promedio anual es defendible; los
patrones espaciales dentro de esa cuenca no. Hay que declararlo al presentar.

## Camino A — Python, sin Earth Engine

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install earthaccess rasterio shapely pyproj numpy

# credenciales Earthdata (usuario gratuito en https://urs.earthdata.nasa.gov)
python3 -c "import earthaccess; earthaccess.login()"

python3 scripts/ndvi_cuencas.py
```

Salidas:

```
public/data/ndvi_cuencas.csv           codigo,anio,ndvi      <- lo que carga el visor
public/data/ndvi_cuencas_detalle.csv   por compuesto de 16 días
```

El script hace estas cosas, y cada una importa:

* descarta el relleno `-3000` en vez de promediarlo (si se promedia, el valor se hunde);
* filtra por la banda de calidad, descartando píxeles nublados o no producidos;
* promedia **ponderando por la fracción de cada píxel dentro del polígono**, con
  supersampleo 5×5, no tomando los píxeles cuyo centro cae adentro;
* calcula el área del píxel con los **dos ejes**: en EPSG:4326 un grado de longitud
  mide 111.320·cos(lat) pero uno de latitud mide 110.574. Usar un solo eje sesga el
  área un 14 % a 31° de latitud sur.

Verificado con un ráster sintético de NDVI conocido (0,6000) y relleno y nubes
inyectadas: recupera 0,6000 en las 8 cuencas y las áreas dan 0,1–1,5 % de error.

## Camino B — AppEEARS, sin programar

1. Cuenta en https://urs.earthdata.nasa.gov y login en
   https://appeears.earthdatacloud.nasa.gov
2. **Extract → Area**
3. Subir `public/data/ndvi_appeears.geojson` (lo genera el script con
   `--solo-geojson`, simplificado a 25 m, por debajo de la resolución del producto)
4. Producto **MOD13Q1.061**, capa `250m_16_days_NDVI`
5. Rango 2000-02-18 → hoy
6. Descargar el `.zip`: trae un CSV largo con `Category, ID, Latitude, Longitude,
   Date, 250m_16_days_NDVI`

Para el promedio por cuenca hay que ponderar por área; un promedio simple de los
píxeles sobrerrepresenta el borde. El script hace eso solo.

## Camino C — Earth Engine

Subir `public/data/ndvi_cuencas_gee.geojson` como tabla y usar
`ee.ImageCollection('MODIS/061/MOD13Q1').select('NDVI')`, con
`reduceRegions(reducer=ee.Reducer.mean(), scale=250)`. Earth Engine ya entrega el
área ponderada. Exportar con `selectors: ['codigo','anio','ndvi']`.

## Formatos que acepta el visor

Encabezado con tres columnas, en cualquier orden:

* código: `codigo` o `cuenca`
* año: `anio` o `year`
* valor: `ndvi` o `valor`

Separador coma, punto y coma o tabulador. Códigos exactos: `C1, C2, C3, C5, C6,
CSA, C6M, C7M`.

## Sobre el acceso, que cambió

LP DAAC **retiró el Data Pool de MODIS el 30/06/2025**. Las rutas tipo
`e4ftl01.cr.usgs.gov/MOLT/MOD13Q1.061` ya no responden. Por eso los tres caminos
de arriba usan CMR (earthaccess), AppEEARS o Earth Engine.
