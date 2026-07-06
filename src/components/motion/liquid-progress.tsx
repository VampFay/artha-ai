"use client";
import { useEffect, useRef, useState } from "react";

/** LiquidProgress — animated horizontal progress bar with shimmer + gradient fill. */
export function LiquidProgress({
  value,
  max = 100,
  height = 8,
  color = "linear-gradient(90deg, #d4a017 0%, #e8c14a 100%)",
  trackColor = "rgba(13,59,46,0.08)",
  duration = 1400,
  showShimmer = true,
  className,
}: {
  value: number;
  max?: number;
  height?: number;
  color?: string;
  trackColor?: string;
  duration?: number;
  showShimmer?: boolean;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        const targetPct = (value / max) * 100;
        const animate = (ts: number) => {
          const t = Math.min(1, (ts - start) / duration);
          setProgress(targetPct * ease(t));
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, max, duration]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden rounded-full ${className || ""}`}
      style={{ height, background: trackColor }}
    >
      <div
        className="h-full rounded-full relative overflow-hidden"
        style={{
          width: `${progress}%`,
          background: color,
          transition: "width 60ms linear",
        }}
      >
        {showShimmer && (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2.4s infinite linear",
            }}
          />
        )}
      </div>
    </div>
  );
}
