"use client";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondary,
  personalization,
}: {
  illustration: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  secondary?: { label: string; onClick: () => void };
  personalization?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      {/* Illustration */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 16 }}
        className="relative mb-6"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {illustration}
        </motion.div>
        {/* Glow */}
        <motion.div
          className="absolute inset-0 -z-10 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(217,119,6,0.15) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {personalization && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[10px] uppercase tracking-wider font-bold mb-2"
          style={{ color: "var(--color-gold)" }}
        >
          {personalization}
        </motion.p>
      )}

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-xl font-bold mb-2"
        style={{ color: "var(--color-ink)", letterSpacing: "-0.02em" }}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm leading-relaxed max-w-sm mb-6"
        style={{ color: "var(--color-ink-muted)" }}
      >
        {description}
      </motion.p>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3 flex-wrap justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            className="h-11 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 shine-sweep"
            style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(26,26,26,0.4)" }}
          >
            {action.icon}
            {action.label}
          </motion.button>
          {secondary && (
            <button
              onClick={secondary.onClick}
              className="h-11 px-5 rounded-xl text-sm font-medium"
              style={{ color: "var(--color-forest)", background: "rgba(26,26,26,0.04)", border: "1px solid rgba(26,26,26,0.1)" }}
            >
              {secondary.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ============= SVG ILLUSTRATIONS ============= */

export function IllusDocuments() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="docGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#2e2e2e" />
        </linearGradient>
        <linearGradient id="docGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Back page */}
      <rect x="30" y="20" width="50" height="64" rx="6" fill="url(#docGrad1)" opacity="0.4" transform="rotate(-8 55 52)" />
      {/* Front page */}
      <rect x="35" y="25" width="50" height="64" rx="6" fill="url(#docGrad1)" transform="rotate(3 60 57)" />
      {/* Lines on page */}
      <rect x="42" y="35" width="32" height="2.5" rx="1.25" fill="#d97706" opacity="0.6" transform="rotate(3 60 57)" />
      <rect x="42" y="44" width="36" height="2" rx="1" fill="#faf7f2" opacity="0.3" transform="rotate(3 60 57)" />
      <rect x="42" y="52" width="28" height="2" rx="1" fill="#faf7f2" opacity="0.3" transform="rotate(3 60 57)" />
      <rect x="42" y="60" width="32" height="2" rx="1" fill="#faf7f2" opacity="0.3" transform="rotate(3 60 57)" />
      {/* Upload arrow circle */}
      <motion.circle
        cx="85" cy="40" r="14" fill="url(#docGrad2)"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <path d="M85 35 L85 45 M80 40 L85 35 L90 40" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IllusGoals() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Outer rings */}
      <circle cx="60" cy="60" r="42" stroke="#1a1a1a" strokeWidth="2" strokeDasharray="4 6" opacity="0.2" />
      <circle cx="60" cy="60" r="32" stroke="#6b6258" strokeWidth="2" strokeDasharray="2 4" opacity="0.3" />
      {/* Target center */}
      <circle cx="60" cy="60" r="22" fill="url(#goalGrad)" opacity="0.2" />
      <circle cx="60" cy="60" r="16" fill="url(#goalGrad)" opacity="0.4" />
      <circle cx="60" cy="60" r="10" fill="url(#goalGrad)" />
      <circle cx="60" cy="60" r="4" fill="#1a1a1a" />
      {/* Arrow */}
      <motion.g
        initial={{ rotate: -45, originX: "60px", originY: "60px" }}
        animate={{ rotate: [-45, -40, -45] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="60" y1="60" x2="95" y2="25" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
        <polygon points="95,25 88,28 92,32" fill="#1a1a1a" />
      </motion.g>
    </svg>
  );
}

export function IllusChat() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="chatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#2e2e2e" />
        </linearGradient>
      </defs>
      {/* Speech bubble */}
      <path
        d="M25 35 Q25 25 35 25 L85 25 Q95 25 95 35 L95 65 Q95 75 85 75 L50 75 L35 88 L38 75 Q25 75 25 65 Z"
        fill="url(#chatGrad)"
      />
      {/* Sparkles inside */}
      <motion.g
        animate={{ scale: [0.8, 1, 0.8], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 50px" }}
      >
        <path d="M60 42 L62 48 L68 50 L62 52 L60 58 L58 52 L52 50 L58 48 Z" fill="#f59e0b" />
      </motion.g>
      {/* Dots */}
      <circle cx="42" cy="50" r="2.5" fill="#faf7f2" opacity="0.5" />
      <circle cx="50" cy="50" r="2.5" fill="#faf7f2" opacity="0.7" />
      {/* Floating sparkles */}
      <motion.circle cx="100" cy="30" r="3" fill="#d97706"
        animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle cx="105" cy="60" r="2" fill="#f59e0b"
        animate={{ y: [0, -6, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
      />
    </svg>
  );
}

export function IllusReports() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="repGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#2e2e2e" />
        </linearGradient>
      </defs>
      {/* Clipboard */}
      <rect x="30" y="25" width="60" height="75" rx="6" fill="url(#repGrad)" />
      <rect x="45" y="20" width="30" height="10" rx="3" fill="#d97706" />
      {/* Bars */}
      <motion.rect x="40" y="65" width="10" height="20" rx="2" fill="#d97706"
        animate={{ height: [20, 28, 20] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect x="55" y="55" width="10" height="30" rx="2" fill="#f59e0b"
        animate={{ height: [30, 38, 30] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.2, ease: "easeInOut" }}
      />
      <motion.rect x="70" y="50" width="10" height="35" rx="2" fill="#6b6258"
        animate={{ height: [35, 42, 35] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.4, ease: "easeInOut" }}
      />
      {/* Lines */}
      <rect x="40" y="40" width="40" height="2" rx="1" fill="#faf7f2" opacity="0.4" />
    </svg>
  );
}

export function IllusTransactions() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="walletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#2e2e2e" />
        </linearGradient>
      </defs>
      {/* Wallet */}
      <rect x="25" y="35" width="70" height="50" rx="8" fill="url(#walletGrad)" />
      <rect x="25" y="35" width="70" height="14" rx="8" fill="#d97706" opacity="0.3" />
      {/* Card slot */}
      <rect x="65" y="50" width="30" height="20" rx="3" fill="#d97706" />
      <circle cx="75" cy="60" r="3" fill="#1a1a1a" />
      {/* Coins */}
      <motion.circle cx="40" cy="55" r="6" fill="#f59e0b"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle cx="50" cy="68" r="4" fill="#d97706"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
      />
    </svg>
  );
}
