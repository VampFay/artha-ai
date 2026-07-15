"use client";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Animated gradient */}
      <motion.div
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, rgba(245,158,11,0.06) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, rgba(245,158,11,0.06) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, rgba(245,158,11,0.06) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ zIndex: 1, textAlign: "center", maxWidth: "500px" }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "40px" }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "12px",
            background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "24px", color: "#0F172A",
          }}>A</div>
          <span style={{ fontFamily: "monospace", fontSize: "20px", letterSpacing: "4px", textTransform: "uppercase", color: "#f59e0b" }}>ARTHA</span>
        </div>

        {/* Big 404 */}
        <motion.h1
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            fontSize: "6rem", fontWeight: 200,
            letterSpacing: "-0.05em", color: "#f59e0b",
            marginBottom: "16px", fontFamily: "monospace",
          }}
        >
          404
        </motion.h1>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 300, marginBottom: "12px", color: "#fff" }}>
          This page took a tax holiday.
        </h2>

        <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginBottom: "32px", lineHeight: 1.6 }}>
          The page you're looking for doesn't exist —
          <br />
          perhaps it filed for an extension.
        </p>

        <button
          onClick={() => window.location.href = "/"}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "12px 28px", borderRadius: "12px",
            background: "#f59e0b", color: "#0F172A",
            border: "none", fontSize: "0.8rem", fontWeight: 700,
            letterSpacing: "0.05em", textTransform: "uppercase",
            cursor: "pointer", transition: "all 0.2s",
          }}
        >
          ← Back to Safety
        </button>
      </motion.div>
    </div>
  );
}
