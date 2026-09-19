"use client";
import { motion } from "motion/react";

/**
 * NumberTicker — scrolling marquee of live stats.
 */
export function NumberTicker({
  items,
  speed = 30,
}: {
  items: { label: string; value: string; trend?: "up" | "down" }[];
  speed?: number;
}) {
  // Duplicate items to create seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="marquee">
      <div
        className="ticker"
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="ticker-item text-xs">
            <span className="opacity-50 uppercase tracking-wider text-[10px] font-semibold">{item.label}</span>
            <span
              className="font-bold"
              style={{
                color: item.trend === "down" ? "var(--color-clay)" : item.trend === "up" ? "var(--color-moss)" : "var(--color-forest)",
              }}
            >
              {item.trend === "up" ? "▲" : item.trend === "down" ? "▼" : "•"} {item.value}
            </span>
            <span className="opacity-20">|</span>
          </div>
        ))}
      </div>
    </div>
  );
}
