"use client";
import { useRef, type ReactNode } from "react";

/**
 * CursorSpotlight — radial gradient that follows cursor.
 * OPTIMIZED: Throttled with requestAnimationFrame, sets CSS vars directly (no React state).
 */
export function CursorSpotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const posRef = useRef({ x: 50, y: 50 });

  const apply = () => {
    const el = ref.current;
    if (el) {
      el.style.setProperty("--mx", `${posRef.current.x}%`);
      el.style.setProperty("--my", `${posRef.current.y}%`);
    }
    rafRef.current = null;
  };

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    posRef.current = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(apply);
    }
  };

  return (
    <div ref={ref} onMouseMove={handleMove} className={`spotlight ${className || ""}`}>
      {children}
    </div>
  );
}
