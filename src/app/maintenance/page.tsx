"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export default function MaintenancePage() {
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  const maintenanceMessages = [
    "Polishing the tax engine... 🧮",
    "Teaching AI new tax sections... 🤖",
    "Counting rupees... really fast... 💸",
    "Aligning compliance calendars... 📅",
    "Encrypting your data (again)... 🔐",
    "Arguing with the GST portal... 😤",
    "Teaching GST about ITC... 📚",
    "Bribing the server hamsters... 🐹",
    "Updating tax rates (don't tell CBDT)... 🤫",
    "Sharpening the audit chain... ⛓️",
  ];

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % maintenanceMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
          {/* Animated gradient background */}
          <motion.div
            animate={{
              background: [
                "radial-gradient(circle at 30% 50%, rgba(245,158,11,0.06) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 50%, rgba(245,158,11,0.06) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 30%, rgba(245,158,11,0.06) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 50%, rgba(245,158,11,0.06) 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
          />

          {/* Floating currency symbols */}
          {["₹", "$", "€", "£", "¥", "₽"].map((symbol, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -40, 0],
                x: [0, i % 2 === 0 ? 15 : -15, 0],
                opacity: [0.03, 0.12, 0.03],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                delay: i * 0.7,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                left: `${10 + i * 15}%`,
                top: `${15 + (i % 3) * 30}%`,
                fontSize: "2.5rem",
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
            style={{ zIndex: 1, textAlign: "center", maxWidth: "520px" }}
          >
            {/* Logo with rotating animation */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "40px" }}>
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "bold", fontSize: "26px", color: "#0F172A",
                  boxShadow: "0 0 20px rgba(245,158,11,0.3)",
                }}
              >
                A
              </motion.div>
              <span style={{ fontFamily: "monospace", fontSize: "22px", letterSpacing: "4px", textTransform: "uppercase", color: "#f59e0b" }}>
                ARTHA
              </span>
            </div>

            {/* Animated spinning wrench icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ marginBottom: "32px", display: "flex", justifyContent: "center" }}
            >
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </motion.div>

            <h1 style={{
              fontSize: "2.2rem", fontWeight: 300, letterSpacing: "-0.02em",
              marginBottom: "12px", color: "#fff",
            }}>
              We're sprucing things up.
            </h1>

            <p style={{
              fontSize: "0.95rem", color: "#94a3b8",
              marginBottom: "24px", lineHeight: 1.6,
            }}>
              Artha AI is undergoing scheduled maintenance to bring you
              even better tax intelligence. We'll be back shortly.
            </p>

            {/* Rotating playful message */}
            <motion.div
              key={msgIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                marginBottom: "32px",
                padding: "16px 24px",
                borderRadius: "12px",
                background: "rgba(245,158,11,0.05)",
                border: "1px solid rgba(245,158,11,0.15)",
                fontSize: "0.9rem",
                color: "#fbbf24",
                fontStyle: "italic",
              }}
            >
              {maintenanceMessages[msgIndex]}
            </motion.div>

            {/* Countdown timer */}
            <div style={{ marginBottom: "32px" }}>
              <p style={{
                fontSize: "0.7rem", color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.15em",
                marginBottom: "8px",
              }}>
                Estimated time remaining
              </p>
              <motion.div
                key={`${minutes}-${seconds}`}
                initial={{ scale: 0.95, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: "2.5rem", fontWeight: 200,
                  fontFamily: "monospace", color: "#f59e0b",
                  letterSpacing: "0.05em",
                }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </motion.div>
            </div>

            {/* Progress bar */}
            <div style={{
              width: "100%", height: "4px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "2px", overflow: "hidden",
              marginBottom: "32px",
            }}>
              <motion.div
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)",
                  borderRadius: "2px",
                }}
              />
            </div>

            {/* Status */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
            >
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#fbbf24", display: "inline-block",
                boxShadow: "0 0 8px rgba(251,191,36,0.6)",
              }} />
              <span style={{
                fontSize: "0.7rem", color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                Maintenance in progress — All systems being upgraded
              </span>
            </motion.div>

            {/* Footer */}
            <p style={{
              marginTop: "40px", fontSize: "0.7rem",
              color: "#475569", textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              Need urgent help? Email support@artha.ai
            </p>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
