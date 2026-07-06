"use client";
import { useEffect, useRef, useState } from "react";

/** ProgressRing — animated SVG circular progress. */
export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = "#d4a017",
  trackColor = "rgba(255,255,255,0.1)",
  label,
  sublabel,
  duration = 1400,
  glow = true,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  duration?: number;
  glow?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        const animate = (ts: number) => {
          const t = Math.min(1, (ts - start) / duration);
          setProgress((value / max) * ease(t));
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, max, duration]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress * circumference);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`ringGrad-${color.replace("#","")}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={`url(#ringGrad-${color.replace("#","")})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={glow ? { filter: `drop-shadow(0 0 6px ${color}66)` } : {}}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="font-mono font-bold leading-none" style={{ fontSize: size * 0.26 }}>{label}</span>}
        {sublabel && <span className="text-[10px] mt-1 opacity-50 uppercase tracking-wider">{sublabel}</span>}
      </div>
    </div>
  );
}
