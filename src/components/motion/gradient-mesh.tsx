"use client";

/**
 * GradientMesh — animated multi-radial gradient mesh background (upgrade from aurora).
 */
export function GradientMesh() {
  return (
    <div className="mesh-bg" aria-hidden>
      <div className="mesh-layer" />
      <div className="mesh-layer-2" />
    </div>
  );
}
