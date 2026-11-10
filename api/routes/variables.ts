import { Hono } from "hono";

export const variablesRoute = new Hono();

const variables = [
  {
    id: 1,
    nombre: "precipitacion",
    unidad: "mm",
    descripcion: "Precipitación acumulada mensual",
  },
  {
    id: 2,
    nombre: "temperatura",
    unidad: "C",
    descripcion: "Temperatura media mensual",
  },
];

variablesRoute.get("/", (_c) => {
  return Response.json({ success: true, data: variables, count: variables.length });
});

variablesRoute.get("/:nombre", (c) => {
  const nombre = c.req.param("nombre");
  const variable = variables.find((v) => v.nombre === nombre);
  if (!variable) {
    return Response.json({ success: false, error: "Variable no encontrada" }, 404);
  }
  return Response.json({ success: true, data: variable });
});