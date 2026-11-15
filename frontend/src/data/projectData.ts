// Detailed data for basins (cuencas)
export const cuencasData = [
    {
        id: 1, number: 1, name: "Cuenca Norte-Oeste",
        description: "Localizada en la franja de transición entre el relieve montañoso y las pendientes medias, esta cuenca presenta un patrón de drenaje de tipo dendrítico y un área de captación reducida. Su posición estratégica la hace apta para estructuras de almacenamiento de pequeña escala que pueden regular el flujo estacional y recargar acuíferos subterráneos.",
        lat: -31.35, lng: -64.85, area: "125.5 km²", potential: "high", status: "planned"
    },
    {
        id: 2, number: 2, name: "Cuenca Norte-Este",
        description: "Situada en altitudes intermedias, presenta forma alargada con orientación este-oeste. El relieve circundante es suave, lo que favorece la retención hídrica y reduce el riesgo de erosión acelerada. Ideal para la implementación de sistemas de captación que maximicen la infiltración y minimicen la evaporación.",
        lat: -31.15, lng: -64.35, area: "98.3 km²", potential: "high", status: "planned"
    },
    {
        id: 3, number: 3, name: "Cuenca Centro",
        description: "Ubicada en la zona media del área de estudio, corresponde a una cuenca de extensión moderada con escurrimiento predominantemente estacional. Su emplazamiento sobre laderas suaves ofrece condiciones óptimas para la implementación de microdiques reguladores que puedan abastecer a comunidades rurales y apoyar la agricultura de secano.",
        lat: -31.55, lng: -64.55, area: "156.7 km²", potential: "high", status: "planned"
    },
    {
        id: 4, number: 4, name: "Cuenca Centro-Sur",
        description: "Corresponde a una cuenca alargada ubicada entre áreas de pendiente moderada y zonas de acumulación natural. La morfología favorece la concentración de caudales y permite la regulación de excedentes hídricos durante eventos de lluvia intensa, reduciendo el riesgo de inundaciones aguas abajo.",
        lat: -31.75, lng: -64.45, area: "134.2 km²", potential: "medium", status: "planned"
    },
    {
        id: 5, number: 5, name: "Cuenca Sur-Este",
        description: "De morfología irregular y con una red de drenaje compleja, esta cuenca se encuentra próxima a un cuerpo de agua de gran tamaño, lo que facilita su integración a sistemas de almacenamiento ya existentes. Presenta potencial para la mitigación de crecidas y regulación de caudales, mejorando la resiliencia del sistema hídrico regional.",
        lat: -31.95, lng: -64.25, area: "187.4 km²", potential: "medium", status: "planned"
    },
    {
        id: 6, number: 6, name: "Cuenca Sur-Este Secundaria",
        description: "Ubicada inmediatamente al sur-este de la Cuenca Centro, de tamaño reducido y morfología algo alargada. Se observa un patrón de drenaje intermitente, por lo que su régimen es estacional. Presenta condiciones favorables para soluciones de captación de baja altura que requieren mínima intervención y ofrecen rápido retorno de inversión.",
        lat: -31.85, lng: -64.15, area: "78.6 km²", potential: "low", status: "planned"
    },
    {
        id: 7, number: 7, name: "Dique San Roque",
        description: "Constituye el cuerpo de agua principal de la región, actuando como referencia geográfica y nodo hídrico del sistema. Su interacción con las cuencas adyacentes es clave para el análisis del balance hídrico regional. Nuestro proyecto propone estrategias para optimizar su operación y reducir la sedimentación.",
        lat: -31.405, lng: -64.445, area: "16.5 km²", potential: "high", status: "active"
    },
]

// Centralized paradigm projects expanded
export const centralizedProjects = [
    {
        id: 1, name: 'Proyecto "Segundo San Roque"',
        location: "Cuenca del Rio Suquía",
        description: "Un dique de almacenamiento masivo aguas abajo del embalse San Roque existente.",
        inviabilityReason: "Costos de capital prohibitivos, graves repercusiones socioambientales (inundación de áreas pobladas) y alta complejidad geológica.",
        costIndex: 95, impactIndex: 90, vulnerabilityIndex: 70
    },
    {
        id: 2, name: "Ampliación Dique Los Laureles",
        location: "Cuenca del Arroyo La Cañada",
        description: "Propuestas para aumentar la capacidad del Dique Los Laureles, elevando el paredón o construyendo diques complementarios.",
        inviabilityReason: "Alto impacto en zonas ya urbanizadas de las Sierras Chicas, costos elevados para una ganancia de volumen marginal y no resuelve la dependencia de una única subcuenca.",
        costIndex: 75, impactIndex: 80, vulnerabilityIndex: 65
    },
    {
        id: 3, name: "Acueducto desde el Río Paraná",
        location: "Trasvase de Cuencas (Interprovincial)",
        description: "Un sistema de bombeo para transportar agua a lo largo de cientos de kilómetros desde el Río Paraná.",
        inviabilityReason: "Costos de construcción y operación astronómicos, alta vulnerabilidad estratégica, riesgo de bioinvasión y potenciales conflictos interjurisdiccionales.",
        costIndex: 100, impactIndex: 85, vulnerabilityIndex: 95
    },
    {
        id: 4, name: "Acueducto del Río Ctalamochita",
        location: "Trasvase de Cuencas (Provincial)",
        description: "Un proyecto para desviar agua del río más caudaloso de la provincia, el Río Tercero.",
        inviabilityReason: "Elevados costos de bombeo y el riesgo de comprometer el caudal ecológico y productivo de su propia cuenca.",
        costIndex: 80, impactIndex: 75, vulnerabilityIndex: 80
    },
]

