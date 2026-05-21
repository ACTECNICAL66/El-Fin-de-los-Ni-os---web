import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, User, Sparkles, Database, Satellite } from 'lucide-react'
import { knowledgeBase } from '../data/projectData'

interface Message {
    id: number
    text: string
    sender: 'bot' | 'user'
    timestamp: Date
}

export default function KnowledgeChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "¡Hola! Soy el Asistente de Inteligencia Geoespacial del proyecto 'El Fin de los Niños'. ¿En qué puedo ayudarte hoy?",
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

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsTyping(true)

        // Simular procesamiento de IA
        setTimeout(() => {
            const botResponse = generateResponse(input)
            const botMsg: Message = {
                id: Date.now() + 1,
                text: botResponse,
                sender: 'bot',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, botMsg])
            setIsTyping(false)
        }, 1500)
    }

    const generateResponse = (query: string): string => {
        const q = query.toLowerCase()

        // Búsqueda simple en base de conocimiento
        if (q.includes('cuenca')) {
            return "Hemos analizado 7 cuencas principales en Córdoba, incluyendo Cuenca Norte-Oeste, Centro y Dique San Roque. Cada una tiene un plan de micro-represas diseñado según su DEM (Modelo de Elevación Digital)."
        }
        if (q.includes('nasa') || q.includes('dato') || q.includes('satélite')) {
            return "Utilizamos datasets de NASA Earthdata, incluyendo Landsat 8/9 para vegetación, MODIS para temperatura y ECOSTRESS para estrés hídrico. Esto nos permite predecir el impacto de El Niño con meses de antelación."
        }
        if (q.includes('costo') || q.includes('dinero') || q.includes('presupuesto')) {
            return "Nuestro modelo distribuido reduce los costos de infraestructura en un 85% comparado con mega-represas centralizadas, además de evitar el costo social y ambiental de inundar grandes valles."
        }
        if (q.includes('tecnología') || q.includes('iot') || q.includes('esp32')) {
            return "La arquitectura tecnológica utiliza nodos IoT basados en ESP32, sensores de nivel y una plataforma web estática resiliente. Todo el procesamiento de datos geoespaciales se hace con QGIS y Python."
        }
        if (q.includes('niño') || q.includes('niña') || q.includes('clima')) {
            return "El Niño trae excesos hídricos e inundaciones a Córdoba, mientras que La Niña provoca sequías severas. Nuestro sistema busca 'atrapar el agua donde cae' para regular ambos extremos."
        }

        return "Esa es una pregunta interesante. Sobre '" + query + "', puedo decirte que nuestro enfoque de gestión hídrica distribuida busca soluciones resilientes y sostenibles. ¿Te gustaría saber más sobre las cuencas o los datos de la NASA?"
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
                                {msg.text}
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
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-water-500 text-white rounded-lg disabled:opacity-50 hover:bg-water-400 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-white/20 mt-3 uppercase tracking-wider font-medium">Powered by NASA Space Apps 2025 Intelligence</p>
                </div>
            </div>
        </>
    )
}
