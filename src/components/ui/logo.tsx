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

// 2D wheel spin: 6 full rotations with progressive deceleration, then idle
const wheelRotation = [0, 360, 720, 1080, 1440, 1800, 1980, 2160, 2160];
const wheelScale = [1, 1.2, 1.25, 1.2, 1.15, 1.08, 1.02, 1, 1];
const glowOpacity = [0, 0.8, 1, 0.9, 0.6, 0.3, 0.1, 0, 0];
// Non-linear timing: fast rotations early, slower at end → deceleration feel
const wheelTimes = [0, 0.05, 0.1, 0.16, 0.23, 0.31, 0.37, 0.42, 1];

const wheelTransition = {
  duration: 5,
  repeat: Infinity,
  ease: 'linear' as const,
  times: wheelTimes,
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
            <SpinningO variant={variant} delay={0} />
            <SpinningO variant={variant} delay={0.3} />
          </>
        ) : (
          <span>oo</span>
        )}
        pla
      </span>
    </div>
  );
}

function SpinningO({ variant, delay }: { variant: 'dark' | 'light'; delay: number }) {
  // Glow matches text color: dark text on light bg, white on dark bg
  const glowColor = variant === 'dark'
    ? 'rgba(26, 26, 46, 0.4)'
    : 'rgba(255, 255, 255, 0.5)';

  return (
    <span className="relative inline-block">
      {/* The spinning letter */}
      <motion.span
        className="inline-block origin-center"
        style={{ color: 'inherit' }}
        animate={{
          rotate: wheelRotation,
          scale: wheelScale,
        }}
        transition={{ ...wheelTransition, delay }}
      >
        o
      </motion.span>
      {/* Glow ring behind — visible during spin, fades out when stopped */}
      <motion.span
        className="absolute inset-[-15%] rounded-full pointer-events-none"
        style={{
          boxShadow: `0 0 10px 3px ${glowColor}, inset 0 0 6px 1px ${glowColor}`,
        }}
        animate={{ opacity: glowOpacity }}
        transition={{ ...wheelTransition, delay }}
      />
    </span>
  );
}
