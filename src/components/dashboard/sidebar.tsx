'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Disc3,
  QrCode,
  Users,
  ShieldCheck,
  Handshake,
  Building2,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  X,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials, getQuotaPercentage, getQuotaColor } from '@/lib/utils';
import type { PlanType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  disabled?: boolean;
  badge?: string;
  requiredPlan?: PlanType[];
}

interface BusinessSummary {
  id: string;
  name: string;
  logo_url: string | null;
  plan_type: PlanType;
}

interface SidebarProps {
  businessName: string;
  businessLogoUrl: string | null;
  planType: PlanType;
  spinsUsed: number;
  spinsLimit: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  businesses: BusinessSummary[];
  activeBusinessId: string;
}

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Vue d\'ensemble', href: '/dashboard' },
  { icon: Disc3, label: 'Ma Roue', href: '/dashboard/wheel' },
  { icon: QrCode, label: 'Mon QR Code', href: '/dashboard/qrcode' },
  { icon: Users, label: 'Fichier client', href: '/dashboard/clients' },
  { icon: ShieldCheck, label: 'Valider un lot', href: '/dashboard/validate' },
  { icon: Handshake, label: 'Réseau local', href: '/dashboard/network', badge: 'Beta' },
  { icon: Building2, label: 'Mes établissements', href: '/dashboard/group', badge: 'New' },
  { icon: MessageSquare, label: 'Messages', href: '/dashboard/messages', badge: 'Bientôt' },
  { icon: Settings, label: 'Paramètres', href: '/dashboard/settings' },
  { icon: CreditCard, label: 'Abonnement', href: '/dashboard/billing' },
];

// ---------------------------------------------------------------------------
// Plan badge helper
// ---------------------------------------------------------------------------

