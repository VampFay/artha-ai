import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { KineticNumber } from './KineticNumber';

interface FinancialPulseOrbProps {
  score: number;
  className?: string;
}

export function FinancialPulseOrb({ score, className }: FinancialPulseOrbProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center w-[220px] h-[220px]", className)}>
      {/* Aura Glow */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-saffron blur-3xl"
      />
      
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 220 220">
        {/* Tick marks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const rotation = (i * 360) / 24;
          return (
            <line
              key={i}
              x1="110"
              y1="10"
              x2="110"
              y2="18"
              className="stroke-stone/20"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${rotation} 110 110)`}
            />
          );
        })}

        {/* Background Arc */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-stone/10"
          strokeWidth="6"
        />

        {/* Animated Score Arc */}
        <motion.circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-saffron drop-shadow-[0_0_12px_rgba(217,119,6,0.6)]"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        <KineticNumber 
          value={score} 
          delay={200}
          className="text-5xl font-semibold tracking-tighter text-canvas drop-shadow-md"
        />
        <span className="text-stone font-medium mt-1">/100</span>
      </div>
    </div>
  );
}
