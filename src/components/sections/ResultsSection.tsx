import { Activity, Droplet, Sprout, Bell } from "lucide-react";
import { SectionHeading, InfoCard } from "./shared";

export default function ResultsSection() {
  return (
    <section className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading icon={Activity} title="Qué hicimos con los resultados" />

        <div className="glass-card p-5 mb-8 border-l-4 border-water-500">
          <p className="text-white/70 leading-relaxed text-sm">
            <strong className="text-white">Lectura honesta de la entrega 2026:</strong>{" "}
            el análisis produce 42 pruebas de tendencia, un mapa comparativo de
            puntos y una tabla de robustez. Tras corregir autocorrelación y
            comparaciones múltiples, sobreviven 5 resultados (todos de
            temperatura media) y ninguna tendencia de precipitación. Las
            estrategias de abajo son <em>líneas de trabajo</em>, no efectos ya
            demostrados por estas series.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <InfoCard icon={Droplet} title="Operación basada en evidencia">
            Diseñar protocolos de operación de embalses requiere series locales
            validadas. Hoy solo podemos proponer qué medir y dónde: nivel,
            caudal, precipitación y temperatura en las cuencas con señales
            robustas.
          </InfoCard>
          <InfoCard icon={Sprout} title="Agricultura y riego">
            Las proyecciones de demanda y las recomendaciones de riego eficiente
            provienen del informe y su bibliografía; no son un resultado de las
            42 pruebas. Se presentan como contexto de planificación.
          </InfoCard>
          <InfoCard icon={Bell} title="Monitoreo y alertas">
            Un sistema de alerta combinaría datos satelitales con observaciones
            locales. El prototipo ESP32 y su panel son una maqueta de
            laboratorio: todavía no generan series ni alertas operativas.
          </InfoCard>
        </div>

        <div className="bg-gradient-to-br from-water-600 to-nasa-deep rounded-2xl p-10 text-center border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Objetivo del trabajo</h2>
          <p className="text-white/70 max-w-3xl mx-auto leading-relaxed">
            Convertir una pregunta climática local en un análisis reproducible,
            publicar sus límites estadísticos y espaciales, y recién entonces
            proponer tecnología. Los datos, los scripts y las correcciones están
            abiertos para que otra escuela o un ente de gestión pueda replicarlos.
          </p>
        </div>
      </div>
    </section>
  );
}
