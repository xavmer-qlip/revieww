'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MailCheck, CheckCircle2, Building2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { Badge } from '@/components/ui/badge';
import { getInitials, formatNumber } from '@/lib/utils';
import type { PlanType } from '@/lib/types';

const PLAN_BADGE: Record<PlanType, { label: string; variant: 'primary' | 'success' | 'warning' | 'muted' }> = {
  free: { label: 'Free', variant: 'muted' },
  starter: { label: 'Starter', variant: 'warning' },
  growth: { label: 'Growth', variant: 'primary' },
  pro: { label: 'Pro', variant: 'success' },
};

interface BusinessSummary {
  id: string;
  name: string;
  logo_url: string | null;
  plan_type: PlanType;
}

interface DashboardShellProps {
  children: React.ReactNode;
  businessName: string;
  businessLogoUrl: string | null;
  planType: PlanType;
  spinsUsed: number;
  spinsLimit: number;
  emailVerified: boolean;
  businesses: BusinessSummary[];
  activeBusinessId: string;
}

export function DashboardShell({
  children,
  businessName,
  businessLogoUrl,
  planType,
  spinsUsed,
  spinsLimit,
  emailVerified,
  businesses,
  activeBusinessId,
}: DashboardShellProps) {
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);

  const toggleMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Show success banner when redirected from verify-email
  useEffect(() => {
    if (searchParams.get('verified') === 'true' && emailVerified) {
      setShowVerifiedBanner(true);
      const timer = setTimeout(() => setShowVerifiedBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, emailVerified]);

  const handleResendVerification = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      const res = await fetch('/api/send-verification', { method: 'POST' });
      if (res.ok) {
        setResendSuccess(true);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        businessName={businessName}
        businessLogoUrl={businessLogoUrl}
        planType={planType}
        spinsUsed={spinsUsed}
        spinsLimit={spinsLimit}
        mobileOpen={mobileMenuOpen}
        onMobileClose={closeMenu}
        businesses={businesses}
        activeBusinessId={activeBusinessId}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-64">
        {/* Mobile topbar */}
        <Topbar onMenuToggle={toggleMenu} />

        {/* Desktop context bar */}
        <div className="hidden lg:flex items-center gap-3 px-6 py-2 border-b border-border/40 bg-surface/50 text-sm">
          {businessLogoUrl ? (
            <img src={businessLogoUrl} alt={businessName} className="h-6 w-6 rounded-md object-cover" />
          ) : (
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
              {getInitials(businessName)}
            </div>
          )}
          <span className="font-display font-semibold text-text">{businessName}</span>
          <Badge variant={PLAN_BADGE[planType].variant} size="sm">
            {PLAN_BADGE[planType].label}
          </Badge>
          <span className="text-text-muted">·</span>
          <span className="text-text-muted font-body">
            {planType === 'pro'
              ? `${formatNumber(spinsUsed)} spins ce mois`
              : planType === 'free'
                ? `${formatNumber(spinsUsed)} / ${formatNumber(spinsLimit)} spins restants`
                : `${formatNumber(spinsUsed)} / ${formatNumber(spinsLimit)} spins ce mois`}
          </span>
        </div>

        {/* Email verified success banner */}
        {showVerifiedBanner && (
          <div className="border-b border-sky/20 bg-sky/10 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm font-medium text-sky">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Email vérifié avec succès ! Votre page est maintenant active.</span>
            </div>
          </div>
        )}

        {/* Email verification banner */}
        {!emailVerified && (
          <div className="border-b border-warning/20 bg-warning/10 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-warning">
                <MailCheck className="h-4 w-4 shrink-0" />
                <span>Vérifiez votre email pour activer votre page.</span>
              </div>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="shrink-0 text-sm font-semibold text-warning underline-offset-2 hover:underline disabled:opacity-50"
              >
                {resendSuccess
                  ? 'Lien envoyé !'
                  : resending
                    ? 'Envoi…'
                    : 'Renvoyer le lien →'}
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
