"use client";
import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
export default function AssistantContent() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState(""); const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const send = async (q?: string) => { const question = q || input; if (!question.trim() || loading) return; setInput(""); setLoading(true); setMessages(m => [...m, { role: "user", text: question }]); try { const res = await fetch("/api/assistant/ask", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("finsight_token")}` }, body: JSON.stringify({ question }) }); const data = await res.json(); setMessages(m => [...m, { role: "ai", text: data.answer || "I couldn't process that." }]); } catch { setMessages(m => [...m, { role: "ai", text: "Connection error." }]); } finally { setLoading(false); } };
  const suggestions = ["Why is my tax score low?", "What documents are missing?", "How can I improve savings?", "Explain my spending."];
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="animate-slide-up"><p className="text-caption mb-1">AI-Powered</p><h1 className="text-heading">Financial Assistant</h1></div>
      <div className="bento bento-light flex flex-col h-[calc(100vh-260px)] min-h-[400px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && <div className="text-center py-12"><div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(13,59,46,0.06)" }}><MessageSquare className="h-6 w-6" style={{ color: "var(--color-forest)" }} /></div><p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>Ask me anything about your finances.</p><p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>I answer only from your verified data.</p></div>}
          {messages.map((m, i) => <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm animate-slide-up" style={m.role === "user" ? { background: "var(--color-forest)", color: "var(--color-cream)", borderBottomRightRadius: "4px" } : { background: "var(--color-cream-dark)", color: "var(--color-ink-soft)", borderBottomLeftRadius: "4px" }}>{m.text}</div></div>)}
          {loading && <div className="flex justify-start"><div className="rounded-2xl px-4 py-3" style={{ background: "var(--color-cream-dark)", borderBottomLeftRadius: "4px" }}><Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-ink-muted)" }} /></div></div>}
          <div ref={endRef} />
        </div>
        {messages.length === 0 && <div className="px-5 pb-2 flex flex-wrap gap-2">{suggestions.map(s => <button key={s} onClick={() => send(s)} className="text-xs px-3 py-1.5 rounded-full transition-all duration-200" style={{ background: "rgba(13,59,46,0.06)", color: "var(--color-forest)" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(13,59,46,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(13,59,46,0.06)"}>{s}</button>)}</div>}
        <div className="p-4 flex gap-2" style={{ borderTop: "1px solid var(--color-line-soft)" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask a question..." className="flex-1 h-10 rounded-lg border px-3 text-sm outline-none transition-all" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }} onFocus={e => { e.target.style.borderColor = "var(--color-forest)"; e.target.style.boxShadow = "0 0 0 3px rgba(13,59,46,0.08)"; }} onBlur={e => { e.target.style.borderColor = "var(--color-line)"; e.target.style.boxShadow = "none"; }} />
          <button onClick={() => send()} disabled={loading || !input.trim()} className="h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-200" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
