"use client";
import { useRef, type ReactNode } from "react";

/**
 * CursorSpotlight — wraps content with a radial gradient that follows cursor.
 */
export function CursorSpotlight({
  children,
  className,
  radius = 240,
  color = "rgba(212,160,23,0.10)",
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      className={`spotlight ${className || ""}`}
      style={{ ["--spotlight-radius" as any]: `${radius}px`, ["--spotlight-color" as any]: color }}
    >
      {children}
    </div>
  );
}
