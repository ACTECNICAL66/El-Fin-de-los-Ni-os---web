# scripts

Utilidades que no forman parte del build.

## ndvi_cuencas.py

Extrae NDVI de MOD13Q1 v061 para las 8 cuencas reales y escribe el CSV que
consume la pestaña NDVI del visor. Ver [docs_ndvi.md](../docs_ndvi.md).

```bash
python3 scripts/ndvi_cuencas.py --solo-geojson   # solo los GeoJSON de subida
python3 scripts/ndvi_cuencas.py                  # descarga y calcula
```
