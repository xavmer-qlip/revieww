'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError(
            'Veuillez confirmer votre email avant de vous connecter.'
          );
        } else {
          setError(authError.message);
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setLoading(false);
    }
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
          Bon retour !
        </h1>
        <p className="mt-2 text-text-muted font-body text-base">
          Connectez-vous pour acceder a votre dashboard.
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
          <Input
            id="password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={6}
          />
        </motion.div>

        {/* Forgot password */}
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Link
            href="/forgot-password"
            className="text-sm font-body text-primary hover:text-primary-dark transition-colors duration-200"
          >
            Mot de passe oublie ?
          </Link>
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Se connecter
            {!loading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </motion.div>
      </form>

      {/* Divider */}
      <div className="mt-8 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted font-body uppercase tracking-wider">
          ou
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Sign up link */}
      <motion.p
        className="mt-6 text-center font-body text-sm text-text-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        Pas encore de compte ?{' '}
        <Link
          href="/signup"
          className="text-primary font-display font-semibold hover:text-primary-dark transition-colors duration-200"
        >
          Inscrivez-vous
        </Link>
      </motion.p>
    </div>
  );
}
