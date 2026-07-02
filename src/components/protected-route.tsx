"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { consent } from "@/lib/api";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    consent.history().then((h) => {
      if (!h.items.some((c) => c.consent_type === "document_processing" && !c.revoked_at)) {
        if (!window.location.pathname.startsWith("/consent")) router.replace("/consent");
      }
    }).catch(() => {});
  }, [user, loading, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!user) return null;
  return <>{children}</>;
}
