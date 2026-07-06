"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Loader2 } from "lucide-react";
export default function AssistantContent() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = async (q?: string) => {
    const question = q || input;
    if (!question.trim() || loading) return;
    setInput(""); setLoading(true);
    setMessages((m) => [...m, { role: "user", text: question }]);
    try {
      const res = await fetch("/api/assistant/ask", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("finsight_token")}` }, body: JSON.stringify({ question }) });
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.answer || "I couldn't process that request right now." }]);
    } catch { setMessages((m) => [...m, { role: "ai", text: "Connection error. Please try again." }]); }
    finally { setLoading(false); }
  };
  const suggestions = ["Why is my tax readiness score low?", "What documents are missing?", "How can I improve my savings rate?", "Explain my spending pattern."];
  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Assistant</h1><p className="text-sm text-slate-400 mt-0.5">Ask questions about your financial data.</p></div>
      <div className="glass rounded-2xl flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && <div className="text-center py-12"><div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3"><MessageSquare className="h-6 w-6 text-emerald-500" /></div><p className="text-sm text-slate-500">Ask me anything about your finances.</p><p className="text-xs text-slate-400 mt-1">I answer only from your verified data.</p></div>}
          {messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm animate-slide-up ${m.role === "user" ? "bg-emerald-500 text-white rounded-br-sm" : "bg-slate-100 text-slate-700 rounded-bl-sm"}`}>{m.text}</div></div>)}
          {loading && <div className="flex justify-start"><div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3"><Loader2 className="h-4 w-4 animate-spin text-slate-400" /></div></div>}
          <div ref={endRef} />
        </div>
        {messages.length === 0 && <div className="px-5 pb-2 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors">{s}</button>)}</div>}
        <div className="p-4 border-t border-slate-100 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask a question..." className="flex-1 h-10 rounded-lg border border-slate-200 bg-white/50 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="bg-emerald-500 hover:bg-emerald-600"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
