import { Link } from "react-router";
import { Cpu, Radio, LayoutDashboard, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "./shared";
import { asset } from "@/lib/utils";
import HardwareDiagram from "@/components/HardwareDiagram";

export default function MonitoringTeaserSection() {
  return (
    <section id="electronica" className="section-dark py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-start justify-between gap-5 mb-8">
          <div>
            <SectionHeading icon={Cpu} title="Electrónica y aplicación de monitoreo" />
            <p className="text-white/65 leading-relaxed max-w-3xl -mt-4">
              La parte electrónica del informe (secciones 5, 6 y 8) ahora tiene
              su propio lugar en la web: hardware, firmware y panel de control,
              presentados como <strong className="text-white">prototipo de laboratorio</strong>.
            </p>
          </div>
          <span className="tag-orange">Prototipo · sin despliegue en campo</span>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 mb-6">
          <div className="glass-card p-4 sm:p-5">
            <HardwareDiagram />
          </div>
          <div className="space-y-4">
            <div className="glass-card p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-water-500/15 flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-water-300" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white mb-1">Nodo ESP32-S3</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Nivel (HC-SR04), caudal (YF-S201), temperatura (DS18B20),
                  turbidez (SEN0189) y TDS; compuerta con servo/electroválvula y
                  seguidor solar analógico con LDR. Circuitos simulados en
                  Tinkercad y Proteus.
                </p>
              </div>
            </div>
            <div className="glass-card p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-eco-500/15 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 text-eco-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white mb-1">Firmware y red</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Servidor web embebido en modo Access Point, endpoints{" "}
                  <code className="text-water-300">/data</code> y{" "}
                  <code className="text-water-300">/toggle…</code>, JSON liviano,
                  actualización cada 2 s y códigos de error de sensor.
                </p>
              </div>
            </div>
            <div className="glass-card p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-300/10 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white mb-1">Aplicación de monitoreo</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  Panel de lecturas, estado de compuerta, calidad de agua y
                  volumen acumulado. Hoy es una maqueta: el informe aclara que la
                  interfaz se probó con el microcontrolador sin sensores
                  conectados.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <Link to="/monitoreo" className="btn-primary inline-flex">
            Ver el sistema completo <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link to="/panel" className="btn-secondary inline-flex">
            <LayoutDashboard className="w-4 h-4" /> Abrir panel V4 (demo)
          </Link>
          <div className="w-40 rounded-lg overflow-hidden border border-white/10">
            <img src={asset("/sensor-esp32.jpg")} alt="Ilustración conceptual de un nodo ESP32 con sensores" className="w-full h-20 object-cover" />
          </div>
          <p className="text-xs text-white/40 max-w-sm">
            Ilustración conceptual del nodo. No es una fotografía del prototipo
            construido ni evidencia de mediciones en terreno.
          </p>
        </div>
      </div>
    </section>
  );
}
