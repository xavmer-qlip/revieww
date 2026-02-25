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

// Spinning indicator: 6 full rotations decelerating, then idle
const spinRotation = [0, 360, 720, 1080, 1440, 1800, 1980, 2160, 2160];
const spinOpacity = [0, 0.85, 1, 0.9, 0.7, 0.4, 0.15, 0, 0];
const letterScale = [1, 1.25, 1.35, 1.3, 1.2, 1.1, 1.03, 1, 1];
const spinTimes = [0, 0.05, 0.1, 0.16, 0.23, 0.31, 0.37, 0.42, 1];

const spinTransition = {
  duration: 5,
  repeat: Infinity,
  ease: 'linear' as const,
  times: spinTimes,
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
      >
        w
        {shouldAnimate ? (
          <>
            <SpinningO delay={0} />
            <SpinningO delay={0.3} />
          </>
        ) : (
          <span>oo</span>
        )}
        pla
      </span>
    </div>
  );
}

function SpinningO({ delay }: { delay: number }) {
  return (
    <span className="relative inline-block">
      {/* The letter stays fixed — subtle scale pulse */}
      <motion.span
        className="inline-block origin-center"
        style={{ color: 'inherit' }}
        animate={{ scale: letterScale }}
        transition={{ ...spinTransition, delay }}
      >
        o
      </motion.span>

      {/* Spinning indicator — triangle/arrow at the top of the "o" that orbits around */}
      <motion.span
        className="absolute inset-[-5%] pointer-events-none"
        style={{ color: 'inherit' }}
        animate={{
          rotate: spinRotation,
          opacity: spinOpacity,
        }}
        transition={{ ...spinTransition, delay }}
      >
        {/* Small triangle pointing inward at 12 o'clock position */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ color: 'inherit' }}
        >
          <polygon
            points="50,8 44,0 56,0"
            fill="currentColor"
          />
        </svg>
      </motion.span>
    </span>
  );
}
