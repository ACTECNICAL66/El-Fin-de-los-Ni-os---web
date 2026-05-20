// Static data for cuencas (basins)
export const cuencasData = [
    { id: 1, number: 1, name: 'Cuenca Norte', description: 'Localizada en la franja de transición entre el relieve montañoso y las pendientes medias, esta cuenca presenta un patrón de drenaje de tipo dendrítico y un área de captación reducida.', area: '12.4 km²', potential: 'high', status: 'active' },
    { id: 2, number: 2, name: 'Cuenca Noroeste', description: 'Situada en altitudes intermedias, presenta forma alargada con orientación este-oeste. El relieve circundante es suave, lo que favorece la retención hídrica.', area: '18.7 km²', potential: 'high', status: 'monitoring' },
    { id: 3, number: 3, name: 'Cuenca Centro', description: 'Ubicada en la zona media del área de estudio, corresponde a una cuenca de extensión moderada con escurrimiento predominantemente estacional.', area: '25.3 km²', potential: 'medium', status: 'active' },
    { id: 4, number: 4, name: 'Cuenca Suroeste', description: 'Corresponde a una cuenca alargada ubicada entre áreas de pendiente moderada y zonas de acumulación natural.', area: '15.9 km²', potential: 'medium', status: 'planned' },
    { id: 5, number: 5, name: 'Cuenca Sur', description: 'De morfología irregular y con una red de drenaje compleja, esta cuenca se encuentra próxima a un cuerpo de agua de gran tamaño.', area: '31.2 km²', potential: 'high', status: 'active' },
    { id: 6, number: 6, name: 'Cuenca Sureste', description: 'Ubicada inmediatamente al sur-este de la Cuenca Centro, de tamaño reducido y morfología algo alargada.', area: '9.8 km²', potential: 'low', status: 'monitoring' },
    { id: 7, number: 7, name: 'Lago San Roque', description: 'Constituye el cuerpo de agua principal de la región, actuando como referencia geográfica y nodo hídrico del sistema.', area: '15.5 km²', potential: 'high', status: 'active' },
]

// NDVI prediction function (formerly in backend)
export function predictNDVI(precipitation: number, temperature: number, phenomenon: 'normal' | 'nino' | 'nina') {
    const phenomFactor = { nino: 0.08, nina: -0.08, normal: 0 }[phenomenon]
    const predictedNdvi = Math.max(0.1, Math.min(0.9, 0.55 + phenomFactor + (precipitation - 100) / 500 + (25 - temperature) / 80))

    let status: string, recommendation: string, color: string
    if (predictedNdvi > 0.65) {
        status = 'Saludable'; recommendation = 'Condiciones óptimas. Monitoreo regular recomendado.'; color = 'text-eco-400'
    } else if (predictedNdvi > 0.4) {
        status = 'Estrés Leve'; recommendation = 'Riesgo moderado. Considerar riego suplementario.'; color = 'text-yellow-400'
    } else {
        status = 'Estrés Severo'; recommendation = 'Alto riesgo. Medidas de riego urgentes requeridas.'; color = 'text-red-400'
    }
    return { ndvi: predictedNdvi, status, recommendation, color }
}

// Paradigm comparison data (formerly from backend)
export const paradigmComparison = {
    dimensions: ['Costo', 'Impacto Ambiental', 'Vulnerabilidad', 'Resiliencia Climática', 'Sostenibilidad', 'Escalabilidad'],
    centralized: [9, 9, 8, 2, 3, 2],
    distributed: [3, 2, 2, 9, 9, 9],
}

