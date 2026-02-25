'use client';

import { motion } from 'motion/react';
import { Check, Clock, Gift } from 'lucide-react';
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
  isExpired,
}: ValidateClientProps) {
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

        {/* Status */}
        {spin.claimed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-success/10 border border-success/20 rounded-2xl p-4 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm font-display font-bold text-success">
              {TEXTS.validate.claimed}
            </p>
            {spin.claimed_at && (
              <p className="text-xs font-body text-text-muted mt-1">
                {TEXTS.validate.claimedAt} {formatDate(spin.claimed_at)}
              </p>
            )}
          </motion.div>
        ) : isExpired ? (
          <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <p className="text-sm font-display font-bold text-warning">
              {TEXTS.validate.expired}
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Gift className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-body text-blue-800">
              Présentez ce code en caisse pour récupérer votre lot
            </p>
          </div>
        )}
      </motion.div>

      {/* Footer tagline */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <a
          href="https://woopla.ch"
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[10px] text-text-muted/50 hover:text-text-muted transition-colors inline-flex items-center gap-1"
        >
          Fait avec <span className="text-red-500">&#10084;</span> en Suisse &middot; woopla.ch
        </a>
      </div>
    </div>
  );
}
