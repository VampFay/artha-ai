"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { consent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function ConsentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    consent.getCurrentText().then((r) => setConsentText(r.consent_text));
    consent.history().then((h) => { if (h.items.some((c) => c.consent_type === "document_processing" && !c.revoked_at)) router.replace("/dashboard"); });
  }, [user, loading, router]);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true); setError("");
    try {
      await consent.accept({ consent_type: "document_processing", consent_text: consentText });
      router.push("/dashboard");
      setTimeout(() => window.location.reload(), 300);
    } catch (err: any) { setError(err.detail || "Failed"); setAccepting(false); }
  };

  if (!mounted || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />
      <Card className="w-full max-w-2xl glass animate-scale-in relative">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
            <div><CardTitle className="text-xl">Your Consent</CardTitle><p className="text-xs text-slate-400">Required before document processing</p></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5"><p className="text-sm text-slate-600 leading-relaxed">{consentText}</p></div>
          <p className="text-xs text-slate-400 mb-5">You can revoke this consent at any time from Settings.</p>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex gap-3">
            <Button onClick={handleAccept} disabled={accepting || !consentText} className="bg-emerald-500 hover:bg-emerald-600">{accepting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Accepting...</> : "Accept and Continue"}</Button>
            <Button variant="outline" onClick={() => { localStorage.removeItem("finsight_token"); router.push("/login"); }}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
