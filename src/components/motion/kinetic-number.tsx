"use client";
import { useEffect, useRef, useState } from "react";

/**
 * KineticNumber — huge number that tweens with easing + a subtle variable-weight breathing.
 */
export function KineticNumber({
  value,
  duration = 1500,
  format = (n: number) => Math.round(n).toString(),
  className,
  style,
  breathe = true,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  style?: React.CSSProperties;
  breathe?: boolean;
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

    const ease = (t: number) => 1 - Math.pow(1 - t, 4); // easeOutQuart

    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const next = from + (to - from) * ease(t);
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span
      className={`${breathe ? "kinetic" : ""} ${className || ""}`}
      style={style}
    >
      {format(display)}
    </span>
  );
}
