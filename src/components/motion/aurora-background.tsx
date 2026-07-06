"use client";

/**
 * AuroraBackground — alias for GradientMesh (the upgraded animated mesh background).
 * Kept for backward compatibility with existing imports.
 */
export function AuroraBackground() {
  // Lazy import to avoid circular deps
  const { GradientMesh } = require("./gradient-mesh");
  return <GradientMesh />;
}
