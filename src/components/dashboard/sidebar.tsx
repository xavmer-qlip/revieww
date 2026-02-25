'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Disc3,
  QrCode,
  Users,
  ShieldCheck,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  X,
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
}

interface SidebarProps {
  businessName: string;
  businessLogoUrl: string | null;
  planType: PlanType;
  spinsUsed: number;
  spinsLimit: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Vue d\u2019ensemble', href: '/dashboard' },
  { icon: Disc3, label: 'Ma Roue', href: '/dashboard/wheel' },
  { icon: QrCode, label: 'Mon QR Code', href: '/dashboard/qrcode' },
  { icon: Users, label: 'Avis & Contacts', href: '/dashboard/clients' },
  { icon: ShieldCheck, label: 'Valider un lot', href: '/dashboard/validate' },
  {
    icon: MessageSquare,
    label: 'Messages',
    href: '/dashboard/messages',
    disabled: true,
    badge: 'Bient\u00f4t',
  },
  { icon: Settings, label: 'Param\u00e8tres', href: '/dashboard/settings' },
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

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  const content = (
    <motion.div
      whileHover={item.disabled ? undefined : { x: 4 }}
      whileTap={item.disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
        item.disabled && 'cursor-not-allowed opacity-50',
        isActive
          ? 'bg-sidebar-hover/80 text-white'
          : !item.disabled && 'text-white/60 hover:bg-sidebar-hover hover:text-white'
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

      {item.badge && (
        <Badge variant="muted" size="sm" className="ml-auto bg-white/10 text-white/40 text-[10px]">
          {item.badge}
        </Badge>
      )}
    </motion.div>
  );

  if (item.disabled) {
    return <div>{content}</div>;
  }

  return (
    <Link href={item.href} prefetch>
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
          <span className="text-sky">Illimit\u00e9 \u2728</span>
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
}: {
  businessName: string;
  businessLogoUrl: string | null;
  planType: PlanType;
}) {
  const plan = PLAN_META[planType];

  return (
    <div className="flex items-center gap-3 px-3 py-3">
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
          <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
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
