'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  variant?: 'dark' | 'light';
  animate?: boolean;
}

const sizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

export function Logo({
  size = 'md',
  className,
  variant = 'dark',
  animate: shouldAnimate = false,
}: LogoProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span
        className={cn(
          'font-display font-extrabold tracking-tight leading-none inline-flex items-baseline',
          sizes[size],
          variant === 'dark' ? 'text-text' : 'text-white'
        )}
        style={{ perspective: '400px' }}
      >
        {shouldAnimate ? (
          <>
            <span>w</span>
            <FlipO delay={0} />
            <FlipO delay={0.2} />
            <span>pla</span>
          </>
        ) : (
          <span>woopla</span>
        )}
      </span>
    </div>
  );
}

function FlipO({ delay }: { delay: number }) {
  return (
    <motion.span
      className="inline-block origin-center"
      style={{ color: 'inherit' }}
      animate={{ rotateX: [0, 0, 360, 360] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.25, 0.45, 1],
        delay,
      }}
    >
      o
    </motion.span>
  );
}
