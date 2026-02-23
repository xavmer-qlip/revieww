'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronRight,
  ArrowLeft,
  Link as LinkIcon,
  HelpCircle,
  Store,
  Search,
  MapPin,
  Loader2,
  StarIcon,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WHEEL_TEMPLATES, TEXTS, PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS } from '@/lib/constants';
import { slugify, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 2;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const slideTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

// ---------------------------------------------------------------------------
// Progress indicator
// ---------------------------------------------------------------------------

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            {/* Dot */}
            <motion.div
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-display font-bold transition-colors duration-300',
                isCompleted && 'bg-accent text-white',
                isActive && 'bg-primary text-white',
                !isCompleted && !isActive && 'bg-border/60 text-text-muted'
              )}
              animate={{
                scale: isActive ? 1.1 : 1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {isCompleted ? <Check size={14} strokeWidth={3} /> : step}

              {/* Pulse ring on active */}
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
            </motion.div>

            {/* Connector line */}
            {step < TOTAL_STEPS && (
              <div className="h-[2px] w-8 sm:w-12 rounded-full overflow-hidden bg-border/60">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Find Business (Google Places Autocomplete)
// ---------------------------------------------------------------------------

interface PlacePrediction {
  place_id: string;
  name: string;
  formatted_address: string;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  review_count: number;
  category: string | null;
  google_review_link: string;
}

function StepFindBusiness({
  businessName,
  googleReviewLink,
  googlePlaceId,
  onNameChange,
  onLinkChange,
  onPlaceSelect,
}: {
  businessName: string;
  googleReviewLink: string;
  googlePlaceId: string | null;
  onNameChange: (value: string) => void;
  onLinkChange: (value: string) => void;
  onPlaceSelect: (details: PlaceDetails) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setPredictions(data.predictions ?? []);
        setShowDropdown(true);
      } catch {
        setPredictions([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Handle place selection
  const handleSelect = async (prediction: PlacePrediction) => {
    setShowDropdown(false);
    setSearchQuery(prediction.name);
    setLoadingDetails(true);

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: prediction.place_id }),
      });
      const details: PlaceDetails = await res.json();

      setSelectedPlace(details);
      onNameChange(details.name);
      onLinkChange(details.google_review_link);
      onPlaceSelect(details);
    } catch {
      // Fallback: use prediction data
      onNameChange(prediction.name);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Reset selection
  const handleReset = () => {
    setSelectedPlace(null);
    setSearchQuery('');
    onNameChange('');
    onLinkChange('');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
          {TEXTS.onboarding.step2Title}
        </h2>
        <p className="mt-2 text-text-muted font-body">
          Trouvez votre commerce sur Google
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-5">
        {/* Selected place card */}
        {selectedPlace ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-accent bg-accent/5 p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                  <MapPin size={20} className="text-accent" />
                </div>
                <div>
                  <p className="font-display font-bold text-text">{selectedPlace.name}</p>
                  <p className="text-xs text-text-muted font-body">{selectedPlace.address}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-text-muted hover:text-danger transition-colors font-display font-medium cursor-pointer"
              >
                Changer
              </button>
            </div>

            {/* Rating */}
            {selectedPlace.rating && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      size={14}
                      className={i < Math.round(selectedPlace.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-border'}
                    />
                  ))}
                </div>
                <span className="text-xs font-body text-text-muted">
                  {selectedPlace.rating} ({selectedPlace.review_count} avis)
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Check size={14} className="text-accent" />
              <span className="text-xs font-body text-accent font-medium">
                Lien Google Review configure automatiquement
              </span>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Search input */}
            <div className="relative" ref={dropdownRef}>
              <Input
                id="business-search"
                label="Rechercher votre commerce"
                placeholder={TEXTS.onboarding.step1Placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              />

              {/* Dropdown results */}
              <AnimatePresence>
                {showDropdown && predictions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 top-full mt-1 w-full bg-surface rounded-xl border border-border shadow-lg overflow-hidden"
                  >
                    {predictions.map((p) => (
                      <button
                        key={p.place_id}
                        type="button"
                        onClick={() => handleSelect(p)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-primary/5 transition-colors cursor-pointer border-b border-border/30 last:border-0"
                      >
                        <MapPin size={16} className="text-text-muted mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-display font-semibold text-text truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-text-muted font-body truncate">
                            {p.formatted_address}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Loading details overlay */}
            {loadingDetails && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 size={18} className="animate-spin text-primary" />
                <span className="text-sm font-body text-text-muted">
                  Chargement des informations...
                </span>
              </div>
            )}

            {/* Manual fallback */}
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="flex items-center gap-2 text-sm text-primary font-medium font-display hover:underline cursor-pointer"
            >
              <HelpCircle size={14} />
              {TEXTS.onboarding.step1Fallback}
            </button>

            <AnimatePresence>
              {showManual && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden space-y-4"
                >
                  <Input
                    id="business-name-manual"
                    label="Nom de votre commerce"
                    placeholder="Cafe du Marche"
                    value={businessName}
                    onChange={(e) => onNameChange(e.target.value)}
                    icon={<Store size={16} />}
                  />
                  <Input
                    id="google-review-link"
                    label="Lien Google Review"
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    value={googleReviewLink}
                    onChange={(e) => onLinkChange(e.target.value)}
                    icon={<LinkIcon size={16} />}
                  />
                  <p className="text-xs text-text-muted font-body">
                    Trouvez votre commerce sur Google Maps, cliquez &quot;Laisser un avis&quot; et copiez l&apos;URL
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Configure Wheel
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
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Step 1 — Find Business
  const [businessName, setBusinessName] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [googleRating, setGoogleRating] = useState<number | null>(null);
  const [googleReviewCount, setGoogleReviewCount] = useState(0);
  const [googleCategory, setGoogleCategory] = useState<string | null>(null);
  const [businessAddress, setBusinessAddress] = useState<string | null>(null);

  // Step 2 — Configure Wheel
  const [selectedSegments, setSelectedSegments] = useState<number[]>([0, 1, 2, 3, 6]);

  // Loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Navigation ---
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  // --- Toggle segment ---
  const toggleSegment = useCallback((index: number) => {
    setSelectedSegments((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  // --- Validation ---
  const canProceedStep1 = businessName.trim().length >= 2;
  const canFinish = selectedSegments.length >= 3;

  // --- Complete onboarding ---
  const handleComplete = useCallback(async () => {
    if (!businessName.trim()) return;

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
          google_review_link: googleReviewLink.trim() || null,
          google_place_id: googlePlaceId,
          google_rating: googleRating,
          google_review_count: googleReviewCount,
          google_business_category: googleCategory,
          address: businessAddress,
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
  }, [businessName, googleReviewLink, googlePlaceId, googleRating, googleReviewCount, googleCategory, businessAddress, selectedSegments, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-8 pb-4">
        <Logo size="md" showTagline />
      </header>

      {/* Progress */}
      <div className="flex justify-center pb-6">
        <ProgressIndicator currentStep={step} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <Card
          padding="lg"
          className="w-full max-w-2xl relative overflow-hidden"
        >
          {/* Back button */}
          <AnimatePresence>
            {step > 1 && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                type="button"
                onClick={goBack}
                className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors cursor-pointer font-display font-medium z-10"
              >
                <ArrowLeft size={16} />
                Retour
              </motion.button>
            )}
          </AnimatePresence>

          {/* Step indicator label */}
          <div className="text-center mb-2">
            <span className="text-xs font-display font-semibold text-text-muted uppercase tracking-widest">
              Etape {step} sur {TOTAL_STEPS}
            </span>
          </div>

          {/* Animated steps */}
          <div className="min-h-[400px] flex items-start justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTransition}
                  className="w-full"
                >
                  <StepFindBusiness
                    businessName={businessName}
                    googleReviewLink={googleReviewLink}
                    googlePlaceId={googlePlaceId}
                    onNameChange={setBusinessName}
                    onLinkChange={setGoogleReviewLink}
                    onPlaceSelect={(details) => {
                      setGooglePlaceId(details.place_id);
                      setGoogleRating(details.rating);
                      setGoogleReviewCount(details.review_count);
                      setGoogleCategory(details.category);
                      setBusinessAddress(details.address);
                    }}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTransition}
                  className="w-full"
                >
                  <StepConfigureWheel
                    selectedSegments={selectedSegments}
                    onToggle={toggleSegment}
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

          {/* Footer actions */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {step === 1 && (
              <>
                <Button
                  size="lg"
                  onClick={goNext}
                  disabled={!canProceedStep1}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  Suivant
                  <ChevronRight size={16} />
                </Button>
                <button
                  type="button"
                  onClick={goNext}
                  className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer font-body"
                >
                  Passer cette etape
                </button>
              </>
            )}

            {step === 2 && (
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
            )}
          </div>

          {/* Minimum segments hint for step 2 */}
          {step === 2 && selectedSegments.length < 3 && (
            <p className="text-center text-xs text-text-muted font-body mt-2">
              Selectionnez au moins 3 lots pour votre roue
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