// Fuentes conectadas y fuentes mencionadas como trabajo futuro
export const dataSources = [
    { name: "NASA POWER", type: "Conectada", url: "https://power.larc.nasa.gov", description: "Series mensuales 2000–2025 agregadas a valores anuales para las 42 pruebas de tendencia." },
    { name: "Informe del proyecto", type: "Documental", url: "https://docs.google.com/document/d/11dXRoOLjMCFvs1rITCMewpi3_DfsOlHDD8drtrgiccY/edit?usp=sharing", description: "Procedimiento QGIS, electrónica de laboratorio, presupuesto y límites; no es una serie instrumental." },
    { name: "NDVI / MODIS", type: "Pendiente", url: "https://modis.gsfc.nasa.gov", description: "El informe describe un análisis visual en QGIS; la web aún no publica una serie NDVI reproducible." },
    { name: "GPM IMERG", type: "Pendiente", url: "https://gpm.nasa.gov", description: "Integración futura declarada en public/data/variables.json; no participa en los resultados." },
]

// Ejemplo didáctico, NO un modelo predictivo validado.
// En esta copia legacy el parámetro ENSO no altera la fórmula ilustrativa.
// La atribución ENSO reproducible de la entrega 2026 está en la web activa:
// ONI de NOAA CPC, 504 pruebas y una estación mensual real (/#enso).
export function predictNDVI(precipitation: number, temperature: number, _phenomenon: 'normal' | 'nino' | 'nina') {
    const valorIlustrativo = Math.max(0.1, Math.min(0.9, 0.55 + (precipitation - 100) / 500 + (25 - temperature) / 80))

    let status: string, color: string
    if (valorIlustrativo > 0.65) {
        status = 'Saludable (ejemplo)'; color = 'text-eco-400'
    } else if (valorIlustrativo > 0.4) {
        status = 'Estrés Leve (ejemplo)'; color = 'text-yellow-400'
    } else {
        status = 'Estrés Severo (ejemplo)'; color = 'text-red-400'
    }
    const recommendation = 'Fórmula arbitraria sin calibración, sin imágenes satelitales y sin validación. No usar para decidir riego ni dimensionar obras.'
    return { ndvi: valorIlustrativo, status, recommendation, color }
}

// Paradigm comparison data
export const paradigmComparison = {
    dimensions: ['Costo', 'Impacto Ambiental', 'Vulnerabilidad', 'Resiliencia Climática', 'Sostenibilidad', 'Escalabilidad'],
    centralized: [9, 9, 8, 2, 3, 2],
    distributed: [3, 2, 2, 9, 9, 9],
}

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
    { label: 'Resultados robustos', value: 5, suffix: ' de 42', description: 'Tendencias que sobreviven preblanqueamiento y FDR; todas de temperatura media' },
    { label: 'Cobertura Territorial', value: 7, suffix: ' cuencas', description: '7 cuencas analizadas mediante un punto de grilla representativo por cuenca' },
    { label: 'Pruebas de tendencia', value: 42, suffix: '', description: '42 pruebas de Mann–Kendall con correcciones por autocorrelación y comparaciones múltiples' },
    { label: 'Serie anual', value: 26, suffix: ' años', description: 'Series anuales NASA POWER 2000–2025 en siete puntos de cuenca' },
]

// Timeline data for project milestones
export const projectTimeline = [
    { year: 'Antecedente 2024', title: 'Investigación Inicial', description: 'Estudio de cuencas con QGIS e identificación de problemáticas hídricas; la serie conectada de NASA POWER se descargó en 2026.' },
    { year: '2026 Q1', title: 'Desarrollo de Prototipo', description: 'Diseño y programación del sistema de monitoreo con ESP32. Simulación en Proteus.' },
    { year: '2026 Q2', title: 'NASA Space Apps', description: 'Presentación del proyecto en el NASA Space Apps Challenge 2026. Desarrollo de plataforma web.' },
    { year: '2026-2030', title: 'Implementación Piloto', description: 'Instalación de micro-represas piloto en cuencas prioritarias con monitoreo continuo.' },
    { year: '2030-2050', title: 'Escalamiento Regional', description: 'Expansión del modelo a toda la provincia. Réplica reproducible y red de monitoreo calibrada, sin prometer telemetría en vivo.' },
]

// Knowledge base for AI
export const knowledgeBase = {
    general: [
        "El proyecto 'El Fin de los Niños' propone una red distribuida de micro-represas para gestionar el agua en Córdoba.",
        "Analizamos tendencias retrospectivas 2000–2025 con NASA POWER y sí atribuimos variabilidad a El Niño / La Niña con ONI y una estación real; publicamos escenarios condicionales, no pronósticos operativos.",
        "El presupuesto del informe (ARS 262.430) es una estimación de prototipo, no una comparación de costos de obra validada.",
    ],
    basins: cuencasData.map(c => `${c.name}: ${c.description}`),
    technology: techStack.map(t => `${t.name} (${t.category})`),
    centralized: centralizedProjects.map(p => `${p.name}: ${p.inviabilityReason}`),
}