// Centralized paradigm projects
export const centralizedProjects = [
    { id: 1, name: 'Proyecto El Cajón', location: 'Noroeste de Córdoba', description: 'Mega-represa propuesta en la década de 1980 con capacidad de 800 Hm³. Requeriría la inundación de más de 5000 hectáreas de territorio productivo y la relocalización de comunidades enteras.', inviabilityReason: 'Costos estimados superiores a USD 2.000 millones. Alto impacto ambiental en ecosistemas de sierras y ríos. Resistencia comunitaria masiva.', costIndex: 95, impactIndex: 90, vulnerabilityIndex: 85 },
    { id: 2, name: 'Trasvase Río Paraná', location: 'Inter-provincial', description: 'Proyecto de trasvase de agua desde el Río Paraná hacia el interior de Córdoba mediante un acueducto de más de 400 km de longitud.', inviabilityReason: 'Costo estimado superior a USD 5.000 millones. Conflictos jurisdiccionales entre provincias. Impacto ecológico irreversible en el ecosistema fluvial.', costIndex: 98, impactIndex: 85, vulnerabilityIndex: 80 },
    { id: 3, name: 'Ampliación Dique Los Molinos', location: 'Sur de Punilla', description: 'Propuesta de elevar la cota del Dique Los Molinos para aumentar su capacidad en un 40%, requiriendo la inundación de áreas periféricas.', inviabilityReason: 'Afectación de zonas urbanas consolidadas. Impacto en turismo regional. Riesgo sísmico incrementado por mayor volumen de agua.', costIndex: 75, impactIndex: 70, vulnerabilityIndex: 75 },
    { id: 4, name: 'Canal Norte-Sur', location: 'Centro de Córdoba', description: 'Sistema de canales a cielo abierto de más de 200 km para redistribuir agua entre cuencas del norte y sur de la provincia.', inviabilityReason: 'Pérdidas por evaporación estimadas en 35%. Costos de mantenimiento insostenibles. Fragmentación de hábitats terrestres.', costIndex: 80, impactIndex: 82, vulnerabilityIndex: 70 },
]

// Tech stack data
export const techStack = [
    { name: 'C++', category: 'firmware' },
    { name: 'ESP32', category: 'hardware' },
    { name: 'Arduino IDE', category: 'tools' },
    { name: 'Proteus', category: 'tools' },
    { name: 'Google Earth', category: 'geo' },
    { name: 'QGIS', category: 'geo' },
    { name: 'Global Mapper', category: 'geo' },
    { name: 'NASA WorldWind', category: 'geo' },
    { name: 'Python', category: 'programming' },
    { name: 'JavaScript', category: 'programming' },
    { name: 'TypeScript', category: 'programming' },
    { name: 'React', category: 'programming' },
    { name: 'API REST', category: 'programming' },
    { name: 'Sensores IoT', category: 'hardware' },
    { name: 'GitHub', category: 'tools' },
]

// Project efficiency metrics
export const efficiencyMetrics = [
    { label: 'Reducción de Costo vs Centralizado', value: 85, suffix: '%', description: 'Las micro-represas distribuidas cuestan hasta un 85% menos que las mega-represas centralizadas' },
    { label: 'Cobertura Territorial', value: 7, suffix: ' cuencas', description: '7 cuencas hidrográficas monitoreadas simultáneamente con sensores ESP32' },
    { label: 'Anticipación a Eventos', value: 6, suffix: ' meses', description: 'Capacidad de predicción de sequías e inundaciones con 3-6 meses de anticipación' },
    { label: 'Datos Procesados', value: 15, suffix: '+ años', description: 'Más de 15 años de datos climáticos históricos analizados con herramientas SIG' },
]

// Timeline data for project milestones
export const projectTimeline = [
    { year: '2024', title: 'Investigación Inicial', description: 'Análisis de datos NASA, estudio de cuencas con QGIS, identificación de problemáticas hídricas en Córdoba.' },
    { year: '2025 Q1', title: 'Desarrollo de Prototipo', description: 'Diseño y programación del sistema de monitoreo con ESP32. Simulación en Proteus.' },
    { year: '2025 Q2', title: 'NASA Space Apps', description: 'Presentación del proyecto en el NASA Space Apps Challenge 2025. Desarrollo de plataforma web.' },
    { year: '2025-2030', title: 'Implementación Piloto', description: 'Instalación de micro-represas piloto en cuencas prioritarias con monitoreo continuo.' },
    { year: '2030-2050', title: 'Escalamiento Regional', description: 'Expansión del modelo a toda la provincia. Gemelo digital completo del sistema hídrico.' },
]
