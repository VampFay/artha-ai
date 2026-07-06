import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export interface BarData {
  label: string;
  value: number;
  color?: string; // Optional hex or tailwind class
}

interface GradientBarsProps {
  data: BarData[];
  className?: string;
  formatValue?: (val: number) => string;
}

export function GradientBars({ data, className, formatValue = (v) => v.toString() }: GradientBarsProps) {
  const max = Math.max(...data.map(d => d.value));

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((item, i) => {
        const percentage = Math.max(2, (item.value / max) * 100);
        return (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-stone">{item.label}</span>
              <span className="text-carbon">{formatValue(item.value)}</span>
            </div>
            <div className="h-2.5 w-full bg-stone/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: item.color 
                    ? `linear-gradient(90deg, ${item.color}80 0%, ${item.color} 100%)` 
                    : 'linear-gradient(90deg, var(--color-stone) 0%, var(--color-carbon) 100%)'
                }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: "spring", bounce: 0, duration: 1.2, delay: i * 0.1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
