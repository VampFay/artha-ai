import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface LiquidProgressProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function LiquidProgress({ value, max = 100, className, indicatorClassName }: LiquidProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-stone/10", className)}>
      <motion.div
        className={cn("h-full w-full flex-1 bg-saffron rounded-full", indicatorClassName)}
        initial={{ x: '-100%' }}
        animate={{ x: `-${100 - percentage}%` }}
        transition={{ type: 'spring', bounce: 0, duration: 1.5, delay: 0.1 }}
      />
    </div>
  );
}
