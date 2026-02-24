'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-text tracking-tight">
            Email envoyé !
          </h1>
          <p className="mt-3 text-text-muted font-body text-base leading-relaxed">
            Un lien de réinitialisation a été envoyé à <strong className="text-text">{email}</strong>.
            Vérifiez votre boîte de réception (et vos spams).
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-8 text-sm font-display font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-text tracking-tight">
          Mot de passe oublié
        </h1>
        <p className="mt-2 text-text-muted font-body text-base">
          Entrez votre email et nous vous enverrons un lien de réinitialisation.
        </p>
      </motion.div>

      {/* Error */}
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!email}
            className="w-full"
          >
            Envoyer le lien
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </motion.div>
      </form>

      {/* Back to login */}
      <motion.p
        className="mt-8 text-center font-body text-sm text-text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-primary font-display font-semibold hover:text-primary-dark transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </Link>
      </motion.p>
    </div>
  );
}
