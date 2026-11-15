import { useEffect, useState } from "react";
import { cargarAnalisis, type DatosAnalisis } from "@/lib/analisis";

export function useAnalisis() {
  const [datos, setDatos] = useState<DatosAnalisis | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    cargarAnalisis()
      .then(result => {
        if (activo) {
          setDatos(result);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (activo) setError(err.message || "No se pudieron cargar los datos.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  return { datos, cargando, error };
}
