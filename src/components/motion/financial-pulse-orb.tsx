"use client";
import { useEffect, useRef, useState, useMemo } from "react";

/**
 * FinancialPulseOrb — signature hero element.
 * OPTIMIZED:
 *  - Reduced tick marks from 60 to 24 (60% fewer SVG nodes)
 *  - Removed 8 orbiting particle motion.divs (was 8 infinite animations)
 *  - Removed SVG gaussian blur filter (was expensive on every paint)
 *  - Single aura div instead of layered glows
 *  - CSS transition for arc instead of rAF loop
 */
export function FinancialPulseOrb({
  value,
  max = 100,
  size = 220,
  label,
  sublabel,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const [progress, setProgress] = useState(0);
  const ref = useRef<SVGSVGElement>(null);

  const palette = useMemo(() => {
    const pct = (value / max) * 100;
    if (pct >= 80) return { primary: "#6b6258", secondary: "#8f8678", glow: "rgba(107,98,88,0.4)" };
    if (pct >= 60) return { primary: "#d97706", secondary: "#f59e0b", glow: "rgba(217,119,6,0.4)" };
    if (pct >= 40) return { primary: "#f59e0b", secondary: "#d97706", glow: "rgba(245,158,11,0.4)" };
    return { primary: "#b91c1c", secondary: "#dc2626", glow: "rgba(185,28,28,0.4)" };
  }, [value, max]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Single CSS transition handles the animation (compositor-friendly)
        requestAnimationFrame(() => setProgress(value / max));
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, max]);

  const radius = (size - 30) / 2;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (progress * circ);

  return (
    <div className="orb-container" style={{ width: size, height: size }}>
      {/* Single aura layer (was 3 before) */}
      <div className="orb-aura" style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 60%)` }} />

      <svg ref={ref} width={size} height={size} className="-rotate-90 relative z-10">
        <defs>
          <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.secondary} />
            <stop offset="100%" stopColor={palette.primary} />
          </linearGradient>
        </defs>

        {/* Outer track */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={palette.primary} strokeOpacity={0.12} strokeWidth={2} />

        {/* Progress arc — CSS transition, no rAF */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke="url(#orbGrad)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
        />

        {/* Tick marks — reduced from 60 to 24 */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const r1 = radius + 6;
          const r2 = i % 3 === 0 ? radius + 11 : radius + 8;
          const x1 = size/2 + Math.cos(angle) * r1;
          const y1 = size/2 + Math.sin(angle) * r1;
          const x2 = size/2 + Math.cos(angle) * r2;
          const y2 = size/2 + Math.sin(angle) * r2;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.primary} strokeOpacity={i % 3 === 0 ? 0.3 : 0.12} strokeWidth={1} />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        {label !== undefined && (
          <span className="font-mono font-bold leading-none" style={{ fontSize: size * 0.26, color: palette.primary }}>
            {Math.round(progress * max)}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] mt-1 opacity-50 uppercase tracking-wider">{sublabel}</span>
        )}
      </div>
    </div>
  );
}
