import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, Sparkles, Database, Satellite } from 'lucide-react'

interface Message {
    id: number
    text: string
    sender: 'bot' | 'user'
    timestamp: Date
}

const KB: { keywords: string[]; answer: string }[] = [
    {
        keywords: ['cuenca', 'cuencas', 'basin', 'basins', 'territorio', 'sitios'],
        answer: `Esta versión legacy trabaja con **7 códigos de cuenca** (CN-O, CN, CC, CC-S, CS, CE, CO). Cada uno se consultó en un **punto de grilla representativo** de NASA POWER, no en un promedio de todo el polígono. Los rectángulos del GeoJSON son referencias esquemáticas: las delineaciones hidrológicas están en el informe y aún deben publicarse con metadata para reproducirlas.`
    },
    {
        keywords: ['nasa', 'satélite', 'satelite', 'landsat', 'modis', 'ecostress', 'data', 'earthdata', 'dato'],
        answer: `El análisis conectado usa **NASA POWER Monthly API** (2000–2025) con seis variables: precipitación, temperatura media y máxima, viento, humedad de la zona radicular y radiación solar. Landsat, MODIS NDVI, GPM IMERG, SMAP, GRACE y ECOSTRESS aparecen en el informe como contexto o integraciones futuras; **no alimentan las 42 pruebas publicadas**.`
    },
    {
        keywords: ['ndvi', 'vegetación', 'vegetacion', 'indice', 'índice', 'verde'],
        answer: `El informe describe un análisis de NDVI y falso color infrarrojo en QGIS, pero la web no publica una serie NDVI reproducible ni fechas/sensor/procedencia de las imágenes. Por eso la edición 2026 lo declara **pendiente de integración** y no lo usa para calcular tendencias ni predecir valores futuros.`
    },
    {
        keywords: ['niño', 'niña', 'enso', 'clima', 'sequía', 'sequia', 'inundación', 'inundacion'],
        answer: `**Sí hay atribución ENSO en la entrega 2026.** Se publicaron 504 pruebas parciales contra ONI / Niño 3.4, composites por fase, una estación real de 288 meses y escenarios condicionales de 3–6 meses. El resultado observado principal es +17,3 mm/mes en El Niño frente a La Niña (IC95 +3,6 a +30,6; p por bloques = 0,028). Es atribución estadística con intervalos, no un pronóstico operativo ni causalidad mecanicista; ver /#enso en la web activa.`
    },
    {
    {
        keywords: ['cuencas', 'qgis', 'dem', 'eva', 'visor 2d', 'simulación de llenado'],
        answer: `El análisis de cuencas está **casi completo** en el paquete local de más de 20 GB: QGIS, DEM, curvas, seis tablas EVA, GeoJSON, visores 2D y 3D. El visor 2D del repo ya sigue la forma real digitalizada de la captura (809,58 hm³ / 6,51 km² a cota 1167 m), sin tiles externos; las coordenadas exactas requieren el data.js generado con GPKG/XLSX. Ver /#cuencas.`
    },
    {
        keywords: ['estación', 'estacion', 'pluviómetro', 'pluviometro', 'observatorio córdoba', 'plantilla'],
        answer: `La plantilla vacía se eliminó. Hay 288 meses reales (2000–2023) del Observatorio Córdoba, con r = 0,71 y Spearman 0,76 frente a NASA POWER, además del contraste ENSO mensual significativo. Ver /#enso.`
    },
        keywords: ['estadística', 'estadistica', 'p-valor', 'p valor', 'autocorrelación', 'autocorrelacion', 'bonferroni'],
        answer: `Se publicaron 42 pruebas de Mann–Kendall. El p nominal no corrige autocorrelación; con TFPW, ajuste de varianza y Benjamini–Hochberg sobreviven **5 resultados robustos**, todos de temperatura media, y **ninguno de precipitación**. Bonferroni (α/42 = 0,00119) no deja significancias. Ver la sección «Respaldo estadístico» de la web activa.`
    },
    {
        keywords: ['costo', 'precio', 'economía', 'economia', 'presupuesto', 'dinero', 'ahorro'],
        answer: `El informe estima un presupuesto de referencia de **ARS 262.430** con precios de marzo–octubre de 2025. Es una estimación de materiales/prototipo, no un costo de obra construida ni una comparación validada con mega-represas. Las cifras comparativas de versiones anteriores no están respaldadas en el repositorio.`
    },
    {
        keywords: ['esp32', 'iot', 'sensor', 'hardware', 'arduino', 'proteus', 'firmware'],
        answer: `El informe documenta un **prototipo de laboratorio**: ESP32-S3 con WiFi, endpoints /data, /toggleCompuerta, /toggleX y /toggleY, sensores previstos y código de error -999.0. Las capturas se tomaron con el microcontrolador sin sensores conectados. La solución web publicada es una **réplica reproducible** (datos, modelo, panel V4 y visor 2D) con estado «simulación sin hardware conectado»; no hay telemetría en vivo. El piloto de campo de 6–12 meses sigue siendo el paso siguiente para calibración, IP65 y watchdog.`
    },
    {
        keywords: ['dron', 'drone', 'ag-01', 'vuelo'],
        answer: `El AG-01 es un **concepto de diseño y visor 3D de una aplicación futura**. No está construido, no vuela y no recoge datos. Se presenta después del análisis estadístico y no participa en los 42 resultados.`
    },
    {
        keywords: ['qgis', 'gis', 'dem', 'mapa', 'geoespacial', 'sig', 'google earth', 'global mapper'],
        answer: `El informe describe: descarga de DEM (USGS EarthExplorer/Copernicus, 30 o 90 m), unión de tiles, hillshade, dirección y acumulación de flujo, delimitación de cuencas desde puntos de salida, curvas de nivel de 1 m, cálculo de volumen por prisma trapezoidal y composición NIR-R-G/NDVI. Faltan publicar tiles, CRS, fecha, umbral de acumulación, coordenadas de salida y la planilla de cálculo para que sea reproducible.`
    },
    {
        keywords: ['paradigma', 'centralizado', 'distribuido', 'diferencia', 'por qué', 'porque'],
        answer: `El informe contrasta un paradigma centralizado con micro-represas distribuidas y modulares. Es una **propuesta de diseño** con análisis topográfico y límites explícitos (sin geotecnia de campo ni consulta comunitaria amplia), no una obra evaluada ni un resultado medido de este sitio.`
    },
    {
        keywords: ['proyecto', 'qué es', 'que es', 'objetivo', 'fin de los niños', 'nasa space apps'],
        answer: `**"El Fin de los Niños"** se presenta en el NASA Space Apps Challenge 2026. La entrega conectada publica series NASA POWER 2000–2025, atribución ENSO con ONI de NOAA CPC, un inventario de cuencas y visor 2D, respaldo estadístico, un caso de estudio y la réplica de electrónica. El orden es: primero los datos y sus límites, después la tecnología propuesta.`
    },
    {
        keywords: ['san roque', 'dique', 'embalse', 'represa'],
        answer: `El informe usa el Dique San Roque como nodo y referencia geográfica, y documenta niveles bajos durante la sequía 2020–2023. La web activa no dimensiona obras ni simula su operación: el análisis de tendencias se limita a siete puntos de grilla climáticos.`
    },
]

