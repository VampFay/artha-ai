"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, Sparkles, Loader2, Bot, User } from "lucide-react";
import { EmptyState, IllusChat } from "@/components/empty-state";

interface Msg { role: "user" | "ai"; text: string; ts: number; }

export default function AssistantContent() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const send = async (q?: string) => {
    const question = q || input;
    if (!question.trim() || loading) return;
    setInput(""); setLoading(true);
    setMessages(m => [...m, { role: "user", text: question, ts: Date.now() }]);
    try {
      const res = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("finsight_token")}` },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: "ai", text: data.answer || "I couldn't process that.", ts: Date.now() }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "Connection error. Please try again.", ts: Date.now() }]);
    } finally { setLoading(false); }
  };

  const suggestions = [
    { q: "Why is my tax score low?", icon: "📊" },
    { q: "What documents are missing?", icon: "📄" },
    { q: "How can I improve savings?", icon: "💰" },
    { q: "Explain my spending pattern", icon: "🔍" },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-caption mb-2 flex items-center gap-2">
          <span className="dot dot-live" style={{ background: "var(--color-moss)" }} />AI-Powered
        </p>
        <h1 className="text-heading">Financial Assistant</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bento bento-light flex flex-col flex-1 min-h-[60vh] overflow-hidden relative"
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--color-line-soft)" }}>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)" }}>
                <Bot className="h-4 w-4" style={{ color: "var(--color-gold-light)" }} />
              </div>
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                style={{ background: "var(--color-moss)", border: "2px solid var(--color-surface)" }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>FinSight AI</p>
              <p className="text-[10px]" style={{ color: "var(--color-moss)" }}>● Online · Grounded on your data</p>
            </div>
          </div>
          <Sparkles className="h-4 w-4" style={{ color: "var(--color-gold)" }} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <EmptyState
              illustration={<IllusChat />}
              personalization="AI-Powered"
              title="Ask me anything about your finances"
              description="I know your tax score, spending patterns, and goals. Try: 'How can I save more tax?' or 'What documents am I missing?'"
            />
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "ai" && (
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)" }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: "var(--color-gold-light)" }} />
                  </div>
                )}
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)", borderBottomRightRadius: "4px", boxShadow: "0 4px 12px -3px rgba(13,59,46,0.3)" }
                      : { background: "var(--color-cream-dark)", color: "var(--color-ink-soft)", borderBottomLeftRadius: "4px" }
                  }
                >
                  {m.text}
                </div>
                {m.role === "user" && (
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(13,59,46,0.06)" }}>
                    <User className="h-3.5 w-3.5" style={{ color: "var(--color-forest)" }} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5 justify-start">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)" }}>
                <Bot className="h-3.5 w-3.5" style={{ color: "var(--color-gold-light)" }} />
              </div>
              <div className="rounded-2xl px-4 py-3.5 flex items-center gap-1.5" style={{ background: "var(--color-cream-dark)", borderBottomLeftRadius: "4px" }}>
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--color-ink-muted)" }}
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestion chips */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-5 pb-3 flex flex-wrap gap-2"
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={s.q}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => send(s.q)}
                className="text-xs px-3 py-2 rounded-full flex items-center gap-1.5 font-medium"
                style={{ background: "rgba(13,59,46,0.04)", color: "var(--color-forest)", border: "1px solid rgba(13,59,46,0.1)" }}
              >
                <span>{s.icon}</span>{s.q}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Input */}
        <div className="p-4 flex gap-2" style={{ borderTop: "1px solid var(--color-line-soft)" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask a question..."
            className="flex-1 h-11 rounded-xl px-4 text-sm outline-none glass-input"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(13,59,46,0.4)" }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
