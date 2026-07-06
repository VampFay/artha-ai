import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, UploadCloud, Calculator, ShieldCheck, X } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
}

const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Your money, finally clear.',
    description: 'Artha AI analyzes your financial documents to give you actionable insights without the manual data entry.',
    cta: 'Get Started'
  },
  {
    id: 'upload',
    icon: UploadCloud,
    title: '60 seconds to your first score',
    description: 'Upload your salary slips, Form 16, or bank statements. We securely extract the data using real PDF text parsing.',
    cta: 'See How It Works'
  },
  {
    id: 'tax',
    icon: Calculator,
    title: 'Get your Tax Readiness Score',
    description: 'We calculate your tax automatically, compare Old vs New regimes, and tell you exactly which documents are missing.',
    cta: 'Almost There'
  },
  {
    id: 'privacy',
    icon: ShieldCheck,
    title: 'Privacy-first, always',
    description: 'Your financial data is sensitive. We use strict encryption, consent gates, and allow you to revoke access at any time.',
    cta: 'Start Using Artha AI'
  }
];

export default function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem('finsight_onboarding_complete');
    if (!hasCompleted) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('finsight_onboarding_complete', 'true');
    setIsVisible(false);
    setTimeout(onComplete, 300); // Wait for exit animation
  };

  const currentStep = STEPS[step];

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-carbon/60 backdrop-blur-md"
            onClick={handleComplete} // click outside to skip
          />
          
          <motion.div
            layoutId="onboarding-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="w-full max-w-lg bg-canvas rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-stone/10"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={handleComplete}
              className="absolute top-4 right-4 p-2 text-stone hover:text-carbon transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10 pt-16 flex flex-col items-center text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center mb-6">
                    <currentStep.icon className="w-8 h-8" />
                  </div>
                  {step === 0 && (
                    <h2 className="text-xl font-medium text-stone mb-2">Welcome, {user.name.split(' ')[0]}</h2>
                  )}
                  <h3 className="text-3xl font-semibold tracking-tight text-carbon mb-4">
                    {currentStep.title}
                  </h3>
                  <p className="text-stone leading-relaxed">
                    {currentStep.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white border-t border-stone/10 flex flex-col gap-6">
              <div className="flex items-center justify-center gap-2">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === step ? "w-8 bg-saffron" : "w-1.5 bg-stone/20 hover:bg-stone/40"
                    )}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                {step > 0 ? (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="px-4 py-2.5 text-sm font-medium text-stone hover:text-carbon transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div className="w-[68px]" /> // placeholder for layout
                )}
                
                <button
                  onClick={() => {
                    if (step === STEPS.length - 1) {
                      handleComplete();
                    } else {
                      setStep(s => s + 1);
                    }
                  }}
                  className="px-6 py-2.5 bg-carbon text-canvas rounded-xl font-medium hover:bg-carbon-light active:scale-95 transition-all"
                >
                  {currentStep.cta}
                </button>
              </div>
              
              <div className="text-center">
                <span className="text-xs font-medium text-stone/50 uppercase tracking-wider">
                  Step {step + 1} of 4 · <button onClick={handleComplete} className="hover:text-stone transition-colors">Skip anytime</button>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
