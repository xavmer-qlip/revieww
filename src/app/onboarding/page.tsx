'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WHEEL_TEMPLATES, TEXTS, PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS } from '@/lib/constants';
import { slugify, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Configure Wheel step
// ---------------------------------------------------------------------------

function StepConfigureWheel({
  selectedSegments,
  onToggle,
}: {
  selectedSegments: number[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
          {TEXTS.onboarding.step2Title}
        </h2>
        <p className="mt-2 text-text-muted font-body">
          {TEXTS.onboarding.step2Subtitle}
        </p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
        {WHEEL_TEMPLATES.map((template, index) => {
          const isSelected = selectedSegments.includes(index);

          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => onToggle(index)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'relative flex items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-left transition-all duration-200 cursor-pointer bg-surface',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border/50 hover:border-primary/30'
              )}
            >
              {/* Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                >
                  <Check size={10} strokeWidth={3} />
                </motion.div>
              )}

              <span className="text-xl">{template.emoji}</span>
              <span className="text-sm font-medium font-body text-text truncate">
                {template.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Selected pills */}
      {selectedSegments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {selectedSegments.map((idx) => {
            const t = WHEEL_TEMPLATES[idx];
            return (
              <Badge key={idx} variant="primary" size="md">
                {t.emoji} {t.label}
              </Badge>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page (single step: wheel config)
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();

  // Wheel config
  const [selectedSegments, setSelectedSegments] = useState<number[]>([0, 1, 2, 3, 6]);

  // Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Toggle segment ---
  const toggleSegment = useCallback((index: number) => {
    setSelectedSegments((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const canFinish = selectedSegments.length >= 3;

  // --- Complete onboarding ---
  const handleComplete = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setLoading(false);
        return;
      }

      // Read business data from user_metadata (set during signup)
      const meta = user.user_metadata ?? {};
      const businessName = (meta.business_name as string) || '';

      if (!businessName.trim()) {
        setError('Données du commerce introuvables. Veuillez vous réinscrire.');
        setLoading(false);
        return;
      }

      // Free plan: 30 spins, 30 contacts
      const spinLimit = PLAN_SPIN_LIMITS.free;
      const contactLimit = PLAN_CONTACT_LIMITS.free;

      // Create business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: businessName.trim(),
          slug: slugify(businessName.trim()) + '-' + Date.now().toString(36),
          google_review_link: (meta.google_review_link as string) || null,
          google_place_id: (meta.google_place_id as string) || null,
          google_rating: (meta.google_rating as number) ?? null,
          google_review_count: (meta.google_review_count as number) ?? 0,
          google_business_category: (meta.google_category as string) || null,
          address: (meta.business_address as string) || null,
          plan_type: 'free',
          monthly_spin_limit: spinLimit,
          contact_limit: contactLimit,
          subscription_status: 'free',
          trial_ends_at: new Date().toISOString(),
          primary_color: '#FF6B35',
          secondary_color: '#1B2A4A',
          onboarding_completed: true,
        })
        .select()
        .single();

      if (bizError || !business) {
        console.error('Business creation error:', bizError);
        setError('Erreur lors de la création du commerce. Réessayez.');
        setLoading(false);
        return;
      }

      // Insert wheel segments
      const segmentsToInsert = selectedSegments.map((idx, position) => {
        const template = WHEEL_TEMPLATES[idx];
        const totalSelected = selectedSegments.length;
        const baseProbability = Math.floor(100 / totalSelected);
        const remainder = 100 - baseProbability * totalSelected;

        return {
          business_id: business.id,
          label: template.label,
          emoji: template.emoji,
          color: template.color,
          is_winning: template.isWinning,
          probability: baseProbability + (position < remainder ? 1 : 0),
          position,
        };
      });

      const { error: segError } = await supabase
        .from('wheel_segments')
        .insert(segmentsToInsert);

      if (segError) {
        console.error('Segments insertion error:', segError);
        // Non-blocking — business is created, segments can be added later
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Une erreur est survenue. Réessayez.');
      setLoading(false);
    }
  }, [selectedSegments, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-8 pb-4">
        <Logo size="md" showTagline />
      </header>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-6">
        <Card
          padding="lg"
          className="w-full max-w-2xl relative overflow-hidden"
        >
          {/* Step indicator label */}
          <div className="text-center mb-2">
            <span className="text-xs font-display font-semibold text-text-muted uppercase tracking-widest">
              Derniere etape
            </span>
          </div>

          {/* Wheel config */}
          <div className="min-h-[400px] flex items-start justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full"
            >
              <StepConfigureWheel
                selectedSegments={selectedSegments}
                onToggle={toggleSegment}
              />
            </motion.div>
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

          {/* Footer actions */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={!canFinish}
              loading={loading}
              className="w-full sm:w-auto min-w-[200px]"
            >
              <Check size={16} />
              Terminer
            </Button>
          </div>

          {/* Minimum segments hint */}
          {selectedSegments.length < 3 && (
            <p className="text-center text-xs text-text-muted font-body mt-2">
              Selectionnez au moins 3 lots pour votre roue
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
