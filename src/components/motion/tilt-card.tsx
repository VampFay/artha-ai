"use client";
import { useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";

/**
 * TiltCard — 3D tilt that follows cursor, with parallax inner content
 * and a cursor-following glow.
 */
export function TiltCard({
  children,
  className,
  style,
  maxTilt = 10,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;  // 0..1
    const py = (e.clientY - rect.top) / rect.height;  // 0..1
    const tiltX = (0.5 - py) * maxTilt * 2; // -maxTilt..maxTilt
    const tiltY = (px - 0.5) * maxTilt * 2;
    setTransform(`perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(0)`);
    setGlarePos({ x: px * 100, y: py * 100 });
  };

  const reset = () => {
    setTransform("perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0)");
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className={`tilt-card relative ${className || ""}`}
      style={{
        transform,
        ...style,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {glare && (
        <div
          className="tilt-glow"
          style={{ ["--mx" as any]: `${glarePos.x}%`, ["--my" as any]: `${glarePos.y}%` }}
        />
      )}
      <div className="tilt-inner relative h-full w-full">{children}</div>
    </motion.div>
  );
}
