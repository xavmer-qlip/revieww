'use client';

import { Logo } from '@/components/ui/logo';
import { motion } from 'motion/react';

const testimonial = {
  quote:
    'Mes clients jouent le jeu, ils laissent un avis et tournent la roue. Simple, efficace, et je récupère leurs emails.',
  author: 'Sophie M.',
  role: 'Gérante, Café du Marché',
  stars: 5,
};

function FloatingOrb({
  size,
  position,
  delay,
  duration,
}: {
  size: string;
  position: string;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      className={`absolute ${size} ${position} rounded-full blur-3xl opacity-20 pointer-events-none`}
      style={{
        background:
          'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.15, 1],
        opacity: [0.15, 0.25, 0.15],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background gradient layers */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(145deg, #0F1729 0%, #1B2A4A 40%, #0F1729 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, var(--color-primary-dark) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              'radial-gradient(ellipse at 80% 20%, var(--color-accent) 0%, transparent 50%)',
          }}
        />

        {/* Floating orbs */}
        <FloatingOrb
          size="w-72 h-72"
          position="top-[-5%] left-[-10%]"
          delay={0}
          duration={8}
        />
        <FloatingOrb
          size="w-96 h-96"
          position="bottom-[-10%] right-[-15%]"
          delay={2}
          duration={10}
        />
        <FloatingOrb
          size="w-56 h-56"
          position="top-[40%] right-[5%]"
          delay={4}
          duration={12}
        />

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Logo variant="light" size="xl" showTagline />
          </motion.div>
        </div>

        {/* Center decoration - subtle stars pattern */}
        <motion.div
          className="relative z-10 flex-1 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="text-[120px] leading-none select-none opacity-10 font-display font-extrabold text-white pointer-events-none">
            w
          </div>
        </motion.div>

        {/* Testimonial card */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
        >
          <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md">
            {/* Stars */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: testimonial.stars }).map((_, i) => (
                <motion.span
                  key={i}
                  className="text-primary text-lg"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                >
                  ★
                </motion.span>
              ))}
            </div>

            <p className="text-white/90 font-body text-sm leading-relaxed mb-4 italic">
              &ldquo;{testimonial.quote}&rdquo;
            </p>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display font-bold text-sm">
                {testimonial.author
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </div>
              <div>
                <p className="text-white font-display font-semibold text-sm">
                  {testimonial.author}
                </p>
                <p className="text-white/50 font-body text-xs">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Form area */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <Logo variant="dark" size="lg" showTagline />
          </div>

          {children}

          {/* Footer tagline */}
          <div className="mt-10 flex justify-center">
            <a
              href="https://revieww.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[10px] text-text-muted/50 hover:text-text-muted transition-colors inline-flex items-center gap-1"
            >
              Fait avec <span className="text-red-500">&#10084;</span> en Suisse &middot; revieww.ch
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
