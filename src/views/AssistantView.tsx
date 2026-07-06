"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Bot, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = { id: string; text: string; sender: 'user' | 'ai' };

export default function AssistantView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const newMsg: Message = { id: Date.now().toString(), text, sender: 'user' };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch("/api/assistant/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer || data.reply || "I couldn't process that. Please try again.",
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Connection error. Please try again.",
        sender: 'ai',
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const SUGGESTIONS = [
    "📊 Why is my tax score low?",
    "📄 What documents are missing?",
    "💰 How can I improve savings?",
    "🔍 Explain my spending pattern"
  ];

  return (
    <div className="flex flex-col h-full bg-canvas relative">
      
      {/* Status Bar */}
      <div className="h-16 border-b border-stone/10 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-carbon flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6 text-saffron" />
          </div>
          <div>
            <h2 className="font-medium text-carbon leading-tight">Artha AI</h2>
            <div className="flex items-center gap-1.5 text-xs text-stone">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online · Grounded on your data
            </div>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-saffron" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-saffron/10 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-saffron" />
            </div>
            <h2 className="text-2xl font-semibold text-carbon mb-2">Ask me anything</h2>
            <p className="text-stone mb-12">I can analyze your spending, calculate tax scenarios, and help you plan your financial goals.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="p-3 text-sm font-medium text-stone hover:text-carbon bg-white border border-stone/10 hover:border-saffron/30 hover:bg-saffron/5 rounded-xl transition-colors text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-4 max-w-2xl", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "")}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                    msg.sender === 'user' ? "bg-stone/10" : "bg-carbon"
                  )}>
                    {msg.sender === 'user' ? <UserIcon className="w-4 h-4 text-stone" /> : <Bot className="w-4 h-4 text-saffron" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                    msg.sender === 'user' 
                      ? "bg-carbon text-canvas rounded-tr-sm" 
                      : "bg-white border border-stone/10 text-carbon rounded-tl-sm"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-2xl">
                <div className="w-8 h-8 rounded-full bg-carbon flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-saffron" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone/10 rounded-tl-sm flex items-center gap-1.5 h-[52px]">
                  <span className="w-2 h-2 rounded-full bg-stone/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-stone/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-stone/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-canvas border-t border-stone/10 shrink-0 relative z-20">
        <div className="max-w-4xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask a question..."
            className="w-full pl-6 pr-14 py-4 rounded-full bg-white border border-stone/20 focus:border-saffron/50 focus:ring-4 focus:ring-saffron/10 outline-none transition-all shadow-sm font-medium placeholder:text-stone/40"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2.5 rounded-full bg-carbon text-canvas disabled:bg-stone/10 disabled:text-stone transition-colors"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

    </div>
  );
}
