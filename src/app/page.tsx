"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, Sparkles, ArrowRight, TrendingUp, Target, Calculator } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-400/8 rounded-full blur-3xl" />

      <nav className="relative max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <span className="text-white font-bold text-base">F</span>
          </div>
          <h1 className="text-base font-bold text-slate-900">FinSight AI</h1>
        </div>
        {user ? (
          <Link href="/dashboard"><Button className="bg-emerald-500 hover:bg-emerald-600">Dashboard <ArrowRight className="inline h-4 w-4 ml-1" /></Button></Link>
        ) : (
          <Link href="/login"><Button variant="outline">Sign in</Button></Link>
        )}
      </nav>

      <main className="relative max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium mb-6 animate-slide-up">
          <Sparkles className="h-3.5 w-3.5" />Privacy-first financial intelligence
        </div>
        <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-5 tracking-tight leading-[1.1] animate-slide-up stagger-1">
          Your finances,<br />
          <span className="text-gradient">clearly explained.</span>
        </h2>
        <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up stagger-2">
          Upload your salary slip, Form 16, and bank statement. FinSight AI extracts the data,
          estimates your tax readiness, analyzes your financial health, and generates a CA-ready report.
        </p>
        <div className="flex gap-3 justify-center animate-slide-up stagger-3">
          <Link href={user ? "/dashboard" : "/login"}>
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
              {user ? "Go to Dashboard" : "Get Started — Free"}
              <ArrowRight className="inline h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Bento preview cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-20 text-left">
          {[
            { icon: FileText, title: "Document Intelligence", desc: "Auto-extract fields from PDFs with confidence scores you can verify.", color: "text-emerald-600 bg-emerald-50", stagger: "stagger-4" },
            { icon: Calculator, title: "Tax Readiness Score", desc: "Know exactly which documents are missing and which regime saves you more.", color: "text-sky-600 bg-sky-50", stagger: "stagger-5" },
            { icon: ShieldCheck, title: "Privacy First", desc: "Your data is masked, audit-logged, and deletable. You're always in control.", color: "text-violet-600 bg-violet-50", stagger: "stagger-6" },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className={`glass rounded-2xl p-6 card-hover animate-slide-up ${f.stagger}`}>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 mt-16">FinSight AI does not replace a Chartered Accountant or investment adviser.</p>
      </main>
    </div>
  );
}
