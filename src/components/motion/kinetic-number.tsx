"use client";
import { useEffect, useRef, useState } from "react";

/**
 * KineticNumber — tweens from previous value to next.
 * OPTIMIZED: Single rAF loop with easeOutQuart, but only runs when value changes.
 * No continuous animation (was breathing before — now removed).
 */
export function KineticNumber({
  value,
  duration = 1200,
  format = (n: number) => Math.round(n).toString(),
  className,
  style,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    const from = fromRef.current;
    const to = value;
    if (from === to) { setDisplay(to); return; }

    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic (cheaper than quart)

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      setDisplay(from + (to - from) * ease(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className} style={style}>{format(display)}</span>;
}
