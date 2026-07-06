"use client";
import { useEffect, useRef, useState } from "react";

/** Sparkline — animated mini line chart, perfect for bento metric cards. */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "#d4a017",
  fill = true,
  strokeWidth = 1.5,
  duration = 1200,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  strokeWidth?: number;
  duration?: number;
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
          setProgress(ease(t));
          if (t < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [duration]);

  if (!data || data.length < 2) return null;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => ({
    x: pad + i * step,
    y: pad + h - ((d - min) / range) * h,
  }));

  // Build full path then partially reveal based on progress
  const fullPath = pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const revealCount = Math.max(1, Math.floor(progress * (data.length - 1)) + 1);
  const visiblePts = pts.slice(0, revealCount);
  const partialPath = visiblePts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");

  const lastPt = visiblePts[visiblePts.length - 1];
  const fillPath = `${partialPath} L ${lastPt.x} ${height - pad} L ${pad} ${height - pad} Z`;
  const gradId = `spark-${color.replace("#","")}`;

  return (
    <svg ref={ref} width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && progress > 0.05 && <path d={fillPath} fill={`url(#${gradId})`} />}
      <path d={partialPath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {progress > 0.95 && (
        <circle cx={lastPt.x} cy={lastPt.y} r={2.5} fill={color} className="animate-breathe" />
      )}
    </svg>
  );
}
