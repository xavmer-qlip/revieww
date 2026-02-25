'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, ChevronRight, Clock, Gift, AlertCircle, Check, Globe, Instagram, Facebook, Star } from 'lucide-react';
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

type Step = 'welcome' | 'wheel' | 'email' | 'result';

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

function getStorageKey(slug: string) {
  return `woopla_spin_${slug}`;
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
// Revieww footer tagline (reusable)
// ---------------------------------------------------------------------------

function ReviewwFooter({ variant = 'light', className = '' }: { variant?: 'light' | 'dark'; className?: string }) {
  const colors = variant === 'light'
    ? 'text-white/40 hover:text-white/70'
    : 'text-text-muted/50 hover:text-text-muted';
  const heartColor = variant === 'light' ? 'text-red-400' : 'text-red-500';
  return (
    <a
      href="https://woopla.ch"
      target="_blank"
      rel="noopener noreferrer"
      className={`font-body text-[10px] transition-colors inline-flex items-center gap-1 ${colors} ${className}`}
    >
      Fait avec <span className={heartColor}>&#10084;</span> en Suisse &middot; woopla.ch
    </a>
  );
}

// Export for use in other components
export { ReviewwFooter };

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
// TikTok icon (lucide-react doesn't include it)
// ---------------------------------------------------------------------------

function TikTokIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Google icon for review CTA
// ---------------------------------------------------------------------------

function GoogleIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Social links row (reusable for welcome + result)
// ---------------------------------------------------------------------------

function SocialLinks({ business, variant = 'light' }: { business: Business; variant?: 'light' | 'dark' }) {
  const links: { url: string; icon: React.ReactNode; label: string }[] = [];

  if (business.website_url) {
    const url = business.website_url.startsWith('http') ? business.website_url : `https://${business.website_url}`;
    links.push({ url, icon: <Globe size={16} />, label: 'Site web' });
  }
  if (business.instagram_url) {
    const raw = business.instagram_url;
    const url = raw.startsWith('http') ? raw : `https://instagram.com/${raw.replace(/^@/, '')}`;
    links.push({ url, icon: <Instagram size={16} />, label: 'Instagram' });
  }
  if (business.facebook_url) {
    const url = business.facebook_url.startsWith('http') ? business.facebook_url : `https://facebook.com/${business.facebook_url}`;
    links.push({ url, icon: <Facebook size={16} />, label: 'Facebook' });
  }
  if (business.tiktok_url) {
    const raw = business.tiktok_url;
    const url = raw.startsWith('http') ? raw : `https://tiktok.com/@${raw.replace(/^@/, '')}`;
    links.push({ url, icon: <TikTokIcon size={16} />, label: 'TikTok' });
  }
  if (business.google_review_link) {
    links.push({ url: business.google_review_link, icon: <GoogleIcon size={16} />, label: 'Google' });
  }

  if (links.length === 0) return null;

  const iconClass = variant === 'light'
    ? 'w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/80 hover:bg-white/25 hover:text-white transition-all'
    : 'w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all';

  return (
    <div className="flex items-center justify-center gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={iconClass}
          title={link.label}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlayFlow Component
// ---------------------------------------------------------------------------

export function PlayFlow({ business, segments }: PlayFlowProps) {
  // ---- Fixed step order: pure lottery flow ----
  const stepOrder: Step[] = useMemo(() => {
    return ['welcome', 'wheel', 'email', 'result'];
  }, []);

  // ---- State ----
  const [step, setStep] = useState<Step>('welcome');
  const [direction, setDirection] = useState(1);
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);

  // PIN
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Reservation token + prize
  const [reserveToken, setReserveToken] = useState<string | null>(null);
  const [lockedPrize, setLockedPrize] = useState<{
    label: string;
    emoji: string;
    is_winning: boolean;
  } | null>(null);

  // Email form
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [optedIn, setOptedIn] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Wheel & result
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
      const currentIdx = stepOrder.indexOf(step);
      const nextIdx = stepOrder.indexOf(next);
      setDirection(nextIdx > currentIdx ? 1 : -1);
      setStep(next);
    },
    [step, stepOrder]
  );

  // ---- Reserve a spin ----
  async function handleReserveSpin() {
    setSubmitting(true);
    setApiError(null);
    setPinError('');

    try {
      const body: Record<string, string> = { businessId: business.id };
      if (business.require_pin && pin) {
        body.pin = pin;
      }

      const res = await fetch('/api/spin/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error === 'pin_required' || data.error === 'invalid_pin') {
          setPinError('Code incorrect');
          setSubmitting(false);
          return;
        } else if (data.error === 'quota_reached') {
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

      // Store token and prize info
      setReserveToken(data.token);
      setLockedPrize({
        label: data.segment.label,
        emoji: data.segment.emoji,
        is_winning: data.segment.is_winning,
      });
      setTargetSegmentId(data.segment.id);

      // Go to wheel
      goTo('wheel');
      setTimeout(() => setSpinning(true), 600);
    } catch {
      setApiError('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Submit email + confirm spin ----
  async function handleSpinSubmit() {
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Veuillez entrer un email valide');
      return;
    }
    setEmailError('');
    setSubmitting(true);
    setApiError(null);

    try {
      if (reserveToken) {
        const res = await fetch('/api/spin/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: reserveToken,
            email,
            phone: phone || null,
            optedInMarketing: optedIn,
            confidenceScore: 0,
            timeOnGoogleSeconds: null,
            selfReportedStars: null,
          }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          if (data.error === 'token_expired') {
            setApiError('Le délai a expiré. Veuillez recommencer.');
          } else if (data.error === 'already_played') {
            setApiError(TEXTS.play.alreadyPlayed);
          } else {
            setApiError(data.error || 'Une erreur est survenue');
          }
          setSubmitting(false);
          return;
        }

        // Set spin result from confirmation
        setSpinResult({
          id: data.segment.id,
          label: data.segment.label,
          emoji: data.segment.emoji,
          is_winning: data.segment.is_winning,
          promo_code: data.segment.promo_code,
          validation_code: data.validation_code ?? null,
        });
        saveSpin(business.slug);
        goTo('result');
      } else {
        // Fallback: direct spin (shouldn't happen in normal flow)
        const res = await fetch('/api/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            email,
            phone: phone || null,
            optedInMarketing: optedIn,
            confidenceScore: 0,
            timeOnGoogleSeconds: null,
            selfReportedStars: null,
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
        setTimeout(() => setSpinning(true), 600);
      }
    } catch {
      setApiError('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSpinEnd() {
    setSpinning(false);
    // Trigger emoji explosion
    setShowExplosion(true);
  }

  function handleExplosionComplete() {
    setShowExplosion(false);
    setTimeout(() => {
      setShowResult(true);
      // After wheel → go to email step
      goTo('email');
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
  if (apiError && step !== 'email' && step !== 'welcome') {
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

      {/* Powered by woopla - top */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
        <div className="opacity-60 hover:opacity-100 transition-opacity">
          <Logo size="sm" variant="light" />
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-md mx-auto px-5 py-16 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ================================================================
              STEP: WELCOME
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
              {/* Business card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6 w-full max-w-xs border border-white/15"
              >
                <div className="flex items-center gap-3">
                  {/* Photo */}
                  {business.logo_url ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0">
                      <Image
                        src={business.logo_url}
                        alt={business.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : business.google_place_id ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg border-2 border-white/20 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/places/photo?placeId=${business.google_place_id}`}
                        alt={business.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.className = 'w-14 h-14 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20 text-white font-display font-bold text-lg shrink-0';
                            parent.style.backgroundColor = business.primary_color;
                            parent.textContent = getInitials(business.name);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/20 text-white font-display font-bold text-lg shrink-0"
                      style={{ backgroundColor: business.primary_color }}
                    >
                      {getInitials(business.name)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="min-w-0 flex-1 text-left">
                    <h1 className="text-lg font-display font-extrabold text-white truncate">
                      {business.name}
                    </h1>

                    {business.phone && (
                      <a
                        href={`tel:${business.phone}`}
                        className="flex items-center gap-1 mt-0.5 text-white/60 hover:text-white/90 transition-colors"
                      >
                        <Phone size={11} />
                        <span className="text-xs font-body">{business.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Social links */}
                <div className="mt-3">
                  <SocialLinks business={business} variant="light" />
                </div>
              </motion.div>

              {/* CTA: Spin the wheel */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-white/80 font-body text-base sm:text-lg mb-6 max-w-xs leading-relaxed"
              >
                {TEXTS.play.welcome} 🎁
              </motion.p>

              {/* PIN input (only if require_pin) */}
              {business.require_pin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="w-full max-w-xs mb-6"
                >
                  <p className="text-white/60 font-body text-xs text-center mb-3">
                    Code fourni par le commerce
                  </p>
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={pin[i] || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (!val && pin[i]) {
                            // Delete character
                            setPin((prev) => prev.slice(0, i) + prev.slice(i + 1));
                            return;
                          }
                          if (!val) return;
                          const newPin = pin.split('');
                          newPin[i] = val[0];
                          const joined = newPin.join('').slice(0, 4);
                          setPin(joined);
                          setPinError('');
                          // Auto-focus next input
                          if (i < 3) {
                            const next = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                            next?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !pin[i] && i > 0) {
                            const prev = (e.target as HTMLElement).parentElement?.children[i - 1] as HTMLInputElement;
                            prev?.focus();
                            setPin((p) => p.slice(0, i - 1) + p.slice(i));
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                          if (pasted) {
                            setPin(pasted);
                            setPinError('');
                            // Focus last filled input
                            const target = (e.target as HTMLElement).parentElement?.children[Math.min(pasted.length, 3)] as HTMLInputElement;
                            target?.focus();
                          }
                        }}
                        className={cn(
                          'w-14 h-16 text-center text-2xl font-display font-bold rounded-xl border-2 bg-white/10 text-white backdrop-blur-sm transition-all focus:outline-none',
                          pinError
                            ? 'border-red-400 bg-red-400/10'
                            : pin[i]
                              ? 'border-white/40'
                              : 'border-white/20 focus:border-white/50'
                        )}
                      />
                    ))}
                  </div>
                  {pinError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-300 text-xs font-body text-center mt-2"
                    >
                      {pinError}
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* API error in welcome */}
              <AnimatePresence>
                {apiError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden w-full mb-4"
                  >
                    <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl px-4 py-3">
                      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                      <p className="text-sm font-body">{apiError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-full"
              >
                <button
                  onClick={handleReserveSpin}
                  disabled={submitting || (business.require_pin && pin.length < 4)}
                  className={cn(
                    'relative w-full py-4 px-8 rounded-2xl font-display font-bold text-lg text-white overflow-hidden',
                    'flex items-center justify-center gap-3',
                    'active:scale-[0.96] transition-all duration-200 cursor-pointer',
                    (submitting || (business.require_pin && pin.length < 4))
                      ? 'opacity-50 cursor-not-allowed grayscale'
                      : 'hover:scale-[1.02] hover:shadow-3xl'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${business.primary_color}, ${business.primary_color}cc, ${business.primary_color})`,
                    boxShadow: (submitting || (business.require_pin && pin.length < 4))
                      ? 'none'
                      : `0 8px 40px ${business.primary_color}80, 0 2px 12px ${business.primary_color}40`,
                  }}
                >
                  {/* Shimmer effect */}
                  {!submitting && !(business.require_pin && pin.length < 4) && (
                    <span
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
                        animation: 'shimmer 2.5s infinite',
                      }}
                    />
                  )}
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <span className="text-2xl">🎡</span>
                      <span>{TEXTS.play.cta}</span>
                      <ChevronRight size={20} className="ml-1" />
                    </>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ================================================================
              STEP: EMAIL
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
                {lockedPrize && !lockedPrize.is_winning ? '🙏' : '🎉'}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-xl sm:text-2xl font-display font-bold text-white mb-1 text-center"
              >
                {lockedPrize && !lockedPrize.is_winning
                  ? TEXTS.play.lostEmailTitle
                  : `${TEXTS.play.noReviewEmailTitle} 🎉`}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-white/60 font-body text-sm mb-6 text-center"
              >
                {lockedPrize && !lockedPrize.is_winning
                  ? TEXTS.play.lostEmailSubtitle
                  : TEXTS.play.noReviewEmailSubtitle}
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
                          ? 'border-primary bg-primary'
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

                {/* Submit button */}
                <Button
                  onClick={handleSpinSubmit}
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  disabled={!email || submitting}
                  className="w-full text-lg"
                >
                  {lockedPrize && !lockedPrize.is_winning ? (
                    <>
                      {!submitting && TEXTS.play.lostEmailCta}
                      {!submitting && <ChevronRight className="w-5 h-5" />}
                    </>
                  ) : (
                    <>
                      {!submitting && '🎁'} Débloquer mon cadeau
                      {!submitting && <ChevronRight className="w-5 h-5" />}
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ================================================================
              STEP: WHEEL
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
                {showExplosion && (lockedPrize || spinResult) && (
                  <EmojiExplosion
                    emoji={(lockedPrize || spinResult)!.emoji}
                    isWinner={(lockedPrize || spinResult)!.is_winning}
                    onComplete={handleExplosionComplete}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ================================================================
              STEP: RESULT
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
                    className="flex items-center justify-center gap-2 text-success"
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

                  {/* Google review CTA — prominent, but optional */}
                  {business.google_review_link && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="mt-5 pt-4 border-t border-gray-100"
                    >
                      <p className="text-xs font-body text-text-muted mb-3">
                        Votre expérience vous a plu ?
                      </p>
                      <a
                        href={business.google_review_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl font-display font-bold text-sm
                          bg-white border-2 border-gray-200 text-text shadow-sm
                          hover:border-amber-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      >
                        <GoogleIcon size={20} />
                        <span>Laisser un avis sur Google</span>
                        <div className="flex gap-0.5 ml-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </a>
                    </motion.div>
                  )}

                  {/* Social links — follow us */}
                  {(business.instagram_url || business.facebook_url || business.tiktok_url || business.website_url) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                      className="mt-4 pt-3 border-t border-gray-100"
                    >
                      <p className="text-xs font-body text-text-muted mb-2">
                        Suivez {business.name}
                      </p>
                      <SocialLinks business={business} variant="dark" />
                    </motion.div>
                  )}
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
                  <p className="text-text-muted font-body text-sm mb-4">
                    {TEXTS.play.lostSubtitle} 😊
                  </p>

                  {/* Social links for losers too */}
                  {(business.instagram_url || business.facebook_url || business.tiktok_url || business.website_url || business.google_review_link) && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-body text-text-muted/70 mb-2">
                        Suivez {business.name}
                      </p>
                      <SocialLinks business={business} variant="dark" />
                    </div>
                  )}
                </motion.div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent footer on all steps */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        <ReviewwFooter variant="light" />
      </div>
    </div>
  );
}
