import { Hono } from "hono";

/**
 * Chat con Gemini.
 *
 * SEGURIDAD: la clave se lee SOLO en el servidor, desde GEMINI_API_KEY.
 * Nunca se expone al navegador ni se prefija con VITE_ (todo lo VITE_ se
 * empaqueta en el bundle público y queda visible para cualquiera).
 *
 * Si no hay clave, el endpoint responde 503 con un mensaje honesto en
 * lugar de fallar en silencio.
 */

/**
 * Modelo por defecto.
 *
 * gemini-2.5-flash quedo deprecado el 2026-11-02 y desde el 2026-12-01 las
 * llamadas se redirigen solas, asi que no conviene fijarlo.
 */
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * Endpoint nativo de Gemini.
 *
 * La clave va en el header x-goog-api-key, NO en el query ?key=.
 *   1. Una clave en la URL termina en logs de servidores y proxies.
 *   2. Las claves AQ. (Auth keys, el formato que emite AI Studio desde 2026)
 *      pueden devolver 401 ACCESS_TOKEN_TYPE_UNSUPPORTED por query param.
 *      El header es la forma documentada y la que aceptan las dos familias
 *      de clave, AIza y AQ.
 */
const ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

/**
 * Contexto del proyecto. Es la unica fuente de verdad que se le pasa al
 * modelo: se le pide explicitamente que no invente fuera de esto.
 */
const CONTEXTO = `Sos el asistente del proyecto "El Fin de los Niños" (Equipo ACTECNICAL66),
presentado al NASA Space Apps Challenge. Respondés en español rioplatense, claro y breve.

DATOS VERIFICADOS DEL PROYECTO
- 1.092 observaciones anuales de NASA POWER (2000-2025), 6 variables, 7 puntos de grilla.
- 42 pruebas de tendencia con Mann-Kendall, Sen, TFPW y Benjamini-Hochberg.
  Resultado: 23 significativas nominales, 5 sobreviven BH, 0 sobreviven Bonferroni.
- FWER del conjunto: 0,884.
- Validación con la estación del Observatorio Córdoba: 288 meses (2000-2023),
  r = 0,705, Spearman 0,761, sesgo -34,05 mm.
- ENSO: 504 pruebas parciales y serie mensual real. El Niño supera a La Niña en
  +17,34 mm/mes (IC95 3,58 a 30,56; p por bloques = 0,0277).
- Escenarios condicionales de 3 y 6 meses: no son pronóstico operativo.
- Cuenca 1 (la cuenca del dique principal): límite real de 476 vértices tomado del
  GPKG del proyecto, 8,54 km² de superficie y 1.993,31 hm³ de volumen total.
  Cotas 766 a 1301 m. A cota 900 m: 27,18 hm³ y 0,50 km² anegados.
- Las otras cuencas reales del proyecto son 8 en total: C1 (8,54 km²), C2 (14,92),
  C3 (8,93), C5 (3,13), C6 (22,14), San Antonio (4,55) y dos de Molinos
  (7,93 y 1,20 km²).
- Los 7 puntos de NASA POWER son celdas de una grilla de 0,5 grados (unos 50x50 km),
  NO son cuencas hidrográficas. Ninguno cae dentro de una cuenca real; el más
  cercano está a 21 km. Esto se corrigió y la web lo declara.

CORRECCIONES PUBLICADAS (no las ocultes si preguntan)
- Las áreas del JSON original estaban infladas 17,5 % porque la columna
  surface_area_m2 era una suma acumulada de rebanadas, no un área. Se recalcularon.
- Antes se mostraban 7 "cuencas" de 2.670 a 4.200 km² que eran rectángulos
  esquemáticos inventados. Ahora hay 8 cuencas reales de 1,20 a 22,14 km².

LO QUE NO EXISTE (decilo con claridad, no lo simules)
- NDVI: no hay ningún archivo de NDVI en el proyecto. No hay capa en los GPKG,
  ni columna en las XLSX. La sección declara el vacío y queda un cargador listo
  para un CSV real de MOD13Q1 v061.
- Gemelo digital en vivo: no hay sensores conectados ni telemetría.
- El dron AG-01 es un concepto de diseño, no vuela ni mide.
- Pronóstico operativo ENSO: hay escenarios condicionales históricos, no pronóstico.

REGLAS
- No inventes cifras. Si no sabés algo, decilo.
- No prometas pronósticos ni atribución causal mecanicista.
- Sé breve: 3 o 4 oraciones salvo que pidan detalle.`;

interface Msg {
  role: "user" | "assistant";
  text: string;
}

export const chatRoute = new Hono();

chatRoute.post("/", async (c) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return c.json(
      {
        success: false,
        error:
          "El chat con IA no está configurado. Falta la variable de entorno GEMINI_API_KEY en el servidor.",
        sinClave: true,
      },
      503,
    );
  }

  let body: { messages?: Msg[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "JSON inválido" }, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return c.json({ success: false, error: "Sin mensajes" }, 400);
  }

  // Limite: ultimos 12 turnos y 2.000 caracteres por mensaje
  const recortados = messages.slice(-12).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.text ?? "").slice(0, 2000) }],
  }));

  try {
    const res = await fetch(ENDPOINT(MODEL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: CONTEXTO }] },
        contents: recortados,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 700,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      // No filtramos la clave en el error
      return c.json(
        {
          success: false,
          error: `Gemini respondió ${res.status}. ${detalle.slice(0, 300)}`,
        },
        res.status === 429 ? 429 : 502,
      );
    }

    const data: any = await res.json();
    const texto =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join("\n")
        .trim() || "";

    if (!texto) {
      const motivo = data?.candidates?.[0]?.finishReason || "sin contenido";
      return c.json(
        { success: false, error: `Gemini no devolvió texto (${motivo}).` },
        502,
      );
    }

    return c.json({
      success: true,
      text: texto,
      modelo: MODEL,
      uso: data?.usageMetadata ?? null,
    });
  } catch (e: any) {
    return c.json(
      { success: false, error: `No se pudo contactar a Gemini: ${e.message}` },
      502,
    );
  }
});

// Estado del chat, para que la UI sepa si hay clave configurada
chatRoute.get("/estado", (c) => {
  return c.json({
    configurado: Boolean(process.env.GEMINI_API_KEY),
    modelo: MODEL,
    nota: "La clave vive solo en el servidor (GEMINI_API_KEY). Nunca se envía al navegador.",
  });
});
