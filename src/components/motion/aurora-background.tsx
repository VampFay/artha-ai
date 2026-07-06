"use client";

/** AuroraBackground — fixed background with 3 floating gradient blobs + noise overlay. */
export function AuroraBackground() {
  return (
    <div className="aurora-bg" aria-hidden>
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
    </div>
  );
}
