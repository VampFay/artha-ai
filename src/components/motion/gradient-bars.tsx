"use client";
import { useEffect, useRef, useState } from "react";

/** GradientBars — animated horizontal or vertical bar chart with gradient fills + staggered reveal. */
export function GradientBars({
  data,
  orientation = "horizontal",
  height = 140,
  barColor = "#1a1a1a",
  accentColor = "#d97706",
  formatValue = (n: number) => n.toString(),
  formatLabel = (s: string) => s,
}: {
  data: { label: string; value: number; color?: string }[];
  orientation?: "horizontal" | "vertical";
  height?: number;
  barColor?: string;
  accentColor?: string;
  formatValue?: (n: number) => string;
  formatLabel?: (s: string) => string;
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
        const animate = (ts: number) => {
          const t = Math.min(1, (ts - start) / 1200);
          setProgress(ease(t));
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const max = Math.max(...data.map(d => d.value), 1);

  if (orientation === "horizontal") {
    return (
      <div ref={ref} className="space-y-2.5">
        {data.map((d, i) => {
          const w = (d.value / max) * 100 * progress;
          const c = d.color || (i === 0 ? barColor : i === 1 ? "#6b6258" : accentColor);
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-medium w-24 truncate" style={{ color: "var(--color-ink-soft)" }}>
                {formatLabel(d.label)}
              </span>
              <div className="flex-1 h-7 rounded-lg overflow-hidden relative" style={{ background: "var(--color-cream-dark)" }}>
                <div
                  className="h-full rounded-lg flex items-center justify-end pr-2 transition-none relative"
                  style={{
                    width: `${w}%`,
                    background: `linear-gradient(90deg, ${c}cc 0%, ${c} 100%)`,
                    boxShadow: `0 2px 6px -2px ${c}66`,
                  }}
                >
                  {w > 30 && (
                    <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--color-cream)" }}>
                      {formatValue(d.value)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // vertical
  return (
    <div ref={ref} className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30) * progress;
        const c = d.color || (i === 0 ? barColor : accentColor);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--color-ink-soft)" }}>
              {progress > 0.9 ? formatValue(d.value) : ""}
            </span>
            <div className="w-full rounded-t-lg rounded-b-sm relative" style={{
              height: Math.max(2, h),
              background: `linear-gradient(180deg, ${c} 0%, ${c}bb 100%)`,
              boxShadow: `0 4px 12px -4px ${c}66`,
              transition: "height 60ms linear",
            }} />
            <span className="text-[10px] truncate" style={{ color: "var(--color-ink-muted)" }}>
              {formatLabel(d.label)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
