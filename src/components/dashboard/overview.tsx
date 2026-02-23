'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Mail,
  Zap,
  BarChart3,
  Clock,
  CreditCard,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getQuotaPercentage, getQuotaColor, formatNumber } from '@/lib/utils';
import { PLANS } from '@/lib/constants';
import type { Business, Spin, PlanType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DashboardStats {
  reviewsThisMonth: number;
  reviewsPrevMonth: number;
  emailsThisMonth: number;
  emailsPrevMonth: number;
  totalSpinsThisMonth: number;
  totalSpinsPrevMonth: number;
  conversionRate: number;
  prevConversionRate: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface ChecklistState {
  accountCreated: boolean;
  googleLinkAdded: boolean;
  wheelConfigured: boolean;
  qrCodeDownloaded: boolean;
}

interface DashboardOverviewProps {
  business: Business;
  stats: DashboardStats;
  recentSpins: Spin[];
  dailyCounts: DailyCount[];
  checklist: ChecklistState;
  checklistComplete: boolean;
}

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------

function useAnimatedCounter(target: number, duration: number = 1000): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return count;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  iconColor,
  value,
  label,
  trend,
  suffix,
  delay,
}: {
  icon: React.ElementType;
  iconColor: string;
  value: number;
  label: string;
  trend: number;
  suffix?: string;
  delay: number;
}) {
  const animatedValue = useAnimatedCounter(value, 1200);
  const isPositive = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card hover padding="md" className="relative overflow-hidden">
        {/* Decorative gradient */}
        <div
          className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10"
          style={{ backgroundColor: iconColor }}
        />

        <div className="flex items-start justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon size={20} style={{ color: iconColor }} />
          </div>

          {/* Trend badge */}
          {trend !== 0 && (
            <Badge
              variant={isPositive ? 'success' : 'danger'}
              size="sm"
            >
              {isPositive ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {isPositive ? '+' : ''}
              {trend}%
            </Badge>
          )}
        </div>

        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-display font-bold text-text">
            {formatNumber(animatedValue)}
            {suffix && (
              <span className="text-lg text-text-muted ml-0.5">{suffix}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-text-muted font-body">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mini Bar Chart
// ---------------------------------------------------------------------------

function MiniBarChart({ data }: { data: DailyCount[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const hasData = data.some((d) => d.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="text-sm font-display font-semibold text-text">
              Avis ces 30 derniers jours
            </h3>
          </div>
        </div>

        {hasData ? (
          <div className="flex items-end gap-[3px] h-32">
            {data.map((day, i) => {
              const height = (day.count / maxCount) * 100;
              const dateObj = new Date(day.date);
              const dayLabel = dateObj.getDate().toString();

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-secondary text-white text-[10px] font-body px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                      {day.count} spin{day.count !== 1 ? 's' : ''} · {dayLabel}/{dateObj.getMonth() + 1}
                    </div>
                  </div>

                  {/* Bar */}
                  <motion.div
                    className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors min-h-[2px]"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{
                      duration: 0.6,
                      delay: 0.4 + i * 0.015,
                      ease: 'easeOut',
                    }}
                  />

                  {/* Date label — show every 5th day */}
                  {i % 5 === 0 && (
                    <span className="text-[9px] text-text-muted font-body">
                      {dayLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <span className="text-3xl mb-2">📊</span>
            <p className="text-sm text-text-muted font-body">
              Aucune donnée pour le moment
            </p>
            <p className="text-xs text-text-muted/70 font-body mt-1">
              Les données apparaitront ici après vos premiers spins
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Recent Activity
// ---------------------------------------------------------------------------

function RecentActivity({ spins }: { spins: Spin[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h3 className="text-sm font-display font-semibold text-text">
              Activité récente
            </h3>
          </div>
          {spins.length > 0 && (
            <Link
              href="/dashboard/clients"
              className="text-xs text-primary font-display font-medium hover:underline flex items-center gap-1"
            >
              Tout voir
              <ArrowUpRight size={12} />
            </Link>
          )}
        </div>

        {spins.length > 0 ? (
          <div className="space-y-1">
            {spins.map((spin, i) => {
              const timeAgo = getTimeAgo(spin.created_at);
              const email = spin.email
                ? truncateEmail(spin.email)
                : 'Anonyme';

              return (
                <motion.div
                  key={spin.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-background"
                >
                  <span className="text-lg shrink-0">
                    {spin.prize_emoji || '🎰'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text font-body truncate">
                      {spin.prize_label}
                    </p>
                    <p className="text-xs text-text-muted font-body truncate">
                      {email}
                    </p>
                  </div>
                  <span className="text-[11px] text-text-muted font-body shrink-0">
                    {timeAgo}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-3xl mb-2">🎰</span>
            <p className="text-sm text-text-muted font-body">
              Aucun spin pour le moment
            </p>
            <p className="text-xs text-text-muted/70 font-body mt-1">
              Partagez votre QR code pour recevoir vos premiers avis !
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Subscription Status
// ---------------------------------------------------------------------------

function SubscriptionStatus({ business }: { business: Business }) {
  const plan = PLANS.find((p) => p.id === business.plan_type);
  const status = business.subscription_status;
  const isTrialing = status === 'trialing';
  const isActive = status === 'active';
  const isExpired = status === 'expired' || status === 'canceled';

  // Trial countdown
  let trialDaysLeft = 0;
  if (isTrialing && business.trial_ends_at) {
    const now = new Date();
    const trialEnd = new Date(business.trial_ends_at);
    trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const statusConfig = {
    trialing: { label: 'Essai gratuit', variant: 'warning' as const },
    active: { label: 'Actif', variant: 'success' as const },
    past_due: { label: 'En retard', variant: 'danger' as const },
    canceled: { label: 'Annulé', variant: 'danger' as const },
    expired: { label: 'Expiré', variant: 'danger' as const },
  };

  const config = statusConfig[status] ?? statusConfig.expired;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={18} className="text-primary" />
          <h3 className="text-sm font-display font-semibold text-text">
            Abonnement
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-display font-bold text-text">
                {plan?.name ?? 'Plan'}
              </span>
              <Badge variant={config.variant} size="sm">
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-text-muted font-body mt-0.5">
              {plan?.price} {plan?.currency}/mois
            </p>
          </div>

          {(isExpired || status === 'past_due') && (
            <Link href="/dashboard/billing">
              <Button size="sm" variant="primary">
                Mettre à jour
              </Button>
            </Link>
          )}
        </div>

        {/* Trial countdown */}
        {isTrialing && (
          <div className="mt-3 rounded-xl bg-warning/10 border border-warning/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-warning shrink-0" />
              <p className="text-xs font-body text-text">
                <span className="font-semibold">{trialDaysLeft} jour{trialDaysLeft !== 1 ? 's' : ''}</span>{' '}
                restant{trialDaysLeft !== 1 ? 's' : ''} dans votre essai gratuit
              </p>
            </div>
          </div>
        )}

        {isActive && (
          <div className="mt-3 rounded-xl bg-accent/10 border border-accent/20 px-3 py-2">
            <p className="text-xs font-body text-accent font-medium">
              Votre abonnement est actif
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Spin Quota Bar
// ---------------------------------------------------------------------------

function SpinQuotaBar({ business, spinsUsed }: { business: Business; spinsUsed: number }) {
  const isPro = business.plan_type === 'pro';
  const limit = business.monthly_spin_limit;
  const pct = getQuotaPercentage(spinsUsed, limit);
  const barColor = getQuotaColor(pct);
  const isHigh = pct >= 80;
  const isFull = pct >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={18} className="text-primary" />
          <h3 className="text-sm font-display font-semibold text-text">
            Quota de spins
          </h3>
        </div>

        {isPro ? (
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <span className="text-sm font-display font-bold text-accent">
              Illimité
            </span>
            <span className="text-xs text-text-muted font-body">
              — {formatNumber(spinsUsed)} spins ce mois
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-body text-text">
                <span className="font-display font-bold">{formatNumber(spinsUsed)}</span>
                <span className="text-text-muted">/{formatNumber(limit)} spins ce mois</span>
              </span>
              <span className="text-xs font-display font-semibold" style={{ color: barColor }}>
                {pct}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 w-full rounded-full bg-border/40 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: barColor }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
              />
            </div>

            {/* Warning messages */}
            {isHigh && !isFull && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-warning/10 border border-warning/20 px-3 py-2">
                <AlertTriangle size={14} className="text-warning shrink-0" />
                <p className="text-xs font-body text-text">
                  Vous approchez de votre limite.{' '}
                  <Link href="/dashboard/billing" className="text-primary font-semibold hover:underline">
                    Passer au plan supérieur
                  </Link>
                </p>
              </div>
            )}

            {isFull && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-danger/10 border border-danger/20 px-3 py-2">
                <AlertTriangle size={14} className="text-danger shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-body text-text">
                    Limite atteinte ! Vos clients ne peuvent plus jouer ce mois-ci.
                  </p>
                  <Link href="/dashboard/billing">
                    <Button size="sm" variant="primary" className="mt-2">
                      <ArrowUpRight size={12} />
                      Passer au plan supérieur
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Onboarding Checklist
// ---------------------------------------------------------------------------

function OnboardingChecklist({ checklist }: { checklist: ChecklistState }) {
  const items = [
    { key: 'accountCreated', label: 'Compte créé', done: checklist.accountCreated },
    { key: 'googleLinkAdded', label: 'Lien Google ajouté', done: checklist.googleLinkAdded, href: '/dashboard/settings' },
    { key: 'wheelConfigured', label: 'Roue configurée', done: checklist.wheelConfigured, href: '/dashboard/wheel' },
    { key: 'qrCodeDownloaded', label: 'QR code téléchargé', done: checklist.qrCodeDownloaded, href: '/dashboard/qrcode' },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const progressPct = Math.round((completedCount / items.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-primary" />
            <h3 className="text-sm font-display font-semibold text-text">
              Mise en route
            </h3>
          </div>
          <Badge variant={progressPct === 100 ? 'success' : 'primary'} size="sm">
            {completedCount}/{items.length}
          </Badge>
        </div>

        {/* Mini progress bar */}
        <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, delay: 0.7, ease: 'easeOut' }}
          />
        </div>

        <div className="space-y-2">
          {items.map((item) => {
            const content = (
              <div
                key={item.key}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors',
                  !item.done && item.href && 'hover:bg-background cursor-pointer'
                )}
              >
                {item.done ? (
                  <CheckCircle2 size={16} className="text-accent shrink-0" />
                ) : (
                  <Circle size={16} className="text-border shrink-0" />
                )}
                <span
                  className={cn(
                    'text-sm font-body',
                    item.done ? 'text-text-muted line-through' : 'text-text'
                  )}
                >
                  {item.label}
                </span>
                {!item.done && item.href && (
                  <ArrowUpRight size={12} className="text-primary ml-auto shrink-0" />
                )}
              </div>
            );

            if (!item.done && item.href) {
              return (
                <Link key={item.key} href={item.href}>
                  {content}
                </Link>
              );
            }

            return <div key={item.key}>{content}</div>;
          })}
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'à l\u2019instant';
  if (diffMins < 60) return `il y a ${diffMins}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' });
}

function truncateEmail(email: string): string {
  if (email.length <= 20) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email.slice(0, 18) + '...';
  const truncatedLocal = local.length > 8 ? local.slice(0, 8) + '...' : local;
  return `${truncatedLocal}@${domain}`;
}

function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DashboardOverview({
  business,
  stats,
  recentSpins,
  dailyCounts,
  checklist,
  checklistComplete,
}: DashboardOverviewProps) {
  const reviewsTrend = calculateTrend(stats.reviewsThisMonth, stats.reviewsPrevMonth);
  const emailsTrend = calculateTrend(stats.emailsThisMonth, stats.emailsPrevMonth);
  const spinsTrend = calculateTrend(stats.totalSpinsThisMonth, stats.totalSpinsPrevMonth);
  const conversionTrend = stats.conversionRate - stats.prevConversionRate;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-display font-bold text-text">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-text-muted font-body mt-1">
          Bienvenue, voici un résumé de votre activité
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Star}
          iconColor="#FF6B35"
          value={stats.reviewsThisMonth}
          label="Avis ce mois"
          trend={reviewsTrend}
          delay={0.05}
        />
        <StatCard
          icon={Mail}
          iconColor="#10B981"
          value={stats.emailsThisMonth}
          label="Emails collectés"
          trend={emailsTrend}
          delay={0.1}
        />
        <StatCard
          icon={Zap}
          iconColor="#F59E0B"
          value={stats.totalSpinsThisMonth}
          label="Spins ce mois"
          trend={spinsTrend}
          delay={0.15}
        />
        <StatCard
          icon={BarChart3}
          iconColor="#8B5CF6"
          value={stats.conversionRate}
          label="Taux de conversion"
          trend={conversionTrend}
          suffix="%"
          delay={0.2}
        />
      </div>

      {/* Chart + Recent Activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <MiniBarChart data={dailyCounts} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity spins={recentSpins} />
        </div>
      </div>

      {/* Bottom row: Subscription + Quota + Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SubscriptionStatus business={business} />
        <SpinQuotaBar business={business} spinsUsed={stats.totalSpinsThisMonth} />
        {!checklistComplete && <OnboardingChecklist checklist={checklist} />}
      </div>
    </div>
  );
}
