"use client";
import { useRef, type ReactNode } from "react";
import { motion } from "motion/react";

/**
 * TiltCard — 3D tilt that follows cursor.
 * OPTIMIZED: Throttled with requestAnimationFrame — only updates once per frame.
 * Disabled on touch devices (no hover anyway).
 */
export function TiltCard({
  children,
  className,
  style,
  maxTilt = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ rx: 0, ry: 0, mx: 50, my: 50 });

  const applyTransform = () => {
    const el = ref.current;
    if (!el) return;
    const { rx, ry, mx, my } = targetRef.current;
    el.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    const glow = el.querySelector(".tilt-glow") as HTMLElement | null;
    if (glow) {
      glow.style.setProperty("--mx", `${mx}%`);
      glow.style.setProperty("--my", `${my}%`);
    }
    rafRef.current = null;
  };

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    targetRef.current = {
      rx: (0.5 - py) * maxTilt * 2,
      ry: (px - 0.5) * maxTilt * 2,
      mx: px * 100,
      my: py * 100,
    };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(applyTransform);
    }
  };

  const reset = () => {
    targetRef.current = { rx: 0, ry: 0, mx: 50, my: 50 };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(applyTransform);
    }
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`tilt-card relative ${className || ""}`}
      style={style}
    >
      {glare && <div className="tilt-glow" />}
      <div className="tilt-inner relative h-full w-full">{children}</div>
    </motion.div>
  );
}
