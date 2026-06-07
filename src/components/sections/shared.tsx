import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
export function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);

  return { count, ref };
}

export function StatCard({
  number,
  label,
  suffix = "",
}: {
  number: number;
  label: string;
  suffix?: string;
}) {
  const { count, ref } = useCountUp(number);
  return (
    <div
      ref={ref}
      className="bg-white rounded-xl p-6 shadow-lg text-center min-w-[180px] hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
    >
      <span className="font-montserrat font-bold text-4xl text-[#0B3D91] block">
        {count}
        {suffix}
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-2 block">
        {label}
      </span>
    </div>
  );
}

export function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: ElementType;
  title: string;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-3xl font-bold text-[#0B3D91] flex items-center gap-3">
        <Icon className="w-8 h-8" />
        {title}
      </h2>
      <div className="w-24 h-1 bg-[#0B3D91]/20 mt-3 rounded-full" />
    </div>
  );
}

export function InfoCard({
  icon: Icon,
  title,
  children,
  accent = "#0B3D91",
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl p-8 shadow-md hover:-translate-y-2 hover:shadow-xl transition-all duration-300"
      style={{ borderLeft: `5px solid ${accent}` }}
    >
      <h3 className="text-xl font-bold text-[#0B3D91] mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: accent }} />
        {title}
      </h3>
      <div className="text-slate-600 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function BulletList({
  items,
  color,
}: {
  items: { icon: ElementType; text: string }[];
  color: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <li key={i} className="flex items-start gap-2">
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
            <span className="text-slate-600 text-sm">{item.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
