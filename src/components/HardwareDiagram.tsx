/** Diagrama de bloques del prototipo electrónico descrito en el informe (secciones 5, 6 y 8).
 *  Es un esquema de diseño: no representa hardware desplegado ni datos en vivo. */

interface Caja {
  x: number;
  y: number;
  w: number;
  h: number;
  titulo: string;
  detalle: string;
  tono?: "azul" | "verde" | "ambar" | "morado";
}

const TONOS: Record<string, { fill: string; stroke: string; text: string }> = {
  azul: { fill: "#0d2f52", stroke: "#1EB8FF", text: "#83E8FF" },
  verde: { fill: "#0b2e26", stroke: "#22C55E", text: "#86EFAC" },
  ambar: { fill: "#3a2a0d", stroke: "#F59E0B", text: "#FCD34D" },
  morado: { fill: "#271a3d", stroke: "#A78BFA", text: "#C4B5FD" },
};

function CajaSvg({ caja }: { caja: Caja }) {
  const tono = TONOS[caja.tono ?? "azul"];
  return (
    <g>
      <rect x={caja.x} y={caja.y} width={caja.w} height={caja.h} rx="10" fill={tono.fill} fillOpacity="0.85" stroke={tono.stroke} strokeOpacity="0.65" />
      <text x={caja.x + 12} y={caja.y + 21} fill={tono.text} fontSize="12.5" fontWeight="700" fontFamily="Inter, sans-serif">
        {caja.titulo}
      </text>
      <text x={caja.x + 12} y={caja.y + 39} fill="#ffffff" fillOpacity="0.55" fontSize="10.5" fontFamily="JetBrains Mono, monospace">
        {caja.detalle}
      </text>
    </g>
  );
}

const sensores: Caja[] = [
  { x: 24, y: 118, w: 208, h: 52, titulo: "Nivel de agua", detalle: "HC-SR04 · ultrasónico", tono: "azul" },
  { x: 24, y: 180, w: 208, h: 52, titulo: "Caudal", detalle: "YF-S201 · pulsos/L", tono: "azul" },
  { x: 24, y: 242, w: 208, h: 52, titulo: "Temperatura", detalle: "DS18B20 · OneWire", tono: "azul" },
  { x: 24, y: 304, w: 208, h: 52, titulo: "Turbidez / TDS", detalle: "SEN0189 · TSW-20M", tono: "azul" },
];

const actuadores: Caja[] = [
  { x: 728, y: 138, w: 208, h: 52, titulo: "Compuerta", detalle: "Servo SG90 / electroválvula 12 V", tono: "ambar" },
  { x: 728, y: 210, w: 208, h: 52, titulo: "Ejes del seguidor", detalle: "TDA2822 + TIP42 + LDR ×4", tono: "ambar" },
  { x: 728, y: 282, w: 208, h: 52, titulo: "Avisos locales", detalle: "Buzzer + LED de estado", tono: "ambar" },
];

const energia: Caja[] = [
  { x: 152, y: 428, w: 190, h: 52, titulo: "Panel solar 6 V / 1 W", detalle: "fuente principal", tono: "verde" },
  { x: 372, y: 428, w: 190, h: 52, titulo: "TP4056 + 18650", detalle: "carga y reserva 3,7 V", tono: "verde" },
  { x: 592, y: 428, w: 190, h: 52, titulo: "Regulación 3,3 V / 5 V", detalle: "alimentación del nodo", tono: "verde" },
];

export default function HardwareDiagram() {
  return (
    <svg viewBox="0 0 960 510" className="w-full h-auto" role="img" aria-label="Diagrama de bloques del prototipo ESP32 y sus sensores">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#48D6FF" fillOpacity="0.7" />
        </marker>
        <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="#4ADE80" fillOpacity="0.7" />
        </marker>
      </defs>

      {/* Navegador / red */}
      <CajaSvg caja={{ x: 356, y: 16, w: 248, h: 54, titulo: "Panel web (navegador)", detalle: "AP WiFi · HTTP · /data", tono: "morado" }} />
      <line x1="480" y1="70" x2="480" y2="168" stroke="#A78BFA" strokeOpacity="0.6" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#arrow)" />
      <text x="492" y="120" fill="#ffffff" fillOpacity="0.4" fontSize="10">fetch cada 2 s · JSON</text>

      {/* Sensores */}
      <text x="24" y="100" fill="#ffffff" fillOpacity="0.4" fontSize="11" letterSpacing="1.5">SENSORES</text>
      {sensores.map(c => (
        <g key={c.titulo}>
          <CajaSvg caja={c} />
          <path d={`M${c.x + c.w},${c.y + c.h / 2} H320 V230 H376`} fill="none" stroke="#1EB8FF" strokeOpacity="0.35" strokeWidth="1.3" markerEnd="url(#arrow)" />
        </g>
      ))}

      {/* ESP32 */}
      <CajaSvg caja={{ x: 376, y: 168, w: 208, h: 124, titulo: "ESP32-S3", detalle: "WebServer · WiFi AP", tono: "azul" }} />
      <text x="392" y="228" fill="#ffffff" fillOpacity="0.6" fontSize="10.5" fontFamily="JetBrains Mono, monospace">/data  /toggleCompuerta</text>
      <text x="392" y="246" fill="#ffffff" fillOpacity="0.6" fontSize="10.5" fontFamily="JetBrains Mono, monospace">/toggleX  /toggleY</text>
      <text x="392" y="270" fill="#ffffff" fillOpacity="0.4" fontSize="9.5">firmware C++ · Arduino IDE · Proteus</text>

      {/* Actuadores */}
      <text x="728" y="120" fill="#ffffff" fillOpacity="0.4" fontSize="11" letterSpacing="1.5">ACTUADORES</text>
      {actuadores.map(c => (
        <g key={c.titulo}>
          <CajaSvg caja={c} />
          <path d={`M584,230 H650 V${c.y + c.h / 2} H${c.x}`} fill="none" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1.3" markerEnd="url(#arrow)" />
        </g>
      ))}

      {/* Energía */}
      <text x="152" y="410" fill="#ffffff" fillOpacity="0.4" fontSize="11" letterSpacing="1.5">ALIMENTACIÓN (DISEÑO AUTOSUSTENTABLE)</text>
      {energia.map((c, i) => (
        <g key={c.titulo}>
          <CajaSvg caja={c} />
          {i < energia.length - 1 && (
            <line x1={c.x + c.w} y1={c.y + c.h / 2} x2={energia[i + 1].x} y2={c.y + c.h / 2} stroke="#4ADE80" strokeOpacity="0.5" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
          )}
        </g>
      ))}
      <path d="M687,428 V400 H480 V292" fill="none" stroke="#4ADE80" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#arrow-green)" />

      <text x="936" y="500" textAnchor="end" fill="#ffffff" fillOpacity="0.3" fontSize="10">
        Esquema de diseño según el informe · sin instrumentos instalados en campo
      </text>
    </svg>
  );
}
