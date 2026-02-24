'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, Star, ChevronRight, Clock, Gift, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { WheelCanvas } from '@/components/wheel/wheel-canvas';
import { EmojiExplosion } from '@/components/wheel/emoji-explosion';
import { Business, WheelSegment } from '@/lib/types';
import { TEXTS, APP_URL } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import QRCode from 'qrcode';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlayFlowProps {
  business: Business;
  segments: WheelSegment[];
}

type Step = 'welcome' | 'verification' | 'email' | 'wheel' | 'result';

interface SpinResult {
  id: string;
  label: string;
  emoji: string;
  is_winning: boolean;
  promo_code: string | null;
  validation_code: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_DAYS = 7;
const MIN_GOOGLE_SECONDS = 15;
const GOOD_GOOGLE_SECONDS = 30;

function getStorageKey(slug: string) {
  return `revieww_spin_${slug}`;
}

function hasRecentSpin(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(getStorageKey(slug));
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    const daysSince = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return daysSince < COOLDOWN_DAYS;
  } catch {
    return false;
  }
}

function saveSpin(slug: string) {
  try {
    localStorage.setItem(getStorageKey(slug), Date.now().toString());
  } catch {
    // localStorage not available
  }
}

// ---------------------------------------------------------------------------
// Slide variants for AnimatePresence transitions
// ---------------------------------------------------------------------------

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

const slideTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// ---------------------------------------------------------------------------
// PlayFlow Component
// ---------------------------------------------------------------------------

