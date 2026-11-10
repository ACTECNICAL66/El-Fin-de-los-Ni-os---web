import { Hono } from "hono";
import { readFileSync } from "fs";
import { join } from "path";

export const trendsRoute = new Hono();

function parseCSV(filePath: string): any[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim() || "";
    });
    return obj;
  });
}

const trendsData = parseCSV(
  join(process.cwd(), "public", "data", "trend_results.csv")
);

// Convertir tipos numéricos
trendsData.forEach((row: any) => {
  row.sen_slope = parseFloat(row.sen_slope);
  row.sen_slope_por_decada = parseFloat(row.sen_slope_por_decada);
  row.mann_kendall_tau = row.mann_kendall_tau ? parseFloat(row.mann_kendall_tau) : null;
  row.mann_kendall_p_valor = row.mann_kendall_p_valor ? parseFloat(row.mann_kendall_p_valor) : null;
  row.n_puntos = parseInt(row.n_puntos);
  row.periodo_inicio = parseInt(row.periodo_inicio);
  row.periodo_fin = parseInt(row.periodo_fin);
});

// GET /api/trends - Listar todas las tendencias
trendsRoute.get("/", (_c) => {
  return Response.json({
    success: true,
    data: trendsData,
    count: trendsData.length,
  });
});

// GET /api/trends?cuenca=...&variable=... - Filtrar tendencias
trendsRoute.get("/filter", (c) => {
  const cuenca = c.req.query("cuenca");
  const variable = c.req.query("variable");

  let filtered = trendsData;
  if (cuenca) {
    filtered = filtered.filter((row: any) => row.cuenca === cuenca);
  }
  if (variable) {
    filtered = filtered.filter((row: any) => row.variable === variable);
  }

  return Response.json({
    success: true,
    data: filtered,
    count: filtered.length,
  });
});

// GET /api/trends/:cuenca/:variable - Obtener tendencia específica
trendsRoute.get("/:cuenca/:variable", (c) => {
  const cuenca = c.req.param("cuenca");
  const variable = c.req.param("variable");

  const row = trendsData.find(
    (r: any) => r.cuenca === cuenca && r.variable === variable
  );

  if (!row) {
    return Response.json(
      { success: false, error: "Tendencia no encontrada" },
      404
    );
  }

  return Response.json({ success: true, data: row });
});