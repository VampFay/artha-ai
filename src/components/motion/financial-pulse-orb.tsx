"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "motion/react";

/**
 * FinancialPulseOrb — the signature hero element.
 *
 * A breathing organic SVG orb with:
 *  - Animated gradient fill
 *  - Pulsing aura glow
 *  - Orbiting particles
 *  - Multi-arc radial gauge
 *  - Number counter in center
 *  - Color shifts based on score (low=clay, mid=gold, high=moss)
 */
export function FinancialPulseOrb({
  value,
  max = 100,
  size = 240,
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

  // Score-based color palette
  const palette = useMemo(() => {
    const pct = (value / max) * 100;
    if (pct >= 80) return { primary: "#4a7c59", secondary: "#6fa37e", glow: "rgba(74,124,89,0.5)" };
    if (pct >= 60) return { primary: "#d4a017", secondary: "#e8c14a", glow: "rgba(212,160,23,0.5)" };
    if (pct >= 40) return { primary: "#e8c14a", secondary: "#d4a017", glow: "rgba(232,193,74,0.5)" };
    return { primary: "#c65d3a", secondary: "#e08866", glow: "rgba(198,93,58,0.5)" };
  }, [value, max]);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const duration = 1800;
        const ease = (t: number) => 1 - Math.pow(1 - t, 4);
        const animate = (ts: number) => {
          const t = Math.min(1, (ts - start) / duration);
          setProgress((value / max) * ease(t));
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, max]);

  const radius = (size - 30) / 2;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (progress * circ);

  // Particles - 8 orbiting dots
  const particles = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="orb-container" style={{ width: size, height: size }}>
      {/* Aura glow */}
      <div className="orb-aura" style={{ background: `radial-gradient(circle, ${palette.glow} 0%, transparent 60%)` }} />

      {/* Orbiting particles */}
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = size * 0.55;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        return (
          <motion.div
            key={i}
            className="orb-particle"
            style={{
              width: 4, height: 4,
              background: palette.secondary,
              boxShadow: `0 0 8px ${palette.primary}`,
              ["--px" as any]: `${px}px`,
              ["--py" as any]: `${py}px`,
              animationDelay: `${i * 1}s`,
              animationDuration: `${6 + i}s`,
            }}
          />
        );
      })}

      <svg ref={ref} width={size} height={size} className="-rotate-90 relative z-10">
        <defs>
          <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.secondary} />
            <stop offset="100%" stopColor={palette.primary} />
          </linearGradient>
          <radialGradient id="orbFill" cx="50%" cy="40%">
            <stop offset="0%" stopColor={palette.primary} stopOpacity={0.15} />
            <stop offset="100%" stopColor={palette.primary} stopOpacity={0} />
          </radialGradient>
          <filter id="orbGlow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Inner radial fill */}
        <circle cx={size/2} cy={size/2} r={radius - 6} fill="url(#orbFill)" />

        {/* Decorative inner rings (subtle) */}
        <circle cx={size/2} cy={size/2} r={radius - 14} fill="none" stroke={palette.primary} strokeOpacity={0.08} strokeWidth={1} />
        <circle cx={size/2} cy={size/2} r={radius - 22} fill="none" stroke={palette.primary} strokeOpacity={0.06} strokeWidth={1} strokeDasharray="2 4" />

        {/* Outer track */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={palette.primary}
          strokeOpacity={0.12}
          strokeWidth={2}
        />

        {/* Progress arc — animated */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke="url(#orbGrad)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          filter="url(#orbGlow)"
        />

        {/* Tick marks around the ring */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * Math.PI * 2;
          const r1 = radius + 6;
          const r2 = i % 5 === 0 ? radius + 12 : radius + 9;
          const x1 = size/2 + Math.cos(angle) * r1;
          const y1 = size/2 + Math.sin(angle) * r1;
          const x2 = size/2 + Math.cos(angle) * r2;
          const y2 = size/2 + Math.sin(angle) * r2;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={palette.primary}
              strokeOpacity={i % 5 === 0 ? 0.3 : 0.12}
              strokeWidth={1}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        {label && (
          <span
            className="font-mono font-bold leading-none"
            style={{ fontSize: size * 0.22, color: palette.primary, textShadow: `0 0 20px ${palette.glow}` }}
          >
            {Math.round(progress * (value / (progress || 1)))}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] mt-1 opacity-50 uppercase tracking-wider font-semibold">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
