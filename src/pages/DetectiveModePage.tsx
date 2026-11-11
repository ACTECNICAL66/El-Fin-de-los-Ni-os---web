import { SectionHeading } from "@/components/sections/shared";
import DetectiveMode from "@/components/sections/DetectiveMode";
import { Globe } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

class DetectiveErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error al mostrar Detective Mode", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="glass-card p-6 text-red-200">
          <h2 className="font-semibold text-lg mb-2">No se pudo mostrar el análisis</h2>
          <p className="text-sm">{this.state.error.message}</p>
          <button className="btn-secondary mt-4" onClick={() => this.setState({ error: null })}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
        <DetectiveErrorBoundary>
          <DetectiveMode />
        </DetectiveErrorBoundary>
      </div>
    </div>
  );
}