export function PlayFlow({ business, segments }: PlayFlowProps) {
  // ---- State ----
  const [step, setStep] = useState<Step>('welcome');
  const [direction, setDirection] = useState(1);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  // Step 1.5 – verification
  const [googleClickTime, setGoogleClickTime] = useState<number | null>(null);
  const [timeOnGoogle, setTimeOnGoogle] = useState(0);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const visibilityRef = useRef<number | null>(null);

  // Step 2 – email
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [optedIn, setOptedIn] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 3 – wheel & result
  const [targetSegmentId, setTargetSegmentId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [showExplosion, setShowExplosion] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Validation QR code
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Error states
  const [apiError, setApiError] = useState<string | null>(null);

  // Wheel sizing
  const [wheelSize, setWheelSize] = useState(320);

  // ---- Anti-triche check on mount ----
  useEffect(() => {
    if (hasRecentSpin(business.slug)) {
      setAlreadyPlayed(true);
    }
  }, [business.slug]);

  // ---- Generate QR code for validation ----
  useEffect(() => {
    if (spinResult?.validation_code && spinResult.is_winning) {
      const url = `${APP_URL}/validate/${spinResult.validation_code}`;
      QRCode.toDataURL(url, { width: 160, margin: 1 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [spinResult]);

  // ---- Responsive wheel size ----
  useEffect(() => {
    function updateSize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const maxDim = Math.min(vw - 40, vh * 0.55, 440);
      setWheelSize(Math.max(240, maxDim));
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // ---- Navigation ----
  const goTo = useCallback(
    (next: Step) => {
      const order: Step[] = [
        'welcome',
        'verification',
        'email',
        'wheel',
        'result',
      ];
      const currentIdx = order.indexOf(step);
      const nextIdx = order.indexOf(next);
      setDirection(nextIdx > currentIdx ? 1 : -1);
      setStep(next);
    },
    [step]
  );

  // ---- Visibility API for Google review time tracking ----
  useEffect(() => {
    function handleVisibilityChange() {
      if (!googleClickTime) return;

      if (document.hidden) {
        // User left the tab
        visibilityRef.current = Date.now();
      } else {
        // User returned
        if (visibilityRef.current) {
          const awaySeconds = Math.round(
            (Date.now() - visibilityRef.current) / 1000
          );
          setTimeOnGoogle(awaySeconds);
          visibilityRef.current = null;

          if (awaySeconds < MIN_GOOGLE_SECONDS) {
            setShowWaitMessage(true);
          } else {
            setShowWaitMessage(false);
            goTo('verification');
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [googleClickTime, goTo]);

  // ---- Handlers ----

  function handleGoogleClick() {
    if (!business.google_review_link) return;
    setGoogleClickTime(Date.now());
    visibilityRef.current = Date.now();
    window.open(business.google_review_link, '_blank', 'noopener');
  }

  function handleConfirmReview() {
    goTo('email');
  }

  function calculateConfidenceScore(): number {
    let score = 0;
    // Clicked the Google review link
    if (googleClickTime) score += 20;
    // Time on Google >= 30 seconds
    if (timeOnGoogle >= GOOD_GOOGLE_SECONDS) score += 30;
    // Confirmed they left a review
    score += 30;
    // Selected star rating
    if (selectedStars > 0) score += 20;
    return score;
  }

  async function handleSpinSubmit() {
    // Validate email
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Veuillez entrer un email valide');
      return;
    }
    setEmailError('');
    setSubmitting(true);
    setApiError(null);

    try {
      const res = await fetch('/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          email,
          phone: phone || null,
          optedInMarketing: optedIn,
          confidenceScore: calculateConfidenceScore(),
          timeOnGoogleSeconds: timeOnGoogle,
          selfReportedStars: selectedStars || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === 'quota_reached') {
          setApiError(TEXTS.play.quotaReached);
        } else if (data.error === 'all_prizes_exhausted') {
          setApiError('Tous les lots ont été distribués ce mois. Revenez bientôt !');
        } else if (data.error === 'subscription_inactive') {
          setApiError(TEXTS.play.paused);
        } else {
          setApiError(data.error || 'Une erreur est survenue');
        }
        setSubmitting(false);
        return;
      }

      // Success — set target and go to wheel
      setTargetSegmentId(data.segment.id);
      setSpinResult({
        id: data.segment.id,
        label: data.segment.label,
        emoji: data.segment.emoji,
        is_winning: data.segment.is_winning,
        promo_code: data.segment.promo_code,
        validation_code: data.validation_code ?? null,
      });
      goTo('wheel');

      // Slight delay then start spinning
      setTimeout(() => setSpinning(true), 600);
    } catch {
      setApiError('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSpinEnd() {
    setSpinning(false);
    saveSpin(business.slug);

    // Trigger emoji explosion
    setShowExplosion(true);
  }

  function handleExplosionComplete() {
    setShowExplosion(false);
    // Show result card with a small delay for dramatic effect
    setTimeout(() => {
      setShowResult(true);
      goTo('result');
    }, 300);
  }

  // ---- Already played gate ----
  if (alreadyPlayed) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-6 bg-gradient-to-br from-[var(--business-secondary)] to-[var(--business-primary)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-xl font-display font-bold text-text mb-2">
            {TEXTS.play.alreadyPlayed}
          </h2>
          <p className="text-text-muted font-body text-sm">
            Vous pourrez rejouer dans quelques jours.
          </p>
        </motion.div>
      </div>
    );
  }

  // ---- API error gate ----
  if (apiError && step !== 'email') {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center p-6 bg-gradient-to-br from-[var(--business-secondary)] to-[var(--business-primary)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">😊</span>
          </div>
          <h2 className="text-xl font-display font-bold text-text mb-2">
            {apiError}
          </h2>
        </motion.div>
      </div>
    );
  }

  // ---- Main render ----
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[var(--business-secondary)] via-[color-mix(in_srgb,var(--business-secondary)_60%,var(--business-primary))] to-[var(--business-primary)]">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ background: business.primary_color }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: business.secondary_color }}
        />
        <div
          className="absolute top-1/3 right-10 w-4 h-4 rounded-full opacity-20"
          style={{ background: business.primary_color }}
        />
        <div
          className="absolute bottom-1/4 left-8 w-3 h-3 rounded-full opacity-20"
          style={{ background: '#fff' }}
        />
      </div>

      {/* Powered by revieww - top */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="opacity-60 hover:opacity-100 transition-opacity">
          <Logo size="sm" variant="light" />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-md mx-auto px-5 py-16 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ================================================================
              STEP 1: WELCOME
              ================================================================ */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="flex flex-col items-center text-center"
            >
              {/* Business logo / initials */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mb-6"
              >
                {business.logo_url ? (
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                    <Image
                      src={business.logo_url}
                      alt={business.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/20 text-white font-display font-bold text-2xl"
                    style={{ backgroundColor: business.primary_color }}
                  >
                    {getInitials(business.name)}
                  </div>
                )}
              </motion.div>

              {/* Business name */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-2xl sm:text-3xl font-display font-extrabold text-white mb-3"
              >
                {business.name}
              </motion.h1>

              {/* Welcome text */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-white/80 font-body text-base sm:text-lg mb-8 max-w-xs leading-relaxed"
              >
                {TEXTS.play.welcome} 🎁
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full"
              >
                <button
                  onClick={handleGoogleClick}
                  className="w-full py-4 px-8 rounded-2xl font-display font-bold text-lg text-white shadow-2xl
                    flex items-center justify-center gap-3
                    hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${business.primary_color}, ${business.primary_color}dd)`,
                    boxShadow: `0 8px 32px ${business.primary_color}66`,
                  }}
                >
                  <Star className="w-5 h-5 fill-current" />
                  {TEXTS.play.cta}
                </button>
              </motion.div>

              {/* Small text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-5 text-white/50 font-body text-xs max-w-xs leading-relaxed"
              >
                Apres avoir laisse votre avis, revenez ici pour tourner la roue
              </motion.p>

              {/* Wait message */}
              <AnimatePresence>
                {showWaitMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                      <p className="text-white/90 font-body text-sm">
                        {TEXTS.play.waitMessage}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ================================================================
              STEP 1.5: VERIFICATION (star rating)
              ================================================================ */}
          {step === 'verification' && (
            <motion.div
              key="verification"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6"
              >
                <Check className="w-8 h-8 text-accent" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-xl sm:text-2xl font-display font-bold text-white mb-2"
              >
                {TEXTS.play.starsQuestion}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 font-body text-sm mb-8"
              >
                Cela nous aide a nous ameliorer
              </motion.p>

              {/* Star rating */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center gap-3 mb-8"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    onClick={() => setSelectedStars(star)}
                    whileTap={{ scale: 0.85 }}
                    animate={
                      selectedStars >= star
                        ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className="cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 sm:w-12 sm:h-12 transition-colors duration-200',
                        selectedStars >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white/30'
                      )}
                    />
                  </motion.button>
                ))}
              </motion.div>

              {/* Confirm button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full"
              >
                <button
                  onClick={handleConfirmReview}
                  disabled={selectedStars === 0}
                  className="w-full py-4 px-8 rounded-2xl font-display font-bold text-lg text-white shadow-2xl
                    flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                    hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background:
                      selectedStars > 0
                        ? `linear-gradient(135deg, #10B981, #059669)`
                        : 'rgba(255,255,255,0.1)',
                    boxShadow:
                      selectedStars > 0
                        ? '0 8px 32px rgba(16,185,129,0.4)'
                        : 'none',
                  }}
                >
                  {TEXTS.play.confirmButton} ✅
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ================================================================
              STEP 2: EMAIL + SPIN
              ================================================================ */}
          {step === 'email' && (
            <motion.div
              key="email"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="flex flex-col items-center"
            >
              {/* Celebration header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 15,
                  delay: 0.1,
                }}
                className="text-4xl mb-4"
              >
                🎉
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-xl sm:text-2xl font-display font-bold text-white mb-1 text-center"
              >
                {TEXTS.play.emailTitle} 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-white/60 font-body text-sm mb-6 text-center"
              >
                {TEXTS.play.emailPlaceholder}
              </motion.p>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4"
              >
                {/* Email */}
                <Input
                  id="play-email"
                  type="email"
                  placeholder="votre@email.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  error={emailError}
                  required
                  autoComplete="email"
                />

                {/* Phone */}
                <Input
                  id="play-phone"
                  type="tel"
                  placeholder={TEXTS.play.phonePlaceholder}
                  icon={<Phone className="w-4 h-4" />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />

                {/* Opt-in checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={optedIn}
                      onChange={(e) => setOptedIn(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center',
                        optedIn
                          ? 'border-accent bg-accent'
                          : 'border-border bg-surface group-hover:border-primary'
                      )}
                    >
                      {optedIn && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="text-sm font-body text-text-muted leading-snug">
                    {TEXTS.play.optIn} {business.name}
                  </span>
                </label>

                {/* API error in email step */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 text-danger rounded-2xl px-4 py-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        <p className="text-sm font-body">{apiError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Spin button */}
                <Button
                  onClick={handleSpinSubmit}
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  disabled={!email || submitting}
                  className="w-full text-lg"
                >
                  {!submitting && '🎰'} {TEXTS.play.spinButton}
                  {!submitting && <ChevronRight className="w-5 h-5" />}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ================================================================
              STEP 3: WHEEL
              ================================================================ */}
          {step === 'wheel' && !showResult && (
            <motion.div
              key="wheel"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="flex flex-col items-center"
            >
              {/* Wheel entrance animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  mass: 1.2,
                }}
              >
                <WheelCanvas
                  segments={segments}
                  size={wheelSize}
                  spinning={spinning}
                  onSpinEnd={handleSpinEnd}
                  targetSegmentId={targetSegmentId || undefined}
                />
              </motion.div>

              {/* Emoji explosion overlay */}
              <AnimatePresence>
                {showExplosion && spinResult && (
                  <EmojiExplosion
                    emoji={spinResult.emoji}
                    isWinner={spinResult.is_winning}
                    onComplete={handleExplosionComplete}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ================================================================
              STEP 4: RESULT
              ================================================================ */}
          {step === 'result' && spinResult && (
            <motion.div
              key="result"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="flex flex-col items-center text-center w-full"
            >
              {spinResult.is_winning ? (
                // ---- WINNER ----
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm"
                >
                  {/* Prize emoji */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="text-6xl mb-4"
                  >
                    {spinResult.emoji}
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-display font-extrabold text-text mb-1"
                  >
                    {TEXTS.play.wonTitle}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-text-muted font-body text-sm mb-3"
                  >
                    {TEXTS.play.wonSubtitle}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${business.primary_color}15, ${business.primary_color}30)`,
                      border: `2px solid ${business.primary_color}40`,
                    }}
                  >
                    <p
                      className="text-xl font-display font-bold"
                      style={{ color: business.primary_color }}
                    >
                      {spinResult.label}
                    </p>
                  </motion.div>

                  {/* Promo code */}
                  {spinResult.promo_code && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-secondary/5 rounded-xl px-4 py-3 mb-4"
                    >
                      <p className="text-xs text-text-muted font-body mb-1">
                        Code promo
                      </p>
                      <p className="text-lg font-display font-bold text-secondary tracking-wider">
                        {spinResult.promo_code}
                      </p>
                    </motion.div>
                  )}

                  {/* Validation code + QR */}
                  {spinResult.validation_code && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl px-4 py-4 mb-4"
                    >
                      <p className="text-xs text-text-muted font-body mb-1">
                        {TEXTS.play.validationCode}
                      </p>
                      <p className="text-2xl font-display font-extrabold text-blue-700 tracking-[0.15em]">
                        {spinResult.validation_code}
                      </p>
                      {qrDataUrl && (
                        <div className="mt-3 flex justify-center">
                          <img
                            src={qrDataUrl}
                            alt="QR code de validation"
                            className="w-28 h-28 rounded-lg"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Instruction */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center justify-center gap-2 text-accent"
                  >
                    <Gift className="w-4 h-4" />
                    <p className="font-body text-sm font-medium">
                      {TEXTS.play.wonInstruction}
                    </p>
                  </motion.div>

                  {/* Validity */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-3 text-text-muted font-body text-xs"
                  >
                    Valable 7 jours
                  </motion.p>
                </motion.div>
              ) : (
                // ---- LOSER ----
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl w-full max-w-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="text-5xl mb-4"
                  >
                    {spinResult.emoji}
                  </motion.div>

                  <h2 className="text-xl font-display font-bold text-text mb-2">
                    {TEXTS.play.lostTitle}
                  </h2>
                  <p className="text-text-muted font-body text-sm">
                    {TEXTS.play.lostSubtitle} 😊
                  </p>
                </motion.div>
              )}

              {/* Powered by footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8"
              >
                <a
                  href="https://revieww.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white/70 font-body text-xs transition-colors"
                >
                  Propulse par revieww.ch
                </a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
