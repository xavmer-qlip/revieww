'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Building2, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceSearch } from '@/components/places/place-search';
import type { PlaceDetails } from '@/components/places/place-search';

export default function AddBusinessPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePlaceSelect = useCallback((details: PlaceDetails) => {
    setPlaceDetails(details);
    setError('');
  }, []);

  const handlePlaceReset = useCallback(() => {
    setPlaceDetails(null);
    setError('');
  }, []);

  async function handleSubmit() {
    if (!businessName.trim()) {
      setError('Recherchez et sélectionnez votre commerce.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/group/add-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: businessName.trim(),
          google_place_id: placeDetails?.place_id || null,
          google_rating: placeDetails?.rating || null,
          google_review_count: placeDetails?.review_count || 0,
          google_category: placeDetails?.category || null,
          google_review_link: googleReviewLink || placeDetails?.google_review_link || null,
          address: placeDetails?.address || null,
          phone: placeDetails?.phone || null,
          website: placeDetails?.website || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'exists_same_user') {
          setError('Vous avez déjà ajouté cet établissement à votre compte.');
        } else if (data.error === 'exists_other_user') {
          setError('Ce commerce est déjà inscrit sur woopla par un autre compte. Contactez-nous si vous êtes le propriétaire.');
        } else {
          setError(data.message || data.error || 'Une erreur est survenue.');
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/group');
        router.refresh();
      }, 1500);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface rounded-2xl border border-border/40 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-display font-bold text-text mb-2">
            Établissement ajouté !
          </h2>
          <p className="text-sm font-body text-text-muted">
            Redirection vers vos établissements...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-4">
      {/* Back link */}
      <Link
        href="/dashboard/group"
        className="inline-flex items-center gap-1.5 text-sm font-body text-text-muted hover:text-text transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Mes établissements
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border/40 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-text">
              Ajouter un établissement
            </h1>
            <p className="text-sm font-body text-text-muted">
              Recherchez votre commerce sur Google
            </p>
          </div>
        </div>

        {/* Google Places search */}
        <PlaceSearch
          compact
          businessName={businessName}
          googleReviewLink={googleReviewLink}
          onNameChange={setBusinessName}
          onLinkChange={setGoogleReviewLink}
          onPlaceSelect={handlePlaceSelect}
          onReset={handlePlaceReset}
        />

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-danger/5 border border-danger/20 text-danger rounded-xl px-4 py-3 mt-4"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm font-body">{error}</p>
          </motion.div>
        )}

        {/* Submit */}
        <div className="mt-6">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            loading={loading}
            disabled={!businessName.trim() || loading}
          >
            <Building2 size={16} />
            Ajouter cet établissement
          </Button>

          <p className="text-xs font-body text-text-muted/60 text-center mt-3">
            L'établissement sera créé en plan Free. Vous pourrez upgrader depuis ses paramètres.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
