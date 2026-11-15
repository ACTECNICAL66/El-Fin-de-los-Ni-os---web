import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Hay atribución a ENSO?",
  "Hay predicciones a 3 o 6 meses?",
  "Cuánto avanzó el análisis de cuencas?",
  "Hay gemelo digital?",
  "Qué corrige el respaldo estadístico?",
  "Dónde está el panel de control?",
];

const FAQ: Record<string, string> = {
  "qué es el fenómeno enso":
    "Sí: el sitio incorpora ONI de NOAA CPC (Niño 3.4) y atribuye una parte de la variabilidad a El Niño y La Niña. Hay 504 pruebas parciales, composites y una serie mensual real del Observatorio Córdoba: El Niño supera a La Niña por +17,3 mm/mes, con IC95 +3,6 a +30,6 y p por bloques = 0,028. Es atribución estadística, no demostración de causalidad mecanicista. Ver /#enso.",
  "cómo afecta el niño a córdoba":
    "El Niño se asocia con más lluvia en la serie observada de Córdoba: +17,3 mm/mes frente a La Niña (p por bloques = 0,028). El compuesto anual de NASA POWER marca +68,7 mm/año entre fases, con IC amplio; por eso publicamos magnitud, intervalo y corrección por comparaciones múltiples. Ver /#enso.",
  "cómo afecta la niña a córdoba":
    "La Niña es la fase seca del contraste: la estación real registra 17,3 mm/mes menos que El Niño y la temperatura del compuesto anual es 0,5 °C mayor (p = 0,021; q = 0,128 tras corrección). Los escenarios condicionales de 6 meses dan una mediana de 552,5 mm para La Niña frente a 726,0 mm para El Niño. Ver /#enso.",
  "qué son las micro-represas":
    "Las micro-represas son pequeñas estructuras de retención propuestas para almacenar o ralentizar agua en una cuenca. Su ubicación, costo y efectos ambientales deben evaluarse con estudios de terreno e hidrológicos antes de proponer su construcción.",
  "cuántas cuencas se analizaron":
    "Hay dos cosas distintas y conviene no confundirlas. El proyecto delimitó ocho cuencas hidrográficas reales en QGIS, entre 1,20 y 22,14 km², con sus polígonos en el GPKG. Y por separado consulta siete celdas de la grilla NASA POWER de 0,5° (unos 50 × 50 km). Los siete puntos no son cuencas: ninguno cae dentro de una cuenca real y el más cercano está a 21 km.",
  "cuál es la cuenca 1":
    "La Cuenca 1 es la del dique principal: 8,54 km², límite real de 476 vértices tomado del GPKG, cotas de 766 a 1301 m y 1.993,31 hm³ de volumen total. A cota 900 m anega 27,18 hm³ sobre 0,50 km². Ese dato se verifica de dos formas independientes: la curva EVA y el conteo de celdas del DEM, que coinciden en 99,6 %.",
  "hay ndvi":
    "No. Busqué en todo el repositorio del proyecto y no existe ningún archivo de NDVI: no hay capa en los 24 GPKG ni columna en las seis tablas XLSX. La sección declara el vacío en lugar de simularlo, y queda un cargador listo para un CSV real de MOD13Q1 v061. Tampoco hay gemelo digital en vivo ni telemetría de sensores.",
  "qué corrige el respaldo estadístico":
    "El Mann–Kendall original no corregía autocorrelación temporal. Publicamos un ajuste de varianza por n efectivo y un preblanqueamiento libre de tendencia (TFPW), además del q de Benjamini–Hochberg para las 42 pruebas. Quedan 5 resultados robustos, todos de temperatura media; ninguna tendencia de precipitación sobrevive las correcciones.",
  "cuál es el caso de estudio":
    "Cuenca Sur, temperatura media: Sen +0,41 °C por década, p y q corregidos por debajo de 0,05, con un cambio total estimado de ~1,02 °C en 26 años. Es un punto de grilla y no dimensiona una obra; la atribución ENSO se analiza por separado en 504 pruebas y en la serie mensual de la estación. Ver /#enso.",
  "cómo validaron un hallazgo":
    "Tres niveles: 1) consistencia documental 2020–2023 (7 de 7 puntos, −26 %); 2) estación real del Observatorio Córdoba, 288 meses 2000–2023, r = 0,71 y Spearman 0,76 contra NASA POWER; 3) atribución ENSO mensual con resultado significativo +17,3 mm/mes. La plantilla vacía ya no existe. Ver /#enso.",
  "cuál es el desafío de la categoría":
    "El desafío 2026 «Be an Earth System Trend Detective!» pide encontrar variables de NASA, visualizar cómo cambian en el tiempo y determinar qué cambió, dónde, cuánto y si el cambio es significativo. La sección «Cómo cumple el desafío» enlaza cada respuesta con su evidencia en el sitio.",
  "dónde está el panel de control":
    "En /panel está el panel V4: una simulación interactiva con compuerta, seguidor solar, seis lecturas, indicadores de TDS/turbidez y el error -999.0. Se conserva también el HTML V3 del equipo. Es una réplica reproducible sin hardware conectado; no publicamos telemetría en vivo ni un «gemelo digital» operativo.",
  "el dron ya mide datos":
    "No. El AG-01 es un concepto de diseño y un visor 3D de una aplicación futura: no está construido, no vuela, no tiene sensores instalados y no aporta datos a los 42 resultados. Lo mismo aplica a la red de monitoreo: hoy hay una maqueta de laboratorio y un panel ilustrativo.",
  "qué datos de la nasa usaron":
    "El análisis conectado usa series NASA POWER de precipitación, temperatura media y máxima, viento, humedad de la zona radicular y radiación solar, archivadas entre 2000 y 2025 para siete puntos. MODIS NDVI y GPM IMERG aparecen como futuras integraciones y aún no forman parte de los resultados.",
  "qué es el ndvi":
    "El NDVI (Índice de Vegetación de Diferencia Normalizada) se calcula con reflectancias roja e infrarroja cercana y se usa como indicador de verdor. Su interpretación depende del sensor, cobertura, estación y procesamiento. En este proyecto la serie MODIS aún no está integrada.",
  "hay atribución a enso":
    "Sí. Publicamos ONI de NOAA CPC desde 1998, 504 pruebas parciales contra Niño 3.4, composites por fase, escenarios 3–6 meses y una estación real de 288 meses. El resultado principal: +17,3 mm/mes en El Niño frente a La Niña (IC95 +3,6 a +30,6; p = 0,028). Ver /#enso.",
  "hay predicciones a 3 o 6 meses":
    "Hay escenarios condicionales históricos de 3 y 6 meses con medianas y bandas P10–P90 por fase ENSO. No son pronóstico operativo: no anticipamos la fase futura y el evento ASO 2026 se reporta como observación preliminar, no como proyección. Ver /#enso.",
  "hay gemelo digital":
    "La solución publicada es una réplica reproducible: datos abiertos, scripts, modelo, panel V4 y visor 2D con estado explícito de simulación. No hay sensores conectados ni telemetría en vivo, por eso no lo llamamos gemelo digital operativo.",
  "cuánto avanzó el análisis de cuencas":
    "Está integrado. El visor usa los polígonos reales extraídos de los GPKG, no una digitalización a ojo. Tiene siete capas: relieve, pendiente, orientación, drenaje con orden de Strahler, incendios, llenado del embalse y curvas de los seis diques. Todo sale de archivos del proyecto. Ver /demo/.",
  "qué tecnología usan":
    "La web usa React/TypeScript y scripts Python reproducibles. El paquete cuencas de más de 20 GB se inventarió y el visor 2D quedó integrado sin CDN en /simulacion-2d/. La réplica incluye datos, modelo, panel y visor; la red IoT de campo sigue siendo un piloto futuro, no telemetría activa.",
};

