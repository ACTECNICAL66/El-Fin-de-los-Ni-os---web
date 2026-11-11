import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Qué es el fenómeno ENSO?",
  "Cómo afecta El Niño a Córdoba?",
  "Qué son las micro-represas?",
  "Cuántas cuencas se analizaron?",
];

const FAQ: Record<string, string> = {
  "qué es el fenómeno enso":
    "El Niño-Oscilación del Sur (ENSO) es un patrón climático acoplado del Pacífico tropical. Sus fases cálida (El Niño) y fría (La Niña) pueden influir en la lluvia y temperatura regionales. La magnitud y hasta el signo de esos efectos varían por región y evento; el análisis de este sitio no demuestra por sí solo una relación causal con ENSO.",
  "cómo afecta el niño a córdoba":
    "El Niño puede modificar la probabilidad de lluvia en Córdoba, pero el efecto no es idéntico todos los años. El Detective Mode muestra tendencias históricas de NASA POWER; para atribuir cambios a ENSO se necesita comparar con un índice ENSO y evaluar otros factores.",
  "cómo afecta la niña a córdoba":
    "La Niña puede modificar la probabilidad de lluvia y temperatura en Córdoba, con efectos que varían entre eventos. La serie del sitio no estima por separado el efecto de La Niña ni permite atribuirle una tendencia observada.",
  "qué son las micro-represas":
    "Las micro-represas son pequeñas estructuras de retención propuestas para almacenar o ralentizar agua en una cuenca. Su ubicación, costo y efectos ambientales deben evaluarse con estudios de terreno e hidrológicos antes de proponer su construcción.",
  "cuántas cuencas se analizaron":
    "El visor incluye siete cuencas de Córdoba. El Detective Mode compara seis variables NASA POWER por un punto de grilla representativo en cada cuenca; no calcula un promedio espacial del polígono ni determina ubicaciones óptimas de obras.",
  "qué datos de la nasa usaron":
    "El análisis conectado usa series NASA POWER de precipitación, temperatura media y máxima, viento, humedad de la zona radicular y radiación solar, archivadas entre 2000 y 2025 para siete puntos. MODIS NDVI y GPM IMERG aparecen como futuras integraciones y aún no forman parte de los resultados.",
  "qué es el ndvi":
    "El NDVI (Índice de Vegetación de Diferencia Normalizada) se calcula con reflectancias roja e infrarroja cercana y se usa como indicador de verdor. Su interpretación depende del sensor, cobertura, estación y procesamiento. En este proyecto la serie MODIS aún no está integrada.",
  "qué tecnología usan":
    "La web está construida con React/TypeScript y publica series procesadas con scripts Python en GitHub Pages. El proyecto también plantea explorar herramientas geoespaciales y sensores; esas propuestas no significan que ya exista una red IoT en producción.",
};

function findAnswer(input: string): string | null {
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
      text: "¡Hola! Soy el asistente del proyecto El Fin de los Niños. Hacé una pregunta sobre el proyecto, el fenómeno ENSO, las micro-represas o los datos de NASA.",
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
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    setTimeout(() => {
      const answer = findAnswer(userMsg);
      const response =
        answer ||
        "No tengo una respuesta específica para esa consulta. Te sugiero explorar las secciones del proyecto o consultar la documentación en https://github.com/ACTECNICAL66/elfindelosni-os.github.io";
      setMessages(prev => [...prev, { role: "bot", text: response }]);
      setLoading(false);
    }, 600);
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
                  Consultas sobre el proyecto ENSO
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
