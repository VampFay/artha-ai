"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Sparkles, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  recommendations?: string[];
  citations?: string[];
  followUpQuestions?: string[];
}

export default function EntityAdvisorView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const { toast } = useToast();
  const entityId = params.entity_id || activeEntityId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entityId) return;
    // Fetch proactive alerts
    const token = localStorage.getItem("finsight_token");
    fetch(`/api/entities/${entityId}/alerts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAlerts(d.data || []))
      .catch(() => {});
  }, [entityId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || !entityId) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const token = localStorage.getItem("finsight_token");
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/entities/${entityId}/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history }),
      });
      if (!res.ok) throw new Error("Advisor request failed");
      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.data.content,
        recommendations: data.data.recommendations,
        citations: data.data.citations,
        followUpQuestions: data.data.followUpQuestions,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `I encountered an error: ${err.message}. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Should I opt for §115BAA concessional regime?",
    "How can I optimize my GST ITC utilization?",
    "What's my advance tax installment schedule?",
    "What are my CSR compliance requirements?",
    "How does my effective tax rate compare to peers?",
  ];

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[800px] mx-auto w-full">
      <div className="mb-6">
        <button onClick={() => navigate("entity-dashboard", { entity_id: entityId || "" })} className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase mb-3 hover:text-carbon transition-colors">← Dashboard</button>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-saffron" />
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">AI Tax Advisor</h1>
        </div>
        <p className="text-stone text-sm">Ask entity-specific tax questions. Powered by GLM with your entity context.</p>
      </div>

      {/* Proactive alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className={cn("p-4 rounded-xl border flex items-start gap-3",
                alert.severity === "critical" ? "bg-red-50 border-red-200" :
                alert.severity === "warning" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200")}>
              <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5",
                alert.severity === "critical" ? "text-red-600" : alert.severity === "warning" ? "text-amber-600" : "text-blue-600")} />
              <div className="flex-1">
                <p className="text-sm font-medium text-carbon">{alert.title}</p>
                <p className="text-xs text-stone mt-1">{alert.description}</p>
                <p className="text-[10px] text-saffron mt-1 font-medium">→ {alert.action}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div className="bg-white border border-carbon/10 rounded-2xl overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-10 h-10 text-saffron/30 mx-auto mb-4" />
              <p className="text-sm text-stone mb-1">Ask me anything about your entity's tax position</p>
              <p className="text-[11px] text-stone/60">I have your entity profile, tax computation, and compliance status as context</p>
              <div className="mt-6 space-y-2 max-w-md mx-auto">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} onClick={() => handleSend(q)} className="w-full text-left p-3 rounded-lg bg-carbon/5 hover:bg-carbon/10 text-xs text-carbon transition-colors flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-saffron shrink-0" /> {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl p-4", msg.role === "user" ? "bg-saffron text-white" : "bg-carbon/5 text-carbon")}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-carbon/10">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone mb-1.5 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Recommendations</p>
                      <ul className="space-y-1">{msg.recommendations.map((r, ri) => <li key={ri} className="text-[11px] text-stone">→ {r}</li>)}</ul>
                    </div>
                  )}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">{msg.citations.map((c, ci) => <span key={ci} className="text-[9px] px-1.5 py-0.5 rounded bg-saffron/10 text-saffron">{c}</span>)}</div>
                  )}
                  {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-carbon/10">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone mb-1.5">Follow-up questions:</p>
                      {msg.followUpQuestions.map((q, qi) => (
                        <button key={qi} onClick={() => handleSend(q)} className="block w-full text-left text-[11px] text-saffron hover:underline mt-1">→ {q}</button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex justify-start"><div className="bg-carbon/5 rounded-2xl p-4"><Loader2 className="w-5 h-5 animate-spin text-saffron" /></div></div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-carbon/10 p-4 flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Ask about tax regimes, GST, TDS, transfer pricing..." className="flex-1 px-4 py-2.5 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron" />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="px-4 py-2.5 bg-saffron text-white rounded-lg disabled:opacity-50 hover:bg-saffron/90 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
