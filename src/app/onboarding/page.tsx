'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, MailCheck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PLAN_SPIN_LIMITS,
  PLAN_CONTACT_LIMITS,
  SECTOR_PRESETS,
  mapGoogleCategoryToSector,
} from '@/lib/constants';
import type { SectorKey } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Step 0 — How it works
// ---------------------------------------------------------------------------

const HOW_IT_WORKS: { emoji: string; title: string; description: string }[] = [
  {
    emoji: '\u{1F4F1}',
    title: 'Votre client scanne le QR code',
    description: 'Sur vos tables, au comptoir, dans l\'addition',
  },
  {
    emoji: '\u{1F3A1}',
    title: 'Il tourne la roue',
    description: 'Il d\u00e9couvre son lot en quelques secondes',
  },
  {
    emoji: '\u{1F4E7}',
    title: 'Il laisse son email',
    description: 'Vous r\u00e9cup\u00e9rez un contact qualifi\u00e9',
  },
];

// ---------------------------------------------------------------------------
// Step 1 — Verify email
// ---------------------------------------------------------------------------

function StepVerifyEmail({
  businessId,
  onVerified,
}: {
  businessId: string;
  onVerified: () => void;
}) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Poll for email verification every 4 seconds
  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('businesses')
        .select('email_verified')
        .eq('id', businessId)
        .single();

      if (data?.email_verified) {
        clearInterval(interval);
        onVerified();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [businessId, onVerified]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      const res = await fetch('/api/send-verification', { method: 'POST' });
      if (res.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } finally {
      setResending(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* Animated mail icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-sky/10 flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <MailCheck className="w-8 h-8 text-sky" />
          </motion.div>
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
          V\u00e9rifiez votre email
        </h2>
        <p className="mt-2 text-text-muted font-body max-w-sm mx-auto">
          Nous avons envoy\u00e9 un lien de v\u00e9rification \u00e0 votre adresse email. Cliquez dessus pour activer votre page.
        </p>
      </div>

      {/* Resend button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resending}
          loading={resending}
        >
          <MailCheck size={14} />
          {resendSuccess ? 'Email envoy\u00e9 !' : 'Renvoyer l\'email'}
        </Button>
      </motion.div>

      {/* Polling indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-2 text-text-muted"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-3 h-3 rounded-full border-2 border-sky/30 border-t-sky"
        />
        <span className="text-xs font-body">En attente de v\u00e9rification...</span>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === currentStep ? 24 : 8,
            backgroundColor: i === currentStep ? '#FF6B35' : i < currentStep ? '#10B981' : '#D1D5DB',
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  // Step state
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detected sector (for default presets)
  const [detectedSector, setDetectedSector] = useState<SectorKey>('autre');

  // Created business (after step 0 completes)
  const [createdBusiness, setCreatedBusiness] = useState<{ id: string } | null>(null);

  // --- Load user metadata on mount (with localStorage fallback for OAuth) ---
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const meta = user.user_metadata ?? {};
      let cat = (meta.google_category as string) || null;

      // OAuth fallback: read business data saved before OAuth redirect
      if (!(meta.business_name as string)) {
        try {
          const stored = localStorage.getItem('oauth_business_data');
          if (stored) {
            const data = JSON.parse(stored);
            cat = data.google_category || null;
            localStorage.removeItem('oauth_business_data');

            // Persist to user metadata so it's available in business creation
            await supabase.auth.updateUser({
              data: {
                business_name: data.business_name,
                google_place_id: data.google_place_id,
                google_rating: data.google_rating,
                google_review_count: data.google_review_count,
                google_category: data.google_category,
                google_review_link: data.google_review_link,
                business_address: data.business_address,
                business_phone: data.business_phone,
                business_website: data.business_website,
              },
            });
          }
        } catch {
          // localStorage not available — ignore
        }
      }

      setDetectedSector(mapGoogleCategoryToSector(cat));
    }
    loadUser();
  }, []);

  // --- Email verified → redirect to dashboard ---
  const handleEmailVerified = useCallback(() => {
    window.location.href = '/dashboard';
  }, []);

  // --- Step 0: "Suivant" — create business with default presets + send verification ---
  const handleNext = useCallback(async () => {
    if (step !== 0) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Session expir\u00e9e. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      const meta = user.user_metadata ?? {};
      const name = (meta.business_name as string) || '';

      if (!name.trim()) {
        setError('Donn\u00e9es du commerce introuvables. Veuillez vous r\u00e9inscrire.');
        setLoading(false);
        return;
      }

      // Build default presets from detected sector (all enabled, default stock)
      const sectorPresets = SECTOR_PRESETS[detectedSector];
      const enabledPresets = sectorPresets.map((p) => ({
        ...p,
        stock: p.suggestedStock,
      }));

      // Create business with defaults
      const spinLimit = PLAN_SPIN_LIMITS.free;
      const contactLimit = PLAN_CONTACT_LIMITS.free;

      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: name.trim(),
          slug: slugify(name.trim()) + '-' + Date.now().toString(36),
          google_review_link: (meta.google_review_link as string) || null,
          google_place_id: (meta.google_place_id as string) || null,
          google_rating: (meta.google_rating as number) ?? null,
          google_review_count: (meta.google_review_count as number) ?? 0,
          google_business_category: (meta.google_category as string) || null,
          address: (meta.business_address as string) || null,
          phone: (meta.business_phone as string) || null,
          website_url: (meta.business_website as string) || null,
          plan_type: 'free',
          monthly_spin_limit: spinLimit,
          contact_limit: contactLimit,
          subscription_status: 'free',
          trial_ends_at: new Date().toISOString(),
          primary_color: '#FF6B35',
          secondary_color: '#1B2A4A',
          onboarding_completed: true,
          flow_type: 'lottery_first',
          require_review: false,
          require_pin: false,
        })
        .select()
        .single();

      if (bizError || !business) {
        console.error('Business creation error:', bizError);
        setError('Erreur lors de la cr\u00e9ation du commerce. R\u00e9essayez.');
        setLoading(false);
        return;
      }

      // Calculate probabilities: 30% for losers, 70% for winners
      const winners = enabledPresets.filter((p) => p.isWinning);
      const losers = enabledPresets.filter((p) => !p.isWinning);
      const loserProb = losers.length > 0 ? Math.floor(30 / losers.length) : 0;
      const winnerProb = winners.length > 0 ? Math.floor(70 / winners.length) : 0;

      // Adjust for remainder
      const totalCalc = loserProb * losers.length + winnerProb * winners.length;
      const remainder = 100 - totalCalc;

      const segmentsToInsert = enabledPresets.map((preset, position) => {
        const isLoser = !preset.isWinning;
        const prob = isLoser ? loserProb : winnerProb;

        return {
          business_id: business.id,
          label: preset.label,
          emoji: preset.emoji,
          color: preset.color,
          is_winning: preset.isWinning,
          probability: prob + (position === 0 ? remainder : 0),
          position,
          monthly_stock: preset.isWinning ? preset.stock : 0,
        };
      });

      const { error: segError } = await supabase
        .from('wheel_segments')
        .insert(segmentsToInsert);

      if (segError) {
        console.error('Segments insertion error:', segError);
      }

      setCreatedBusiness({ id: business.id });
      setStep(1);

      // Fire-and-forget: send verification email
      fetch('/api/send-verification', { method: 'POST' }).catch(() => {});
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Une erreur est survenue. R\u00e9essayez.');
    } finally {
      setLoading(false);
    }
  }, [step, detectedSector]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-8 pb-4">
        <Logo size="md" showTagline />
      </header>

      {/* Step indicator */}
      <div className="py-3">
        <StepIndicator currentStep={step} totalSteps={2} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-2">
        <Card
          padding="lg"
          className="w-full max-w-2xl relative overflow-hidden"
        >
          {/* Step content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {/* How it works */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
                        Comment \u00e7a marche
                      </h2>
                      <p className="mt-2 text-text-muted font-body">
                        Votre animation commerciale en 1 minute
                      </p>
                    </div>

                    <div className="space-y-4 max-w-md mx-auto">
                      {HOW_IT_WORKS.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.15 }}
                          className="flex items-start gap-4"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-2xl">
                            {item.emoji}
                          </div>
                          <div>
                            <h3 className="text-sm font-display font-semibold text-text">
                              {item.title}
                            </h3>
                            <p className="text-xs font-body text-text-muted mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 1 && createdBusiness && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <StepVerifyEmail
                    businessId={createdBusiness.id}
                    onVerified={handleEmailVerified}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-danger font-body mt-4"
            >
              {error}
            </motion.p>
          )}

          {/* Footer action — only on step 0 */}
          {step === 0 && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={handleNext}
                loading={loading}
                className="w-full sm:w-auto min-w-[200px]"
              >
                Suivant
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
