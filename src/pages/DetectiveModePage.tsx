import { SectionHeading } from "@/components/sections/shared";
import DetectiveMode from "@/components/sections/DetectiveMode";
import DetectiveErrorBoundary from "@/components/sections/DetectiveErrorBoundary";
import { Globe } from "lucide-react";

export default function DetectiveModePage() {
  return (
    <div className="min-h-screen">
      <section className="section-dark py-12">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeading
            icon={Globe}
            title="Detective Mode: Tendencias Climáticas"
          />
          <p className="text-white/70 max-w-4xl leading-relaxed mb-8">
            Explora datos anuales NASA POWER archivados (2000-2025) para siete
            cuencas de Córdoba, Argentina. Compara tendencias con dos métodos
            y consulta la procedencia de cada serie.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 pb-16">
        <DetectiveErrorBoundary>
          <DetectiveMode />
        </DetectiveErrorBoundary>
      </div>
    </div>
  );
}