export function findAnswer(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  for (const [key, answer] of Object.entries(FAQ)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return answer;
    }
  }
  return null;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([
    {
      role: "bot",
      text: "¡Hola! Soy el asistente del proyecto El Fin de los Niños. Preguntame por las tendencias, el mapa comparativo, el respaldo estadístico, la electrónica o el informe 2026.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const historial = [...messages, { role: "user" as const, text: userMsg }];
    setMessages(historial);
    setLoading(true);

    // 1. intenta el backend con Gemini (la clave vive solo en el servidor)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historial
            .filter(m => m.text)
            .slice(-12)
            .map(m => ({ role: m.role === "bot" ? "assistant" : "user", text: m.text })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.text) {
          setMessages(prev => [...prev, { role: "bot", text: data.text }]);
          setLoading(false);
          return;
        }
      }

      // 2. si el backend no esta configurado o falla, responde el FAQ local
      const local = findAnswer(userMsg);
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text:
            local ||
            "No tengo una respuesta verificada para esa consulta. El chat con IA no está configurado en este servidor y el repertorio local no cubre el tema. Podés explorar las secciones del proyecto o ver los datos en /demo/.",
        },
      ]);
    } catch {
      const local = findAnswer(userMsg);
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          text:
            local ||
            "No pude contactar al asistente. Respondo con el repertorio local: probá preguntando por las tendencias, el respaldo estadístico, la Cuenca 1 o el NDVI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-water-500 to-water-600 text-white shadow-xl shadow-water-500/30 hover:shadow-water-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center"
        aria-label="Chat"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-[100] w-80 sm:w-96 glass-card overflow-hidden shadow-2xl shadow-black/40 animate-fade-in">
          <div className="bg-gradient-to-r from-water-600 to-water-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  Asistente del Proyecto
                </p>
                <p className="text-white/60 text-[10px]">
                  IA con el contexto del proyecto · si falla, repertorio local
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 overflow-y-auto p-4 space-y-3 bg-nasa-dark/95">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-water-500/20 text-white rounded-br-md"
                      : "glass-card-light text-white/80 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass-card-light p-3 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-water-400" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2 bg-nasa-dark/95">
              <p className="text-[10px] text-white/30 mb-2">Sugerencias:</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setInput(s);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t border-white/10 bg-nasa-dark/95">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="Escribí tu consulta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:ring-1 focus:ring-water-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-lg bg-water-500/20 text-water-400 flex items-center justify-center hover:bg-water-500/30 transition-colors disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
