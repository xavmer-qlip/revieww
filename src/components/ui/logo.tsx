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

// Timeline (5s):
//  0–15%  idle
// 15–25%  Os grow + space out
// 25–50%  arc spins (fast → decelerate)
// 50–60%  Os shrink + close back
// 60–100% idle
const T = [0, 0.15, 0.25, 0.30, 0.38, 0.45, 0.50, 0.60, 1];

const oScale =   [1, 1, 1.2, 1.2, 1.2, 1.2, 1.2, 1, 1];
const oMargin =  [0, 0, 0.08, 0.08, 0.08, 0.08, 0.08, 0, 0];
const arcSpin =  [0, 0, 0, 360, 720, 1080, 1260, 1260, 1260];
const arcAlpha = [0, 0, 0.8, 1, 0.9, 0.6, 0.2, 0, 0];

const trans = {
  duration: 5,
  repeat: Infinity,
  ease: 'linear' as const,
  times: T,
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
            <AnimatedO delay={0} />
            <AnimatedO delay={0.12} />
            <span>pla</span>
          </>
        ) : (
          <span>woopla</span>
        )}
      </span>
    </div>
  );
}

function AnimatedO({ delay }: { delay: number }) {
  return (
    <motion.span
      className="relative inline-block origin-center"
      style={{ color: 'inherit' }}
      animate={{
        scale: oScale,
        marginInline: oMargin.map((m) => `${m}em`),
      }}
      transition={{ ...trans, delay }}
    >
      {/* The "o" — always visible, always monochrome */}
      <span>o</span>

      {/* Thin arc that spins around the "o" — monochrome, currentColor */}
      <motion.span
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: '-18%',
          border: '0.06em solid transparent',
          borderTopColor: 'currentColor',
        }}
        animate={{
          rotate: arcSpin,
          opacity: arcAlpha,
        }}
        transition={{ ...trans, delay }}
      />
    </motion.span>
  );
}
