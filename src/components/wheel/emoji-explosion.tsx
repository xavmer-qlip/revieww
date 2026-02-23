'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmojiExplosionProps {
  emoji: string;
  isWinner: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  angle: number;
  distance: number;
  scale: number;
  rotation: number;
  delay: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateParticles(emoji: string, count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 360 + (Math.random() - 0.5) * 30;
    const distance = 120 + Math.random() * 100;
    particles.push({
      id: i,
      emoji,
      x: Math.cos((angle * Math.PI) / 180) * distance,
      y: Math.sin((angle * Math.PI) / 180) * distance,
      angle,
      distance,
      scale: 0.4 + Math.random() * 0.6,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
    });
  }
  return particles;
}

function fireWinnerConfetti() {
  // Burst from center
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { x: 0.5, y: 0.45 },
    colors: ['#FF6B35', '#FFD700', '#10B981', '#E91E63', '#9C27B0'],
    ticks: 120,
    gravity: 0.8,
    scalar: 1.1,
  });

  // Side cannons after slight delay
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#FF6B35', '#FFD700', '#10B981'],
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#FF6B35', '#FFD700', '#10B981'],
    });
  }, 250);
}

function fireJackpotConfetti() {
  // Golden star explosions
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: Math.random() * 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6B35'],
      shapes: ['star'],
      scalar: 1.5,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: Math.random() * 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6B35'],
      shapes: ['star'],
      scalar: 1.5,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();

  // Big golden burst
  confetti({
    particleCount: 120,
    spread: 160,
    origin: { x: 0.5, y: 0.4 },
    colors: ['#FFD700', '#FFA500', '#FFE066', '#FF6B35'],
    ticks: 200,
    gravity: 0.6,
    scalar: 1.4,
  });
}

// ---------------------------------------------------------------------------
// Winner explosion
// ---------------------------------------------------------------------------

function WinnerExplosion({ emoji, isJackpot, onComplete }: {
  emoji: string;
  isJackpot: boolean;
  onComplete?: () => void;
}) {
  const particles = useRef(generateParticles(emoji, isJackpot ? 30 : 22)).current;
  const hasFireConfetti = useRef(false);

  useEffect(() => {
    if (!hasFireConfetti.current) {
      hasFireConfetti.current = true;
      if (isJackpot) {
        fireJackpotConfetti();
      } else {
        fireWinnerConfetti();
      }
    }

    const timer = setTimeout(() => {
      onComplete?.();
    }, 3200);
    return () => clearTimeout(timer);
  }, [isJackpot, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background overlay with blur */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          background: isJackpot
            ? 'radial-gradient(circle at center, rgba(255,215,0,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle at center, rgba(255,107,53,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Central emoji with spring scale-up */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 5, 4],
          opacity: [0, 1, 1],
        }}
        transition={{
          duration: 0.8,
          times: [0, 0.5, 1],
          type: 'spring',
          stiffness: 200,
          damping: 12,
        }}
      >
        <span className="text-6xl select-none drop-shadow-2xl">{emoji}</span>
      </motion.div>

      {/* MEGA WIN text for jackpot */}
      {isJackpot && (
        <motion.div
          className="absolute z-20 top-[28%] left-1/2 -translate-x-1/2"
          initial={{ scale: 0, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 15 }}
        >
          <span
            className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B35 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(255,215,0,0.3)',
              filter: 'drop-shadow(0 2px 8px rgba(255,165,0,0.4))',
            }}
          >
            MEGA WIN
          </span>
        </motion.div>
      )}

      {/* Emoji particles exploding outward */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute z-10 select-none pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: -12,
            marginTop: -12,
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            x: p.x,
            y: p.y,
            scale: [0, p.scale, p.scale * 0.6, 0],
            rotate: p.rotation,
            opacity: [0, 1, 0.8, 0],
          }}
          transition={{
            duration: 1.8,
            delay: 0.3 + p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <span className="text-xl">{p.emoji}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loser animation
// ---------------------------------------------------------------------------

function LoserAnimation({ emoji, onComplete }: {
  emoji: string;
  onComplete?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gentle overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        style={{
          background: 'radial-gradient(circle at center, rgba(107,114,128,0.1) 0%, transparent 60%)',
        }}
      />

      {/* Emoji floats up and fades */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, y: 40, opacity: 0 }}
        animate={{
          scale: [0, 3, 2.5],
          y: [40, -20, -60],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2.2,
          times: [0, 0.35, 1],
          ease: 'easeOut',
        }}
      >
        <span className="text-6xl select-none grayscale-[30%] opacity-80">
          {emoji}
        </span>
      </motion.div>

      {/* Sad floating particles - few and gentle */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * 360;
        const dist = 60 + Math.random() * 40;
        return (
          <motion.div
            key={i}
            className="absolute z-10 select-none pointer-events-none"
            style={{ left: '50%', top: '50%', marginLeft: -8, marginTop: -8 }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist - 30,
              scale: [0, 0.6, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 1.6,
              delay: 0.2 + i * 0.08,
              ease: 'easeOut',
            }}
          >
            <span className="text-sm opacity-60">{emoji}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function EmojiExplosion({ emoji, isWinner, onComplete }: EmojiExplosionProps) {
  const isJackpot = emoji === '\uD83C\uDF7D\uFE0F'; // plate with cutlery

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait">
      {isWinner ? (
        <WinnerExplosion
          key="winner"
          emoji={emoji}
          isJackpot={isJackpot}
          onComplete={handleComplete}
        />
      ) : (
        <LoserAnimation
          key="loser"
          emoji={emoji}
          onComplete={handleComplete}
        />
      )}
    </AnimatePresence>
  );
}
