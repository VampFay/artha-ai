"use client";
import { motion } from "motion/react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";

export default function Error() {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Animated background gradient */}
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, rgba(245,158,11,0.08) 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, rgba(245,158,11,0.08) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 80%, rgba(245,158,11,0.08) 0%, transparent 50%)",
                "radial-gradient(circle at 20% 50%, rgba(245,158,11,0.08) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
          />

          {/* Floating currency symbols */}
          {["₹", "$", "€", "£", "¥"].map((symbol, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                opacity: [0.05, 0.15, 0.05],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                left: `${15 + i * 18}%`,
                top: `${20 + (i % 3) * 25}%`,
                fontSize: "3rem",
                color: "#f59e0b",
                zIndex: 0,
                pointerEvents: "none",
              }}
            >
              {symbol}
            </motion.div>
          ))}

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ zIndex: 1, textAlign: "center", maxWidth: "500px" }}
          >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "32px" }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold", fontSize: "24px", color: "#0F172A",
                boxShadow: "0 0 20px rgba(245,158,11,0.3)",
              }}>A</div>
              <span style={{ fontFamily: "monospace", fontSize: "20px", letterSpacing: "4px", textTransform: "uppercase", color: "#f59e0b" }}>ARTHA</span>
            </div>

            {/* Animated glitch icon */}
            <motion.div
              animate={{
                rotate: [0, -5, 5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ marginBottom: "24px" }}
            >
              <AlertTriangle size={64} color="#f59e0b" strokeWidth={1.5} />
            </motion.div>

            <h1 style={{
              fontSize: "2rem", fontWeight: 300, letterSpacing: "-0.02em",
              marginBottom: "8px", color: "#fff",
            }}>
              Well, that wasn't supposed to happen.
            </h1>

            <p style={{
              fontSize: "0.95rem", color: "#94a3b8",
              marginBottom: "32px", lineHeight: 1.6,
            }}>
              Our wealth intelligence engine hit an unexpected snag.
              <br />
              Don't worry — your data is safe. We're already on it.
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 28px", borderRadius: "12px",
                  background: "#f59e0b", color: "#0F172A",
                  border: "none", fontSize: "0.8rem", fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,158,11,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <RefreshCw size={16} /> Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 28px", borderRadius: "12px",
                  background: "transparent", color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "0.8rem", fontWeight: 700,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  cursor: "pointer", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#94a3b8"; }}
              >
                <Home size={16} /> Go Home
              </button>
            </div>

            {/* Status indicator */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ marginTop: "40px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              <span style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Investigating — Check back in a moment
              </span>
            </motion.div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
