'use client';

import { useState, useCallback, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle, Check, MailCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlaceSearch } from '@/components/places/place-search';
import type { PlaceDetails } from '@/components/places/place-search';
import { createClient } from '@/lib/supabase/client';
import { APP_URL } from '@/lib/constants';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Faible', color: 'bg-danger' };
  if (score <= 2) return { score: 2, label: 'Moyen', color: 'bg-warning' };
  if (score <= 3) return { score: 3, label: 'Bon', color: 'bg-primary' };
  if (score <= 4) return { score: 4, label: 'Fort', color: 'bg-accent' };
  return { score: 5, label: 'Excellent', color: 'bg-success' };
}

export default function SignupPage() {
  const router = useRouter();

  // Business / Google Places state
  const [businessName, setBusinessName] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [googlePlaceId, setGooglePlaceId] = useState<string | null>(null);
  const [googleRating, setGoogleRating] = useState<number | null>(null);
  const [googleReviewCount, setGoogleReviewCount] = useState(0);
  const [googleCategory, setGoogleCategory] = useState<string | null>(null);
  const [businessAddress, setBusinessAddress] = useState<string | null>(null);

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);

  const passwordStrength = useMemo(
    () => (password.length > 0 ? getPasswordStrength(password) : null),
    [password]
  );

  const handlePlaceSelect = useCallback((details: PlaceDetails) => {
    setGooglePlaceId(details.place_id);
    setGoogleRating(details.rating);
    setGoogleReviewCount(details.review_count);
    setGoogleCategory(details.category);
    setBusinessAddress(details.address);
  }, []);

  const handlePlaceReset = useCallback(() => {
    setGooglePlaceId(null);
    setGoogleRating(null);
    setGoogleReviewCount(0);
    setGoogleCategory(null);
    setBusinessAddress(null);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!businessName.trim()) {
      setError('Veuillez rechercher et selectionner votre commerce.');
      return;
    }

    if (!acceptedTerms) {
      setError('Vous devez accepter les conditions generales d\'utilisation.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName.trim(),
            google_place_id: googlePlaceId,
            google_rating: googleRating,
            google_review_count: googleReviewCount,
            google_category: googleCategory,
            google_review_link: googleReviewLink.trim() || null,
            business_address: businessAddress,
          },
          emailRedirectTo: `${APP_URL}/auth/callback?next=/onboarding`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError(
            'Cette adresse email est deja utilisee. Essayez de vous connecter.'
          );
        } else {
          setError(authError.message);
        }
        return;
      }

      // If session is returned immediately (email confirmation disabled),
      // go straight to onboarding
      if (data.session) {
        router.push('/onboarding');
        router.refresh();
        return;
      }

      // Email confirmation required — show "check your email" screen
      setShowCheckEmail(true);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  // ---- Check email confirmation screen ----
  if (showCheckEmail) {
    return (
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6"
        >
          <MailCheck className="w-10 h-10 text-accent" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-display font-extrabold text-text"
        >
          Verifiez votre email
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-text-muted font-body text-base max-w-sm mx-auto"
        >
          Nous avons envoye un lien de confirmation a{' '}
          <strong className="text-text">{email}</strong>.
          Cliquez sur le lien pour activer votre compte.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-4"
        >
          <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3">
            <p className="text-sm font-body text-text-muted">
              Pensez a verifier vos <strong className="text-text">spams</strong> si vous ne trouvez pas l&apos;email.
            </p>
          </div>

          <p className="text-sm font-body text-text-muted">
            Deja confirme ?{' '}
            <Link
              href="/login"
              className="text-primary font-display font-semibold hover:text-primary-dark transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </motion.div>
      </div>
    );
  }

  // ---- Signup form ----
  return (
    <div>
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-text tracking-tight">
          Lancez-vous en{' '}
          <span className="text-primary">1 minute</span>
        </h1>
        <p className="mt-2 text-text-muted font-body text-base">
          Creez votre compte et commencez a collecter des avis.
        </p>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 text-danger rounded-2xl px-4 py-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm font-body">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Google Places search (replaces plain business name input) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <PlaceSearch
            compact
            businessName={businessName}
            googleReviewLink={googleReviewLink}
            onNameChange={setBusinessName}
            onLinkChange={setGoogleReviewLink}
            onPlaceSelect={handlePlaceSelect}
            onReset={handlePlaceReset}
          />
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Input
            id="password"
            label="Mot de passe"
            type="password"
            placeholder="Min. 6 caracteres"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />

          {/* Password strength indicator */}
          <AnimatePresence>
            {passwordStrength && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          i < passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-border'
                        }`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.2 }}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-body font-medium shrink-0 ${
                      passwordStrength.score <= 1
                        ? 'text-danger'
                        : passwordStrength.score <= 2
                          ? 'text-warning'
                          : passwordStrength.score <= 3
                            ? 'text-primary'
                            : 'text-success'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Terms checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-lg border-2 border-border bg-surface transition-all duration-200 peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50 flex items-center justify-center">
                <Check
                  className={`w-3 h-3 text-white transition-all duration-200 ${
                    acceptedTerms
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-50'
                  }`}
                />
              </div>
            </div>
            <span className="text-sm font-body text-text-muted leading-snug">
              J&apos;accepte les{' '}
              <Link
                href="/cgu"
                className="text-primary hover:text-primary-dark transition-colors duration-200 underline underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                conditions generales d&apos;utilisation
              </Link>
            </span>
          </label>
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!acceptedTerms}
            className="w-full"
          >
            Creer mon compte
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </motion.div>
      </form>

      {/* Perks */}
      <motion.div
        className="mt-6 flex flex-wrap gap-x-5 gap-y-2 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        {['30 spins offerts', 'Sans engagement', 'Prêt en 1 min'].map(
          (perk) => (
            <span
              key={perk}
              className="inline-flex items-center gap-1.5 text-xs font-body text-text-muted"
            >
              <span className="w-1 h-1 rounded-full bg-accent" />
              {perk}
            </span>
          )
        )}
      </motion.div>

      {/* Divider */}
      <div className="mt-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted font-body uppercase tracking-wider">
          ou
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Login link */}
      <motion.p
        className="mt-6 text-center font-body text-sm text-text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        Deja un compte ?{' '}
        <Link
          href="/login"
          className="text-primary font-display font-semibold hover:text-primary-dark transition-colors duration-200"
        >
          Connectez-vous
        </Link>
      </motion.p>
    </div>
  );
}
