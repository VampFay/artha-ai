"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import AppShell from "@/components/app-shell";
import LoginScreen from "@/views/LoginScreen";
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/types";

export default function Home() {
  const { user, loading } = useAuth();
  const { navigate } = useNav();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#111111]">
          <span className="font-serif italic text-xl text-saffron">A</span>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-saffron" />
      </motion.div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={() => {}} />;

  return <AppShell><div /></AppShell>;
}
