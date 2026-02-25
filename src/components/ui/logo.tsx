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

// Slot-machine effect: 5 full rotations with deceleration, then idle
// Os scale up while spinning ("O O") then shrink back to normal ("oo")
const slotAnimation = {
  rotateX: [0, 360, 720, 1080, 1440, 1620, 1800, 1800, 1800],
  scale: [1, 1.3, 1.35, 1.35, 1.3, 1.15, 1.0, 1.0, 1.0],
};

// Non-linear times create deceleration: fast at start, slow at end
const slotTimes = [0, 0.06, 0.12, 0.22, 0.34, 0.44, 0.54, 0.62, 1];

const slotTransition = {
  duration: 8,
  repeat: Infinity,
  ease: 'linear' as const,
  times: slotTimes,
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
              animate={slotAnimation}
              transition={slotTransition}
            >
              o
            </motion.span>
            <motion.span
              className="inline-block origin-center"
              style={{ color: 'inherit' }}
              animate={slotAnimation}
              transition={{ ...slotTransition, delay: 0.4 }}
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
