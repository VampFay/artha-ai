"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CornerDownLeft, FileText, Sparkles, Download, LayoutDashboard, Calculator, TrendingUp, Target, Settings, Command } from 'lucide-react';
import { ViewState } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
}

const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', type: 'page', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio Analytics', type: 'page', icon: Target },
  { id: 'cashflow', label: 'Cashflow & Runway', type: 'page', icon: TrendingUp },
  { id: 'liabilities', label: 'Debt Management', type: 'page', icon: Calculator },
  { id: 'retirement', label: 'Retirement & FIRE', type: 'page', icon: Target },
  { id: 'documents', label: 'Documents', type: 'page', icon: FileText },
  { id: 'estate', label: 'Estate Planning', type: 'page', icon: FileText },
  { id: 'tax', label: 'Tax Readiness', type: 'page', icon: Calculator },
  { id: 'finance', label: 'Financial Health', type: 'page', icon: TrendingUp },
  { id: 'goals', label: 'Goals', type: 'page', icon: Target },
  { id: 'assistant', label: 'AI Assistant', type: 'page', icon: Sparkles },
  { id: 'reports', label: 'Reports', type: 'page', icon: Download },
  { id: 'settings', label: 'Settings', type: 'page', icon: Settings },
  { id: 'upload', label: 'Upload Document', type: 'action', icon: FileText },
  { id: 'ask', label: 'Ask AI Assistant', type: 'action', icon: Sparkles },
  { id: 'report', label: 'Generate Tax Report', type: 'action', icon: Download },
];

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = ITEMS.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item.type === 'page') {
        onNavigate(item.id as ViewState);
      } else if (item.id === 'upload') {
        onNavigate('documents');
      } else if (item.id === 'ask') {
        onNavigate('assistant');
      } else if (item.id === 'report') {
        onNavigate('reports');
      }
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-carbon/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-stone/10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center px-4 py-4 border-b border-stone/10">
                <Search className="w-5 h-5 text-stone" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, actions, documents..."
                  className="flex-1 bg-transparent border-none outline-none px-3 text-lg font-medium placeholder:text-stone/40"
                />
                <div className="px-2 py-1 rounded bg-stone/5 text-stone text-xs font-mono tracking-widest uppercase">
                  Esc
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto py-2">
                {filteredItems.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-stone">
                    <Search className="w-8 h-8 mb-3 opacity-20" />
                    <p>No results for "{query}"</p>
                  </div>
                ) : (
                  <div className="px-2 space-y-1">
                    {/* Pages */}
                    {filteredItems.some(i => i.type === 'page') && (
                      <div className="px-3 py-2 text-xs font-semibold text-stone/50 uppercase tracking-wider">
                        Navigation
                      </div>
                    )}
                    {filteredItems.filter(i => i.type === 'page').map((item, i) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors",
                            isSelected ? "bg-saffron/10 text-saffron-light" : "hover:bg-stone/5 text-carbon"
                          )}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          onClick={() => {
                            onNavigate(item.id as ViewState);
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {isSelected && <CornerDownLeft className="w-4 h-4" />}
                        </div>
                      );
                    })}

                    {/* Actions */}
                    {filteredItems.some(i => i.type === 'action') && (
                      <div className="px-3 py-2 mt-2 text-xs font-semibold text-stone/50 uppercase tracking-wider">
                        Quick Actions
                      </div>
                    )}
                    {filteredItems.filter(i => i.type === 'action').map((item, i) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-colors",
                            isSelected ? "bg-carbon text-canvas" : "hover:bg-stone/5 text-carbon"
                          )}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          onClick={() => {
                            if (item.id === 'upload') onNavigate('documents');
                            if (item.id === 'ask') onNavigate('assistant');
                            if (item.id === 'report') onNavigate('reports');
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {isSelected && <CornerDownLeft className="w-4 h-4" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-stone/5 px-4 py-3 border-t border-stone/10 flex items-center justify-between text-xs text-stone font-medium">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><kbd className="font-sans px-1 rounded bg-stone/10">↑↓</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="font-sans px-1 rounded bg-stone/10">↵</kbd> select</span>
                </div>
                <span className="flex items-center gap-1"><Command className="w-3 h-3" /> Artha AI</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
