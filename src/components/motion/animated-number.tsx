"use client";
import { useEffect, useRef, useState } from "react";

/** AnimatedNumber — tweens from previous value to next value with easing. */
export function AnimatedNumber({
  value,
  duration = 1100,
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

    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

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

  return <span className={className} style={style}>{format(display)}</span>;
}
