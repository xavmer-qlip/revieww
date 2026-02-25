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

// Timeline (duration: 6s):
// 0.00 - 0.10 : idle "woopla"
// 0.10 - 0.20 : Os grow + spacing increases → "w O O pla"
// 0.20 - 0.50 : triangle spins (fast → decelerate)
// 0.50 - 0.60 : Os shrink + spacing back → "woopla"
// 0.60 - 1.00 : idle "woopla"

const letterScale = [1, 1, 1.4, 1.4, 1.4, 1.4, 1, 1];
const letterSpacing = [0, 0, 0.15, 0.15, 0.15, 0.15, 0, 0]; // in em
const phaseTimes = [0, 0.10, 0.20, 0.25, 0.40, 0.50, 0.60, 1];

// Triangle spin starts at phase 0.20, peaks, decelerates, stops at 0.50
const triRotation = [0, 0, 0, 360, 1080, 1800, 1800, 1800];
const triOpacity = [0, 0, 1, 1, 0.8, 0.3, 0, 0];

const transition = {
  duration: 6,
  repeat: Infinity,
  ease: 'linear' as const,
  times: phaseTimes,
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
      >
        {shouldAnimate ? (
          <>
            <span>w</span>
            <SpinningO delay={0} />
            <SpinningO delay={0.15} />
            <span>pla</span>
          </>
        ) : (
          <span>woopla</span>
        )}
      </span>
    </div>
  );
}

function SpinningO({ delay }: { delay: number }) {
  return (
    <motion.span
      className="relative inline-flex items-center justify-center origin-center"
      style={{ color: 'inherit' }}
      animate={{
        scale: letterScale,
        marginInline: letterSpacing.map((s) => `${s}em`),
      }}
      transition={{ ...transition, delay }}
    >
      {/* The letter */}
      <span>o</span>

      {/* Triangle orbiting around — visible only during spin phase */}
      <motion.span
        className="absolute pointer-events-none"
        style={{
          inset: '-25%',
          color: 'inherit',
        }}
        animate={{
          rotate: triRotation,
          opacity: triOpacity,
        }}
        transition={{ ...transition, delay }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full" overflow="visible">
          <polygon points="50,15 44,2 56,2" fill="currentColor" />
        </svg>
      </motion.span>
    </motion.span>
  );
}
