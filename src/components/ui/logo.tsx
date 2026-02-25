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

const spinAnimation = {
  rotateX: [0, 0, 0, 360, 360],
  scale: [1, 1, 1, 1.1, 1],
};

const spinTransition = {
  duration: 4,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  times: [0, 0.5, 0.6, 0.8, 1],
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
          'font-display font-extrabold tracking-tight leading-none',
          sizes[size],
          variant === 'dark' ? 'text-text' : 'text-white'
        )}
        style={{ perspective: '200px' }}
      >
        w
        {shouldAnimate ? (
          <>
            <motion.span
              className="inline-block origin-center"
              style={{ color: 'inherit' }}
              animate={spinAnimation}
              transition={spinTransition}
            >
              o
            </motion.span>
            <motion.span
              className="inline-block origin-center"
              style={{ color: 'inherit' }}
              animate={spinAnimation}
              transition={{ ...spinTransition, delay: 0.2 }}
            >
              o
            </motion.span>
          </>
        ) : (
          <span>oo</span>
        )}
        pla
      </span>
    </div>
  );
}
