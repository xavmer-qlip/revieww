'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Check, Clock, AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { TEXTS } from '@/lib/constants';

interface ValidateResult {
  success: boolean;
  prize_label: string;
  prize_emoji: string | null;
  email: string;
  businessName: string;
}

type ErrorType = 'not_found' | 'already_claimed' | 'expired' | 'generic';

export default function ValidatePage() {
  return (
    <Suspense>
      <ValidatePageInner />
    </Suspense>
  );
}

function ValidatePageInner() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [claimedAt, setClaimedAt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleValidate() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setErrorType(null);
    setClaimedAt(null);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationCode: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'already_claimed') {
          setErrorType('already_claimed');
          setClaimedAt(data.claimed_at);
        } else if (data.error === 'expired') {
          setErrorType('expired');
        } else if (data.error === 'not_found') {
          setErrorType('not_found');
        } else {
          setErrorType('generic');
        }
        return;
      }

      setResult(data);
    } catch {
      setErrorType('generic');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleValidate();
  }

  function handleReset() {
    setCode('');
    setResult(null);
    setErrorType(null);
    setClaimedAt(null);
    inputRef.current?.focus();
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

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Logo */}
      <div className="absolute top-4 left-0 right-0 flex justify-center">
        <Logo size="sm" animate />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white rounded-3xl p-8 shadow-xl w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-text">
              {TEXTS.validate.title}
            </h1>
            <p className="text-xs font-body text-text-muted">
              Entrez le code du client
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!result && !errorType ? (
            /* ---- Input form ---- */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Input
                ref={inputRef}
                id="validate-code"
                label="Code de validation"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="Ex: RW-ABCD"
                icon={<Search size={16} />}
              />
              <Button
                variant="primary"
                size="lg"
                onClick={handleValidate}
                disabled={!code.trim() || loading}
                loading={loading}
                className="w-full"
              >
                {!loading && <ShieldCheck size={18} />}
                Valider le lot
              </Button>
            </motion.div>
          ) : result ? (
            /* ---- Success ---- */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-success/10 border border-success/20 rounded-2xl p-5 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  className="text-4xl mb-3"
                >
                  {result.prize_emoji || '🎁'}
                </motion.div>
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <p className="text-sm font-display font-bold text-success mb-1">
                  {TEXTS.validate.success}
                </p>
                <p className="text-base font-display font-bold text-text">
                  {result.prize_emoji} {result.prize_label}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-xs font-body text-text-muted">Client</span>
                  <span className="text-sm font-body text-text">{result.email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-body text-text-muted">Commerce</span>
                  <span className="text-sm font-display font-semibold text-text">{result.businessName}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="md"
                onClick={handleReset}
                className="w-full"
              >
                Valider un autre lot
              </Button>
            </motion.div>
          ) : (
            /* ---- Error states ---- */
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {errorType === 'already_claimed' ? (
                <div className="bg-success/10 border border-success/20 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-sm font-display font-bold text-success">
                    {TEXTS.validate.claimed}
                  </p>
                  {claimedAt && (
                    <p className="text-xs font-body text-text-muted mt-1">
                      {TEXTS.validate.claimedAt} {formatDate(claimedAt)}
                    </p>
                  )}
                </div>
              ) : errorType === 'expired' ? (
                <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <p className="text-sm font-display font-bold text-warning">
                    {TEXTS.validate.expired}
                  </p>
                </div>
              ) : errorType === 'not_found' ? (
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <p className="text-sm font-display font-bold text-danger">
                    {TEXTS.validate.notFound}
                  </p>
                  <p className="text-xs font-body text-text-muted mt-1">
                    {TEXTS.validate.notFoundDescription}
                  </p>
                </div>
              ) : (
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="w-5 h-5 text-danger" />
                  </div>
                  <p className="text-sm font-body text-danger">
                    Une erreur est survenue. Veuillez réessayer.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={handleReset}
                className="w-full"
              >
                Réessayer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
