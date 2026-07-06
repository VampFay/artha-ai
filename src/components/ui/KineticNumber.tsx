import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { cn } from '../../lib/utils';

interface KineticNumberProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
  delay?: number;
}

export function KineticNumber({ value, format = (v) => v.toString(), className, delay = 0 }: KineticNumberProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const springValue = useSpring(0, { bounce: 0, duration: 1500 });
  
  useEffect(() => {
    setHasMounted(true);
    const timeout = setTimeout(() => {
      springValue.set(value);
    }, delay);
    return () => clearTimeout(timeout);
  }, [value, delay, springValue]);

  // If we don't format, we just return the raw spring value text. 
  // But useTransform is great here if we want to format safely.
  // Wait, framer-motion's useTransform with a string return works well in <motion.span>
  
  const display = useTransform(springValue, (current) => {
    return format(Math.round(current));
  });

  if (!hasMounted) return <span className={className}>{format(0)}</span>;

  return <motion.span className={className}>{display}</motion.span>;
}
