"use client";
import { useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";

/**
 * MagneticButton — attracts toward cursor with spring physics.
 * The inner content translates a fraction of the cursor's offset.
 */
export function MagneticButton({
  children,
  strength = 0.35,
  className,
  onClick,
  disabled,
  type = "button",
  style,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent) => {
    if (disabled) return;
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    setPos({ x: dx * strength, y: dy * strength });
  };

  const reset = () => setPos({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 280, damping: 18, mass: 0.6 }}
      whileTap={{ scale: 0.96 }}
      className={className}
      style={style}
    >
      {children}
    </motion.button>
  );
}
