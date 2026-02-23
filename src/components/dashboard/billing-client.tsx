'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Zap,
  Crown,
  Rocket,
  Check,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
  Clock,
  X,
  Receipt,
  Sparkles,
  Star,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  cn,
  getQuotaPercentage,
  getQuotaColor,
  formatNumber,
} from '@/lib/utils';
import { PAID_PLANS, PLANS } from '@/lib/constants';
import type { Business, PlanType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillingClientProps {
  business: Business;
  spinsUsed: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAN_ICONS: Record<PlanType, React.ElementType> = {
  free: Sparkles,
  starter: Zap,
  growth: Rocket,
  pro: Crown,
};

const PLAN_COLORS: Record<PlanType, string> = {
  free: '#6B7280',
  starter: '#F59E0B',
  growth: '#FF6B35',
  pro: '#10B981',
};

const PLAN_FEATURES: Record<PlanType, string[]> = {
  free: [
    'QR code personnalise',
    'Roue personnalisable',
    '30 spins offerts',
    'Dashboard complet',
  ],
  starter: [
    'Tout du plan Free',
    '50 spins/mois',
    '200 contacts en base',
    'Collecte d\'emails',
    'Export CSV',
  ],
  growth: [
    'Tout du plan Starter',
    '250 spins/mois',
    '1\'000 contacts en base',
    'Multi-etablissements',
    'Dashboard partage',
  ],
  pro: [
    'Tout du plan Growth',
    'Spins illimites',
    'Contacts illimites',
    'Multi-etablissements degressif',
    'Support prioritaire',
  ],
};

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border font-body text-sm',
        toast.type === 'success'
          ? 'bg-accent/10 border-accent/20 text-accent'
          : 'bg-danger/10 border-danger/20 text-danger'
      )}
    >
      {toast.type === 'success' ? (
        <Check size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Subscription status helpers
// ---------------------------------------------------------------------------

function getStatusBadge(business: Business) {
  const { subscription_status } = business;

  if (subscription_status === 'free') {
    return {
      label: 'Gratuit',
      variant: 'muted' as const,
      icon: Sparkles,
    };
  }

  if (subscription_status === 'active') {
    return {
      label: 'Actif',
      variant: 'success' as const,
      icon: Check,
    };
  }

  if (subscription_status === 'past_due') {
    return {
      label: 'Paiement en retard',
      variant: 'danger' as const,
      icon: AlertCircle,
    };
  }

  if (subscription_status === 'canceled') {
    return {
      label: 'Annule',
      variant: 'muted' as const,
      icon: X,
    };
  }

  return {
    label: 'Expire',
    variant: 'danger' as const,
    icon: AlertCircle,
  };
}

// ---------------------------------------------------------------------------
// Plan card component
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  currentPlanType,
  onChangePlan,
  changingPlan,
  index,
}: {
  plan: (typeof PLANS)[number];
  currentPlanType: PlanType;
  onChangePlan: (planId: PlanType) => void;
  changingPlan: PlanType | null;
  index: number;
}) {
  const isCurrent = plan.id === currentPlanType;
  const isUpgrade =
    PLANS.findIndex((p) => p.id === plan.id) >
    PLANS.findIndex((p) => p.id === currentPlanType);
  const Icon = PLAN_ICONS[plan.id];
  const color = PLAN_COLORS[plan.id];
  const features = PLAN_FEATURES[plan.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
      className="relative"
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="primary" size="md" className="shadow-lg shadow-primary/25">
            <Star size={12} className="fill-current" />
            Le plus populaire
          </Badge>
        </div>
      )}

      <Card
        padding="lg"
        hover
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          isCurrent && 'ring-2 ring-primary shadow-lg shadow-primary/10',
          plan.popular && !isCurrent && 'border-primary/30'
        )}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 blur-2xl"
          style={{ backgroundColor: color }}
        />

        <div className="relative space-y-5">
          {/* Plan header */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: color + '15' }}
            >
              <Icon size={24} style={{ color }} />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-text">
                {plan.name}
              </h3>
              <p className="text-xs font-body text-text-muted">
                {plan.description}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display font-extrabold text-text">
              {plan.price}
            </span>
            <span className="text-sm font-body text-text-muted">
              {plan.currency}/mois
            </span>
          </div>

          {/* Spin limit */}
          <div
            className="px-3 py-2 rounded-xl text-sm font-display font-semibold"
            style={{
              backgroundColor: color + '10',
              color,
            }}
          >
            {plan.spinsLabel}
          </div>

          {/* Features */}
          <ul className="space-y-2.5">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: color + '15' }}
                >
                  <Check size={12} style={{ color }} />
                </div>
                <span className="text-sm font-body text-text">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Action button */}
          <div className="pt-2">
            {isCurrent ? (
              <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/5 text-primary font-display font-semibold text-sm">
                <Check size={16} />
                Plan actuel
              </div>
            ) : (
              <Button
                variant={isUpgrade ? 'primary' : 'outline'}
                size="md"
                className="w-full"
                loading={changingPlan === plan.id}
                onClick={() => onChangePlan(plan.id)}
              >
                {isUpgrade ? (
                  <>
                    <ArrowRight size={16} />
                    Passer a {plan.name}
                  </>
                ) : (
                  <>Changer pour {plan.name}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BillingClient({ business, spinsUsed }: BillingClientProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [changingPlan, setChangingPlan] = useState<PlanType | null>(null);

  // ---- Toast helpers ----
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Derived data ----
  const currentPlan = useMemo(
    () => PLANS.find((p) => p.id === business.plan_type) || PLANS[0],
    [business.plan_type]
  );

  const status = useMemo(() => getStatusBadge(business), [business]);
  const quotaPercentage = getQuotaPercentage(
    spinsUsed,
    business.monthly_spin_limit
  );
  const quotaColor = getQuotaColor(quotaPercentage);
  const isPro = business.plan_type === 'pro';
  const isFree = business.plan_type === 'free';

  // ---- Manage subscription (Stripe portal) ----
  const handleManageSubscription = useCallback(async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la creation du portail');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('Portal error:', err);
      addToast(
        'error',
        'Impossible d\'ouvrir le portail de gestion. Reessayez.'
      );
      setLoadingPortal(false);
    }
  }, [addToast]);

  // ---- Change plan ----
  const handleChangePlan = useCallback(
    async (planId: PlanType) => {
      if (planId === business.plan_type) return;

      setChangingPlan(planId);
      try {
        // Free users (or no subscription) → create a new checkout session
        const needsCheckout = !business.stripe_subscription_id;
        const endpoint = needsCheckout
          ? '/api/stripe/create-checkout'
          : '/api/stripe/change-plan';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planType: planId }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erreur lors du changement de plan');
        }

        const data = await res.json();

        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          addToast('success', `Plan change vers ${planId} avec succes !`);
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        console.error('Change plan error:', err);
        addToast(
          'error',
          'Impossible de changer de plan. Reessayez.'
        );
      } finally {
        setChangingPlan(null);
      }
    },
    [business.plan_type, business.stripe_subscription_id, addToast]
  );

  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-display font-bold text-text">
          Abonnement
        </h1>
        <p className="text-sm font-body text-text-muted mt-1">
          Gerez votre plan et votre facturation
        </p>
      </motion.div>

      {/* ---- Current plan + status ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card padding="lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Plan icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: PLAN_COLORS[business.plan_type] + '15',
                }}
              >
                {(() => {
                  const Icon = PLAN_ICONS[business.plan_type];
                  return (
                    <Icon
                      size={28}
                      style={{ color: PLAN_COLORS[business.plan_type] }}
                    />
                  );
                })()}
              </div>

              {/* Plan info */}
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-display font-bold text-text">
                    Plan {currentPlan.name}
                  </h2>
                  <Badge variant={status.variant} size="md">
                    <StatusIcon size={12} />
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm font-body text-text-muted mt-0.5">
                  {isFree ? 'Gratuit' : `${currentPlan.price} ${currentPlan.currency}/mois`}
                  {' \u2022 '}
                  {currentPlan.spinsLabel}
                </p>
              </div>
            </div>

            {/* Manage button */}
            {isFree ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <ArrowRight size={14} />
                Passer a un plan payant
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManageSubscription}
                loading={loadingPortal}
              >
                <ExternalLink size={14} />
                Gerer mon abonnement
              </Button>
            )}
          </div>

          {/* ---- Spin quota ---- */}
          <div className="mt-6 pt-5 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-display font-medium text-text">
                {isFree ? 'Spins utilises' : 'Spins ce mois'}
              </span>
              {isPro ? (
                <span className="text-sm font-display font-semibold text-accent flex items-center gap-1">
                  <Sparkles size={14} />
                  Illimite
                </span>
              ) : (
                <span className="text-sm font-display font-semibold text-text">
                  {formatNumber(spinsUsed)}{' '}
                  <span className="text-text-muted font-normal">
                    / {formatNumber(business.monthly_spin_limit)}
                  </span>
                </span>
              )}
            </div>

            {!isPro && (
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-border/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: quotaColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${quotaPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] font-body text-text-muted">
                    {quotaPercentage}% utilise
                  </span>
                  {quotaPercentage >= 80 && quotaPercentage < 100 && (
                    <span className="text-[11px] font-body text-warning flex items-center gap-1">
                      <AlertTriangle size={10} />
                      Bientot atteint
                    </span>
                  )}
                  {quotaPercentage >= 100 && (
                    <span className="text-[11px] font-body text-danger flex items-center gap-1">
                      <AlertCircle size={10} />
                      Quota atteint
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ---- Plan comparison ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div id="plans-section" className="flex items-center gap-3 mb-4">
          <CreditCard size={18} className="text-primary" />
          <h2 className="text-lg font-display font-semibold text-text">
            {isFree ? 'Choisir un plan' : 'Nos plans'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PAID_PLANS.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanType={business.plan_type}
              onChangePlan={handleChangePlan}
              changingPlan={changingPlan}
              index={index}
            />
          ))}
        </div>
      </motion.div>

      {/* ---- Guarantee ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-center gap-6 py-4 text-xs font-body text-text-muted"
      >
        <span className="flex items-center gap-1.5">
          <Shield size={14} className="text-accent" />
          Paiement securise
        </span>
        <span className="w-px h-4 bg-border" />
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-primary" />
          Sans engagement
        </span>
        <span className="w-px h-4 bg-border" />
        <span className="flex items-center gap-1.5">
          <X size={14} className="text-text-muted" />
          Annulable a tout moment
        </span>
      </motion.div>

      {/* ---- Invoice history (placeholder) ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Receipt size={20} className="text-secondary" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-text">
                Historique des factures
              </h2>
              <p className="text-xs font-body text-text-muted">
                Consultez et telechargez vos factures
              </p>
            </div>
          </div>

          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-border/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Receipt size={28} className="text-text-muted/30" />
            </div>
            <p className="text-sm font-body text-text-muted">
              L&apos;historique de tes factures sera bientot disponible
            </p>
            <Badge variant="muted" size="sm" className="mt-2">
              Bientot disponible
            </Badge>
          </div>
        </Card>
      </motion.div>

      {/* ---- Toast notifications ---- */}
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastNotification
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
