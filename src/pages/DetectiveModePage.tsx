import { SectionHeading } from "@/components/sections/shared";
import DetectiveMode from "@/components/sections/DetectiveMode";
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
            Analiza los datos de NASA POWER (2000-2025) para las 7 cuencas de
            Córdoba. Calcula la pendiente de Sen y el test de Mann-Kendall para
            determinar la significancia estadística de las tendencias
            climáticas.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 pb-16">
        <DetectiveMode />
      </div>
    </div>
  );
}