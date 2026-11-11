import { Component, type ErrorInfo, type ReactNode } from "react";

export default class DetectiveErrorBoundary extends Component<
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