function generateResponse(query: string): string {
    const q = query.toLowerCase()
    for (const item of KB) {
        if (item.keywords.some(kw => q.includes(kw))) {
            return item.answer
        }
    }
    return `Gracias por tu pregunta sobre **"${query}"**. Mi base de conocimiento cubre cuencas hidrográficas, datos NASA, tecnología ESP32/IoT, análisis NDVI, fenómenos El Niño/La Niña y la comparativa de paradigmas hídricos.\n\n¿Sobre cuál de estos temas te gustaría profundizar?`
}

export default function KnowledgeChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "¡Hola! Soy **GeoAssistant**, el asistente de inteligencia hídrica del proyecto 'El Fin de los Niños'. Puedo responder sobre cuencas analizadas, datos NASA, tecnología IoT y más. ¿En qué puedo ayudarte?",
            sender: 'bot',
            timestamp: new Date()
        }
    ])
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping])

    const handleSend = async (text?: string) => {
        const msg = (text ?? input).trim()
        if (!msg) return

        const userMsg: Message = { id: Date.now(), text: msg, sender: 'user', timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsTyping(true)

        setTimeout(() => {
            const botMsg: Message = { id: Date.now() + 1, text: generateResponse(msg), sender: 'bot', timestamp: new Date() }
            setMessages(prev => [...prev, botMsg])
            setIsTyping(false)
        }, Math.random() * 600 + 900)
    }

    return (
        <>
            {/* Pulsating Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-water-500 text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
            >
                <div className="absolute inset-0 rounded-full bg-water-400 animate-ping opacity-20" />
                <MessageSquare className="w-6 h-6 relative z-10" />
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-8 right-8 z-50 w-[380px] h-[550px] max-w-[90vw] max-h-[80vh] flex flex-col bg-nasa-dark border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-500 transform ${isOpen ? 'translate-y-0 opacity-100 visible' : 'translate-y-10 opacity-0 invisible pointer-events-none'}`}>

                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-water-600/20 to-eco-600/20 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-water-500/20 flex items-center justify-center border border-water-500/30">
                            <Bot className="w-6 h-6 text-water-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">GeoAssistant AI</h4>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Sistema Operativo</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 text-white/30 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                ? 'bg-water-500 text-white rounded-tr-none'
                                : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-none'
                                }`}>
                                {msg.sender === 'bot'
                                    ? <div className="space-y-1 leading-relaxed">
                                        {msg.text.split('\n').map((line, li) => {
                                            const parts = line.split(/\*\*(.*?)\*\*/g)
                                            return (
                                                <p key={li}>
                                                    {parts.map((part, pi) =>
                                                        pi % 2 === 1
                                                            ? <strong key={pi} className="text-white font-semibold">{part}</strong>
                                                            : <span key={pi}>{part}</span>
                                                    )}
                                                </p>
                                            )
                                        })}
                                    </div>
                                    : msg.text
                                }
                                <div className={`text-[10px] mt-1 opacity-40 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-white/[0.02]">
                    {[
                        { icon: Database, label: 'Ver Cuencas' },
                        { icon: Satellite, label: 'Datos NASA' },
                        { icon: Sparkles, label: '¿Cómo funciona?' }
                    ].map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(s.label)}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition-all"
                        >
                            <s.icon className="w-3 h-3" />
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white/[0.02] border-t border-white/10">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Haz una pregunta técnica..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-water-500/50 transition-colors"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-water-500 text-white rounded-lg disabled:opacity-50 hover:bg-water-400 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-white/20 mt-3 uppercase tracking-wider font-medium">Powered by NASA Space Apps 2026 Intelligence</p>
                </div>
            </div>
        </>
    )
}
