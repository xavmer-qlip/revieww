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

// ---------------------------------------------------------------
// Timeline (6s total):
//   0–10%  idle "woopla"
//  10–18%  o fades out → wheel fades in, scale grows, spacing opens
//  18–45%  wheel spins (fast → decelerate → stop)
//  45–52%  wheel fades out → o fades back in, scale/spacing shrink
//  52–100% idle "woopla"
// ---------------------------------------------------------------
const T = [0, 0.10, 0.18, 0.25, 0.33, 0.40, 0.45, 0.52, 1];
const oAlpha = [1, 1, 0, 0, 0, 0, 0, 1, 1];
const wAlpha = [0, 0, 1, 1, 1, 1, 1, 0, 0];
const wSpin = [0, 0, 0, 720, 1440, 1980, 2160, 2160, 2160];
const cScale = [1, 1, 1.4, 1.4, 1.4, 1.35, 1.3, 1, 1];
const cMargin = [0, 0, 0.1, 0.1, 0.1, 0.1, 0.1, 0, 0];

const anim = {
  duration: 6,
  repeat: Infinity,
  ease: 'linear' as const,
  times: T,
};

// ---------------------------------------------------------------
// Mini wheel-of-fortune SVG
// ---------------------------------------------------------------
const COLORS = ['#FF6B35', '#4CAF50', '#1B2A4A', '#E91E63', '#FFD700', '#82C8E5'];

function MiniWheel() {
  const n = COLORS.length;
  const r = 45;
  const paths = COLORS.map((color, i) => {
    const a1 = ((i * 360) / n - 90) * (Math.PI / 180);
    const a2 = (((i + 1) * 360) / n - 90) * (Math.PI / 180);
    const x1 = 50 + r * Math.cos(a1);
    const y1 = 50 + r * Math.sin(a1);
    const x2 = 50 + r * Math.cos(a2);
    const y2 = 50 + r * Math.sin(a2);
    return (
      <path
        key={i}
        d={`M50,50 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
        fill={color}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth={0.5}
      />
    );
  });

  return (
    <svg viewBox="0 0 100 100" className="block w-full h-full">
      {paths}
      <circle cx={50} cy={50} r={7} fill="#1B2A4A" stroke="white" strokeWidth={1} />
    </svg>
  );
}

// ---------------------------------------------------------------
// Logo
// ---------------------------------------------------------------
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
            <AnimatedO delay={0.15} />
            <span>pla</span>
          </>
        ) : (
          <span>woopla</span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------
// Single animated "o" ↔ mini wheel
// ---------------------------------------------------------------
function AnimatedO({ delay }: { delay: number }) {
  return (
    <motion.span
      className="relative inline-block origin-center"
      style={{ color: 'inherit' }}
      animate={{
        scale: cScale,
        marginInline: cMargin.map((m) => `${m}em`),
      }}
      transition={{ ...anim, delay }}
    >
      {/* "o" letter — keeps layout, fades out during wheel phase */}
      <motion.span
        className="inline-block"
        style={{ color: 'inherit' }}
        animate={{ opacity: oAlpha }}
        transition={{ ...anim, delay }}
      >
        o
      </motion.span>

      {/* Mini wheel — centered on the "o", spins, then disappears */}
      <span
        className="absolute top-1/2 left-1/2 pointer-events-none"
        style={{
          width: '1.3em',
          height: '1.3em',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.span
          className="block w-full h-full rounded-full overflow-hidden"
          animate={{
            opacity: wAlpha,
            rotate: wSpin,
          }}
          transition={{ ...anim, delay }}
        >
          <MiniWheel />
        </motion.span>
      </span>
    </motion.span>
  );
}
