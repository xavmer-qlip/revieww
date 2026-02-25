'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
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
  QrCode,
  Disc3,
  Users,
  ShieldCheck,
  Send,
  Copy,
  ExternalLink,
  Download,
  Share2,
  X,
  Maximize2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, getQuotaPercentage, getQuotaColor, formatNumber } from '@/lib/utils';
import { PLANS, PLAY_URL, APP_URL } from '@/lib/constants';
import type { Business, Spin, PlanType } from '@/lib/types';
import QRCode from 'qrcode';

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
  isFirstTime: boolean;
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
              Activité ces 30 derniers jours
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
              Partagez votre QR code pour recevoir vos premiers spins !
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
  const isFree = status === 'free';
  const isActive = status === 'active';
  const isExpired = status === 'expired' || status === 'canceled';

  const statusConfig: Record<string, { label: string; variant: 'muted' | 'success' | 'danger' }> = {
    free: { label: 'Gratuit', variant: 'muted' },
    active: { label: 'Actif', variant: 'success' },
    past_due: { label: 'En retard', variant: 'danger' },
    canceled: { label: 'Annulé', variant: 'danger' },
    expired: { label: 'Expiré', variant: 'danger' },
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
              {isFree ? 'Gratuit' : `${plan?.price} ${plan?.currency}/mois`}
            </p>
          </div>

          {(isFree || isExpired || status === 'past_due') && (
            <Link href="/dashboard/billing">
              <Button size="sm" variant="primary">
                {isFree ? 'Upgrader' : 'Mettre à jour'}
              </Button>
            </Link>
          )}
        </div>

        {isFree && (
          <div className="mt-3 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
            <p className="text-xs font-body text-primary font-medium">
              {business.monthly_spin_limit - 0} spins restants sur votre plan gratuit
            </p>
          </div>
        )}

        {isActive && (
          <div className="mt-3 rounded-xl bg-sky/10 border border-sky/20 px-3 py-2">
            <p className="text-xs font-body text-sky font-medium">
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
            <Sparkles size={16} className="text-sky" />
            <span className="text-sm font-display font-bold text-sky">
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
            className="h-full rounded-full bg-sky"
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
                  <CheckCircle2 size={16} className="text-sky shrink-0" />
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
// Activation Hero (first-time empty state)
// ---------------------------------------------------------------------------

function ActivationHero({ business }: { business: Business }) {
  const playUrl = `${PLAY_URL}/${business.slug}`;
  const validateUrl = '/validate';
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [googlePhotoUrl, setGooglePhotoUrl] = useState<string | null>(null);
  const [qrZoomed, setQrZoomed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem(`activation_${business.id}`);
      return stored ? new Set(JSON.parse(stored)) : new Set<number>();
    } catch { return new Set<number>(); }
  });
  const [activeStep, setActiveStep] = useState(() => {
    try {
      const stored = localStorage.getItem(`activation_${business.id}`);
      const done = stored ? new Set(JSON.parse(stored)) : new Set<number>();
      if (!done.has(0)) return 0;
      if (!done.has(1)) return 1;
      if (!done.has(2)) return 2;
      return 0; // All done — show step 0 by default (QR code)
    } catch { return 0; }
  });

  // Editable sharing message
  const qrPublicUrl = `${APP_URL}/qr/${business.slug}`;
  const defaultMessage = `Salut l'equipe !\n\nOn met en place revieww pour ${business.name}. Nos clients pourront tourner la roue de la fortune et gagner un cadeau.\n\nComment ca marche :\n1. Presentez le QR code aux clients apres leur visite\n2. Ils scannent, tournent la roue et decouvrent leur lot\n3. S'ils gagnent, ils recoivent un code par email valable lors de leur prochaine visite\n4. Verifiez et validez leur code ici : ${typeof window !== 'undefined' ? window.location.origin : ''}${validateUrl}\n\nVoici le QR code a presenter aux clients : ${qrPublicUrl}\nLien direct vers la roue : ${playUrl}\n\nImportant : les lots sont a remettre lors de la prochaine visite du client (non encaissables immediatement).\n\nTestez vous-meme en cliquant sur le lien !`;
  const [shareMessage, setShareMessage] = useState(defaultMessage);
  const [editingMessage, setEditingMessage] = useState(false);

  // Generate QR code
  useEffect(() => {
    QRCode.toDataURL(playUrl, {
      width: 512,
      margin: 2,
      color: { dark: '#1B2A4A', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [playUrl]);

  // Try to load Google business photo
  useEffect(() => {
    if (!business.google_place_id) return;
    const img = new Image();
    img.src = `/api/places/photo?placeId=${business.google_place_id}`;
    img.onload = () => setGooglePhotoUrl(img.src);
    img.onerror = () => {}; // silently fail
  }, [business.google_place_id]);

  const markDone = (step: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      try { localStorage.setItem(`activation_${business.id}`, JSON.stringify([...next])); } catch {}
      return next;
    });
    // Auto advance to next incomplete step
    if (step < 2) setActiveStep(step + 1);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const sendWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
    markDone(1);
  };

  const sendEmail = () => {
    const subject = encodeURIComponent(`revieww \u2014 animation commerciale pour ${business.name}`);
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    markDone(1);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${business.slug}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleShareQR = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `qr-${business.slug}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `QR Code - ${business.name}` });
      } else {
        handleDownloadQR();
      }
    } catch {
      handleDownloadQR();
    }
  };

  const allDone = completedSteps.size >= 3;

  const STEPS = [
    {
      num: 0,
      icon: ExternalLink,
      title: 'Testez la roue',
      subtitle: 'Vivez l\u2019exp\u00e9rience client pour mieux l\u2019expliquer \u00e0 votre \u00e9quipe',
    },
    {
      num: 1,
      icon: Send,
      title: 'Partagez avec votre \u00e9quipe',
      subtitle: 'Envoyez le lien et les instructions \u00e0 vos collaborateurs',
    },
    {
      num: 2,
      icon: Disc3,
      title: 'D\u00e9couvrez votre dashboard',
      subtitle: 'Personnalisez votre roue, t\u00e9l\u00e9chargez le QR et suivez votre activit\u00e9',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Hero header with QR + Google photo */}
      <Card padding="md" className="overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Business info + photo */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border/30"
              />
            ) : googlePhotoUrl ? (
              <img
                src={googlePhotoUrl}
                alt={business.name}
                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-border/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-display font-bold text-primary">
                  {business.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-display font-bold text-text truncate">
                {allDone ? 'Vous \u00eates pr\u00eat !' : `Activez ${business.name}`}
              </h2>
              <p className="text-sm text-text-muted font-body">
                {allDone
                  ? 'Partagez votre QR code et lancez votre animation'
                  : `${completedSteps.size}/3 \u00e9tapes compl\u00e9t\u00e9es`}
              </p>
            </div>
          </div>

          {/* QR Code — tap to zoom */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {qrDataUrl ? (
              <button onClick={() => setQrZoomed(true)} className="p-2 bg-white rounded-xl shadow-sm border border-border/30 cursor-pointer hover:shadow-md transition-shadow relative group">
                <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 sm:w-28 sm:h-28" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl transition-colors flex items-center justify-center">
                  <Maximize2 size={18} className="text-gray-600 opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
              </button>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-border/20 rounded-xl animate-pulse" />
            )}
            <button onClick={() => setQrZoomed(true)} className="text-[10px] font-body text-primary hover:underline flex items-center gap-1">
              <Maximize2 size={10} />
              Agrandir
            </button>
          </div>
        </div>

      </Card>

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              completedSteps.has(i) ? 'bg-success' : 'bg-border/50',
            )}
          />
        ))}
      </div>

      {/* Step cards */}
      {STEPS.map((step, idx) => {
        const isDone = completedSteps.has(step.num);
        const isActive = activeStep === step.num;
        const StepIcon = step.icon;

        return (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <Card
              padding="md"
              className={cn(
                'transition-all duration-200',
                isActive && 'border-primary/30 shadow-md',
                isDone && !isActive && 'opacity-70',
              )}
            >
              {/* Step header — always clickable to reopen */}
              <button
                onClick={() => setActiveStep(isActive ? -1 : step.num)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
                  isDone
                    ? 'bg-success/10'
                    : isActive
                      ? 'bg-primary/10'
                      : 'bg-border/30',
                )}>
                  {isDone ? (
                    <CheckCircle2 size={16} className="text-success" />
                  ) : (
                    <StepIcon size={16} className={isActive ? 'text-primary' : 'text-text-muted'} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    'text-sm font-display font-semibold',
                    isDone && !isActive ? 'text-text-muted line-through' : 'text-text',
                  )}>
                    {step.title}
                  </h3>
                  {!isActive && (
                    <p className="text-xs font-body text-text-muted/70 truncate">{step.subtitle}</p>
                  )}
                </div>
                {isDone && (
                  <Badge variant="success" size="sm">Fait</Badge>
                )}
              </button>

              {/* Step content — expanded when active (even if done, to allow review) */}
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 pl-11">
                    <p className="text-xs font-body text-text-muted mb-4">{step.subtitle}</p>

                    {/* Step 0: Test the wheel */}
                    {step.num === 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            href={playUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markDone(0)}
                            className="flex-1"
                          >
                            <Button variant="primary" size="sm" className="w-full">
                              <ExternalLink size={14} />
                              Tester la roue
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyLink}>
                            <Copy size={14} />
                            {copied ? 'Copié !' : 'Copier le lien'}
                          </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadQR}>
                            <Download size={14} />
                            Télécharger le QR
                          </Button>
                          <Link href="/dashboard/qrcode" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <QrCode size={14} />
                              Page QR Code
                            </Button>
                          </Link>
                        </div>
                        {/* Direct link display */}
                        <div
                          onClick={handleCopyLink}
                          className="flex items-center gap-2 rounded-lg bg-background border border-border/50 px-3 py-2 cursor-pointer hover:border-primary/30 transition-all"
                        >
                          <span className="flex-1 min-w-0 truncate text-xs font-mono text-text-muted">
                            {playUrl}
                          </span>
                          {copied ? <CheckCircle2 size={14} className="text-success shrink-0" /> : <ExternalLink size={14} className="text-text-muted shrink-0" />}
                        </div>
                        {!isDone && (
                          <button
                            onClick={() => markDone(0)}
                            className="text-xs font-body text-primary hover:underline"
                          >
                            Marquer comme fait
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 1: Share with team — QR download + editable message */}
                    {step.num === 1 && (
                      <div className="space-y-3">
                        {/* QR code — tap to enlarge */}
                        <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-3 py-3">
                          {qrDataUrl && (
                            <button onClick={() => setQrZoomed(true)} className="shrink-0 cursor-pointer relative group">
                              <img src={qrDataUrl} alt="QR" className="w-14 h-14 rounded-lg" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                <Maximize2 size={14} className="text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow" />
                              </div>
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-display font-semibold text-text">
                              QR code de votre commerce
                            </p>
                            <p className="text-[10px] font-body text-text-muted mt-0.5">
                              Appuyez pour agrandir ou sauvegarder
                            </p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="outline" size="sm" onClick={handleShareQR}>
                              <Share2 size={13} />
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleDownloadQR}>
                              <Download size={13} />
                            </Button>
                          </div>
                        </div>

                        {/* Editable message preview */}
                        <div className="rounded-xl bg-background border border-border/50 overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
                            <span className="text-[11px] font-display font-semibold text-text-muted">
                              {'Message pour votre \u00e9quipe'}
                            </span>
                            <button
                              onClick={() => setEditingMessage(!editingMessage)}
                              className="text-[11px] font-body text-primary hover:underline"
                            >
                              {editingMessage ? 'Terminer' : 'Modifier'}
                            </button>
                          </div>
                          {editingMessage ? (
                            <textarea
                              value={shareMessage}
                              onChange={(e) => setShareMessage(e.target.value)}
                              className="w-full p-3 text-xs font-body text-text bg-transparent resize-none focus:outline-none min-h-[180px]"
                            />
                          ) : (
                            <div className="p-3 max-h-32 overflow-y-auto">
                              <p className="text-[11px] font-body text-text-muted leading-relaxed whitespace-pre-line">
                                {shareMessage}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Share buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="primary" size="sm" onClick={sendWhatsApp} className="flex-1">
                            <Send size={14} />
                            WhatsApp
                          </Button>
                          <Button variant="outline" size="sm" onClick={sendEmail} className="flex-1">
                            <Mail size={14} />
                            Email
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { handleCopyMessage(); markDone(1); }} className="flex-1">
                            <Copy size={14} />
                            {copied ? 'Copi\u00e9 !' : 'Copier'}
                          </Button>
                        </div>
                        <p className="text-[10px] font-body text-text-muted/60">
                          {"Le lien QR est inclus dans le message — WhatsApp affichera un aper\u00e7u automatiquement"}
                        </p>
                        {!isDone && (
                          <button
                            onClick={() => markDone(1)}
                            className="text-xs font-body text-primary hover:underline"
                          >
                            Marquer comme fait
                          </button>
                        )}
                      </div>
                    )}

                    {/* Step 2: Discover dashboard */}
                    {step.num === 2 && (
                      <div className="space-y-2">
                        {[
                          { icon: Disc3, label: 'Ma Roue', desc: 'Personnalisez vos lots', href: '/dashboard/wheel' },
                          { icon: QrCode, label: 'Mon QR Code', desc: 'T\u00e9l\u00e9chargez et imprimez', href: '/dashboard/qrcode' },
                          { icon: Users, label: 'Fichier client', desc: 'Vos contacts pour newsletters et campagnes', href: '/dashboard/clients' },
                          { icon: ShieldCheck, label: 'Valider un lot', desc: 'V\u00e9rifiez les codes gagnants', href: '/dashboard/validate' },
                        ].map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => markDone(2)}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-background transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <ItemIcon size={14} className="text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-display font-medium text-text">{item.label}</p>
                                <p className="text-xs font-body text-text-muted">{item.desc}</p>
                              </div>
                              <ArrowUpRight size={14} className="text-text-muted/40 group-hover:text-primary transition-colors shrink-0" />
                            </Link>
                          );
                        })}
                        {!isDone && (
                          <button
                            onClick={() => markDone(2)}
                            className="text-xs font-body text-primary hover:underline mt-2"
                          >
                            Marquer comme fait
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        );
      })}

      {/* QR Fullscreen Modal */}
      <AnimatePresence>
        {qrZoomed && qrDataUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6"
            onClick={() => setQrZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setQrZoomed(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>

              <div className="text-center">
                <p className="font-display font-bold text-text text-lg mb-1">{business.name}</p>
                <p className="font-body text-text-muted text-xs mb-5">Scannez pour jouer et gagner un cadeau</p>
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 mx-auto rounded-xl" />
                <p className="font-mono text-[10px] text-text-muted/60 mt-3 truncate">{playUrl}</p>
              </div>

              <div className="flex gap-2 mt-5">
                <Button variant="primary" size="sm" className="flex-1" onClick={handleShareQR}>
                  <Share2 size={14} />
                  Partager
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadQR}>
                  <Download size={14} />
                  Sauvegarder
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  isFirstTime,
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

      {/* Activation hero for first-time users */}
      {isFirstTime && <ActivationHero business={business} />}

      {/* Stats section (blurred when first time) */}
      <div className={cn(isFirstTime && 'relative')}>
        {isFirstTime && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
            <p className="text-sm font-display font-semibold text-text-muted bg-surface/80 px-4 py-2 rounded-xl shadow-sm">
              Vos statistiques apparaîtront après votre premier spin
            </p>
          </div>
        )}
        <div className={cn('space-y-6', isFirstTime && 'opacity-40 pointer-events-none')}>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Star}
              iconColor="#FF6B35"
              value={stats.reviewsThisMonth}
              label="Lots gagnés"
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