const PLAN_META: Record<PlanType, { label: string; variant: 'primary' | 'success' | 'warning' | 'muted' }> = {
  free: { label: 'Free', variant: 'muted' },
  starter: { label: 'Starter', variant: 'warning' },
  growth: { label: 'Growth', variant: 'primary' },
  pro: { label: 'Pro', variant: 'success' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavLink({ item, isActive, onNavigate, planType }: { item: NavItem; isActive: boolean; onNavigate?: () => void; planType: PlanType }) {
  const Icon = item.icon;

  // Check plan requirement
  const meetsRequirement = !item.requiredPlan || item.requiredPlan.includes(planType);
  const isLocked = item.requiredPlan && !meetsRequirement;

  const content = (
    <motion.div
      whileHover={item.disabled || isLocked ? undefined : { x: 4 }}
      whileTap={item.disabled || isLocked ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
        (item.disabled || isLocked) && 'cursor-not-allowed opacity-50',
        isActive
          ? 'bg-sidebar-hover/80 text-white'
          : !(item.disabled || isLocked) && 'text-white/60 hover:bg-sidebar-hover hover:text-white'
      )}
    >
      {/* Active indicator — orange left bar */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-sidebar-active"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <Icon
        size={18}
        className={cn(
          'shrink-0 transition-colors duration-200',
          isActive ? 'text-sidebar-active' : 'text-white/50 group-hover:text-white/80'
        )}
      />

      <span className="truncate">{item.label}</span>

      {isLocked ? (
        <Badge variant="muted" size="sm" className="ml-auto bg-white/10 text-white/40 text-[10px]">
          Growth
        </Badge>
      ) : item.badge ? (
        <Badge variant="muted" size="sm" className="ml-auto bg-white/10 text-white/40 text-[10px]">
          {item.badge}
        </Badge>
      ) : null}
    </motion.div>
  );

  if (item.disabled || isLocked) {
    return <div>{content}</div>;
  }

  return (
    <Link href={item.href} prefetch onClick={onNavigate}>
      {content}
    </Link>
  );
}

function SpinQuota({
  spinsUsed,
  spinsLimit,
  planType,
}: {
  spinsUsed: number;
  spinsLimit: number;
  planType: PlanType;
}) {
  const isPro = planType === 'pro';
  const pct = getQuotaPercentage(spinsUsed, spinsLimit);
  const color = getQuotaColor(pct);

  return (
    <div className="px-3 py-3">
      <div className="flex items-center justify-between text-[11px] font-medium text-white/50 mb-2">
        <span>Spins ce mois</span>
        {isPro ? (
          <span className="text-sky">Illimité ✨</span>
        ) : (
          <span>
            {spinsUsed} / {spinsLimit}
          </span>
        )}
      </div>
      {!isPro && (
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
}

function BusinessCard({
  businessName,
  businessLogoUrl,
  planType,
  businesses,
  activeBusinessId,
}: {
  businessName: string;
  businessLogoUrl: string | null;
  planType: PlanType;
  businesses: BusinessSummary[];
  activeBusinessId: string;
}) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const plan = PLAN_META[planType];
  const hasMultiple = businesses.length > 1;

  async function handleSwitch(businessId: string) {
    if (businessId === activeBusinessId) {
      setOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await fetch('/api/dashboard/switch-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        router.refresh();
        setOpen(false);
      }
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => hasMultiple && setOpen(!open)}
        className={cn(
          'flex items-center gap-3 px-3 py-3 w-full text-left',
          hasMultiple && 'cursor-pointer hover:bg-sidebar-hover rounded-xl transition-colors'
        )}
      >
        {/* Avatar */}
        {businessLogoUrl ? (
          <img
            src={businessLogoUrl}
            alt={businessName}
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-xs font-bold text-white ring-1 ring-white/10">
            {getInitials(businessName)}
          </div>
        )}

        {/* Name + Plan */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{businessName}</p>
          <Badge variant={plan.variant} size="sm" className="mt-0.5">
            {plan.label}
          </Badge>
        </div>

        {hasMultiple && (
          <ChevronDown
            size={16}
            className={cn(
              'text-white/40 transition-transform',
              open && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && hasMultiple && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            className="absolute bottom-full left-2 right-2 mb-1 bg-sidebar-hover rounded-xl border border-white/10 overflow-hidden z-50"
          >
            <div className="py-1 max-h-48 overflow-y-auto">
              {businesses.map((biz) => {
                const isActive = biz.id === activeBusinessId;
                const bizPlan = PLAN_META[biz.plan_type];
                return (
                  <button
                    key={biz.id}
                    onClick={() => handleSwitch(biz.id)}
                    disabled={switching}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 w-full text-left transition-colors',
                      isActive ? 'bg-white/10' : 'hover:bg-white/5',
                      switching && 'opacity-50'
                    )}
                  >
                    {biz.logo_url ? (
                      <img
                        src={biz.logo_url}
                        alt={biz.name}
                        className="h-7 w-7 rounded-md object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20 text-[10px] font-bold text-white">
                        {getInitials(biz.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white">{biz.name}</p>
                      <Badge variant={bizPlan.variant} size="sm" className="mt-0.5 text-[9px]">
                        {bizPlan.label}
                      </Badge>
                    </div>
                    {isActive && <Check size={14} className="text-sidebar-active shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Add new establishment */}
            <div className="border-t border-white/10 p-1">
              <Link
                href="/dashboard/group/add"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                <Plus size={14} />
                <span>Ajouter un établissement</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar({
  businessName,
  businessLogoUrl,
  planType,
  spinsUsed,
  spinsLimit,
  mobileOpen = false,
  onMobileClose,
  businesses,
  activeBusinessId,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar">
      {/* ---- Logo ---- */}
      <div className="flex items-center justify-between px-5 pt-6 pb-6">
        <Logo variant="light" size="sm" showTagline />

        {/* Close button — only on mobile overlay */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-sidebar-hover hover:text-white lg:hidden"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ---- Divider ---- */}
      <div className="mx-4 h-px bg-white/[0.06]" />

      {/* ---- Navigation ---- */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} onNavigate={onMobileClose} planType={planType} />
        ))}
      </nav>

      {/* ---- Bottom section ---- */}
      <div className="mt-auto">
        {/* Divider */}
        <div className="mx-4 h-px bg-white/[0.06]" />

        {/* Spin quota */}
        <SpinQuota spinsUsed={spinsUsed} spinsLimit={spinsLimit} planType={planType} />

        {/* Divider */}
        <div className="mx-4 h-px bg-white/[0.06]" />

        {/* Business card */}
        <BusinessCard
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          planType={planType}
          businesses={businesses}
          activeBusinessId={activeBusinessId}
        />

        {/* Logout */}
        <div className="px-3 pb-4 pt-1">
          <form action="/api/auth/logout" method="POST">
            <motion.button
              type="submit"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40 transition-colors duration-200 hover:bg-danger/10 hover:text-danger"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ============================================================
          Desktop sidebar — always visible, fixed
          ============================================================ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {sidebarContent}
      </aside>

      {/* ============================================================
          Mobile sidebar — overlay drawer
          ============================================================ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
