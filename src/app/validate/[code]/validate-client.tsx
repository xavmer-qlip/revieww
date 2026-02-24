'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Clock, ShieldAlert, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { TEXTS } from '@/lib/constants';

interface ValidateClientProps {
  spin: {
    id: string;
    validation_code: string;
    prize_label: string;
    prize_emoji: string | null;
    email: string;
    claimed: boolean;
    claimed_at: string | null;
    created_at: string;
  };
  businessName: string;
  businessColor: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  isExpired: boolean;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function ValidateClient({
  spin,
  businessName,
  businessColor,
  isOwner,
  isLoggedIn,
  isExpired,
}: ValidateClientProps) {
  const [claimed, setClaimed] = useState(spin.claimed);
  const [claimedAt, setClaimedAt] = useState(spin.claimed_at);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationCode: spin.validation_code }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'already_claimed') {
          setClaimed(true);
          setClaimedAt(data.claimed_at);
        } else if (data.error === 'expired') {
          setError(TEXTS.validate.expired);
        } else if (data.error === 'not_owner') {
          setError(TEXTS.validate.notOwner);
        } else {
          setError(data.error || 'Une erreur est survenue');
        }
        setLoading(false);
        return;
      }

      setClaimed(true);
      setClaimedAt(new Date().toISOString());
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  // Determine state for display
  const canClaim = isOwner && !claimed && !isExpired;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Logo */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <Logo size="sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-3xl p-8 shadow-xl w-full max-w-sm"
      >
        {/* Prize emoji */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
          className="text-5xl text-center mb-4"
        >
          {spin.prize_emoji || '🎁'}
        </motion.div>

        {/* Title */}
        <h1 className="text-xl font-display font-bold text-text text-center mb-1">
          {TEXTS.validate.title}
        </h1>
        <p className="text-sm font-body text-text-muted text-center mb-6">
          {businessName}
        </p>

        {/* Details */}
        <div className="space-y-3 mb-6">
          {/* Prize */}
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-xs font-body text-text-muted">{TEXTS.validate.prize}</span>
            <span
              className="text-sm font-display font-bold"
              style={{ color: businessColor }}
            >
              {spin.prize_emoji} {spin.prize_label}
            </span>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-xs font-body text-text-muted">{TEXTS.validate.email}</span>
            <span className="text-sm font-body text-text">{spin.email}</span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-xs font-body text-text-muted">{TEXTS.validate.date}</span>
            <span className="text-xs font-body text-text-muted">
              {formatDate(spin.created_at)}
            </span>
          </div>

          {/* Validation code */}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs font-body text-text-muted">Code</span>
            <span className="text-sm font-display font-bold text-blue-700 tracking-wider">
              {spin.validation_code}
            </span>
          </div>
        </div>

        {/* Status / Actions */}
        {claimed ? (
          // Already claimed
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-accent/10 border border-accent/20 rounded-2xl p-4 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm font-display font-bold text-accent">
              {TEXTS.validate.claimed}
            </p>
            {claimedAt && (
              <p className="text-xs font-body text-text-muted mt-1">
                {TEXTS.validate.claimedAt} {formatDate(claimedAt)}
              </p>
            )}
          </motion.div>
        ) : isExpired ? (
          // Expired
          <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-sm font-display font-bold text-warning">
              {TEXTS.validate.expired}
            </p>
          </div>
        ) : !isLoggedIn ? (
          // Not logged in
          <div className="text-center space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                <LogIn className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-body text-blue-800">
                {TEXTS.validate.loginRequired}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                window.location.href = `/login?redirect=/validate/${spin.validation_code}`;
              }}
            >
              <LogIn className="w-4 h-4" />
              {TEXTS.validate.loginButton}
            </Button>
          </div>
        ) : !isOwner ? (
          // Logged in but not owner
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-5 h-5 text-danger" />
            </div>
            <p className="text-sm font-body text-danger">
              {TEXTS.validate.notOwner}
            </p>
          </div>
        ) : (
          // Can claim
          <div className="space-y-3">
            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-center">
                <p className="text-xs font-body text-danger">{error}</p>
              </div>
            )}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={loading}
              onClick={handleClaim}
            >
              {!loading && <ShieldCheck className="w-5 h-5" />}
              {TEXTS.validate.claim}
            </Button>
            <p className="text-xs font-body text-text-muted text-center">
              {TEXTS.validate.validFor}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
