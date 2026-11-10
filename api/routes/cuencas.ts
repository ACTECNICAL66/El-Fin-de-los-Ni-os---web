import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

export const cuencasRoute = new Hono();

// GET /api/cuencas - Listar todas las cuencas (sin geometría completa para lista ligera)
cuencasRoute.get("/", async (c) => {
  try {
    const res = await fetch(new URL("/data/cuencas.geojson", c.req.url).href);
    if (!res.ok) throw new Error("No se pudo cargar el GeoJSON");
    const geojson = await res.json();

    const cuencas = geojson.features.map((f: any) => ({
      id: f.properties.id,
      nombre: f.properties.nombre,
      codigo: f.properties.codigo,
      descripcion: f.properties.descripcion,
      area_km2: f.properties.area_km2,
      centroide: [
        (f.geometry.coordinates[0][0][0] + f.geometry.coordinates[0][2][0]) / 2,
        (f.geometry.coordinates[0][0][1] + f.geometry.coordinates[0][2][1]) / 2,
      ],
    }));

    return c.json({ success: true, data: cuencas, count: cuencas.length });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/cuencas/:id/geojson - Obtener GeoJSON completo de una cuenca
cuencasRoute.get("/:id/geojson", async (c) => {
  try {
    const cuencaId = parseInt(c.req.param("id"));
    const res = await fetch(new URL("/data/cuencas.geojson", c.req.url).href);
    if (!res.ok) throw new Error("No se pudo cargar el GeoJSON");
    const geojson = await res.json();

    const feature = geojson.features.find(
      (f: any) => f.properties.id === cuencaId
    );

    if (!feature) {
      return c.json({ success: false, error: "Cuenca no encontrada" }, 404);
    }

    return c.json({ success: true, data: feature });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});