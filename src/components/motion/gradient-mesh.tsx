"use client";

/**
 * GradientMesh — animated mesh background.
 * OPTIMIZED: Single layer (was 2), no filter:blur(), transform-only animation.
 */
export function GradientMesh() {
  return (
    <div className="mesh-bg" aria-hidden>
      <div className="mesh-layer" />
    </div>
  );
}
