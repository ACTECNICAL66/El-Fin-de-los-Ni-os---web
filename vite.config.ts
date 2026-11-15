import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
/**
 * kimi-plugin-inspect-react solo agrega atributos de inspeccion en desarrollo.
 * Si el paquete o su cadena de Babel no esta disponible, el build debe seguir.
 */
let inspectAttr: (() => any) | null = null
try {
  // @ts-expect-error modulo opcional de desarrollo
  const mod = await import('kimi-plugin-inspect-react-shim')
  inspectAttr = mod.inspectAttr
} catch {
  inspectAttr = null
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL || "/El-Fin-de-los-Ni-os---web/",
  plugins: [
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    ...(inspectAttr ? [inspectAttr()] : []), react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      "db": path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
