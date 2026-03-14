'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  Building2,
  Gift,
  ArrowDownUp,
  Check,
  Loader2,
  Plus,
  ArrowRight,
  Settings,
  AlertCircle,
  Disc3,
  X,
  CircleCheck,
  Circle,
  ChevronDown,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';
import { TEXTS, isGroupEligible } from '@/lib/constants';
import type { PlanType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroupInfo {
  id: string;
  name: string;
}

interface MemberSegment {
  id: string;
  label: string;
  emoji: string;
  color: string;
  monthly_stock: number;
}

interface SharedOffer {
  id: string;
  segment_id: string;
  monthly_stock: number;
  is_active: boolean;
}

interface Member {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  plan_type: string;
  slug: string;
  spins_this_month: number;
  monthly_spin_limit: number;
  winning_segment_count: number;
  shared_offer_count: number;
  segments: MemberSegment[];
  shared_offers: SharedOffer[];
}

interface Stats {
  given: number;
  received: number;
  claimed: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STOCK_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 30, 50];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GroupPage() {
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats>({ given: 0, received: 0, claimed: 0 });

  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState<string | null>(null); // segment_id being saved
  const [error, setError] = useState('');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const T = TEXTS.group;

  // ---- Fetch all data ----
  const fetchData = useCallback(async () => {
    try {
      const [bizRes, infoRes, statsRes] = await Promise.all([
        fetch('/api/dashboard/business'),
        fetch('/api/group/info'),
        fetch('/api/group/stats'),
      ]);

      if (bizRes.ok) {
        const bizData = await bizRes.json();
        setPlanType(bizData.business?.plan_type ?? bizData.plan_type ?? 'free');
      }

      const infoData = await infoRes.json();
      const statsData = await statsRes.json();

      setGroup(infoData.group ?? null);
      setMembers(infoData.members ?? []);
      setStats(statsData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-expand first eligible member with segments
  useEffect(() => {
    if (!expandedMember && members.length > 0) {
      const first = members.find((m) => isGroupEligible(m.plan_type) && m.segments.length > 0);
      if (first) setExpandedMember(first.id);
    }
  }, [members, expandedMember]);

  // ---- Switch business + navigate ----
  async function switchAndNavigate(businessId: string, destination: string) {
    setSwitching(businessId);
    try {
      const res = await fetch('/api/dashboard/switch-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      if (res.ok) {
        window.location.href = destination;
      }
    } finally {
      setSwitching(null);
    }
  }

  // ---- Create group ----
  async function handleCreateGroup() {
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/group/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim() }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch { /* */ }
    setCreating(false);
  }

  // ---- Toggle a segment's sharing for a specific business ----
  async function handleToggleSegment(businessId: string, segmentId: string, currentlyShared: boolean) {
    setSaving(segmentId);
    setError('');

    try {
      const res = await fetch('/api/group/offers', {
        method: currentlyShared ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment_id: segmentId,
          business_id: businessId,
          ...(currentlyShared ? {} : { monthly_stock: 5 }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la mise à jour.');
      } else {
        await fetchData();
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    }
    setSaving(null);
  }

  // ---- Update stock for a shared segment ----
  async function handleUpdateStock(businessId: string, segmentId: string, stock: number) {
    setSaving(segmentId);
    setError('');

    try {
      const res = await fetch('/api/group/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment_id: segmentId, business_id: businessId, monthly_stock: stock }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la mise à jour.');
      } else {
        await fetchData();
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
    }
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  // ---- Upgrade gate for ineligible plans ----
  if (planType && !isGroupEligible(planType)) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border/40 p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-display font-bold text-text mb-3">
            Mes établissements
          </h1>

          <p className="text-sm font-body text-text-muted leading-relaxed max-w-md mx-auto mb-6">
            Vous gérez plusieurs points de vente ? Avec le plan Growth ou Pro, regroupez vos établissements et partagez vos lots entre eux. Vos clients peuvent gagner un cadeau dans un de vos autres établissements, ce qui génère du trafic croisé.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left max-w-lg mx-auto">
            {[
              { emoji: '🏪', text: 'Gérez plusieurs établissements depuis un seul compte' },
              { emoji: '🎁', text: 'Partagez vos lots entre vos différents points de vente' },
              { emoji: '📊', text: 'Statistiques agrégées pour suivre la performance globale' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-background rounded-xl p-3">
                <span className="text-lg shrink-0">{item.emoji}</span>
                <p className="text-xs font-body text-text-muted leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/dashboard/billing">
              <Button variant="primary" size="lg">
                Passer au plan Growth
                <ArrowRight size={16} />
              </Button>
            </a>
          </div>

          <p className="text-xs font-body text-text-muted/60 mt-4">
            Disponible avec le plan Growth (59 CHF/mois) ou Pro (89 CHF/mois)
          </p>
        </motion.div>
      </div>
    );
  }

  // ---- Global status computation ----
  const eligibleMembers = members.filter((m) => isGroupEligible(m.plan_type));
  const eligibleWithOffers = members.filter((m) => isGroupEligible(m.plan_type) && m.shared_offer_count > 0);
  const isGroupActive = !!group && eligibleMembers.length >= 2 && eligibleWithOffers.length >= 2;

  function getStatusMessage(): { type: 'success' | 'warning' | 'error'; title: string; description: string } | null {
    if (!group) return null;

    if (isGroupActive) {
      return {
        type: 'success',
        title: 'Multi-établissements actif',
        description: `${eligibleWithOffers.length} établissements partagent des lots. Vos clients peuvent gagner des cadeaux croisés.`,
      };
    }

    if (members.length < 2) {
      return {
        type: 'warning',
        title: 'Ajoutez un 2e établissement',
        description: 'Il faut au moins 2 établissements pour activer le partage de lots.',
      };
    }

    if (eligibleMembers.length < 2) {
      return {
        type: 'error',
        title: `${2 - eligibleMembers.length} établissement${2 - eligibleMembers.length > 1 ? 's' : ''} à upgrader`,
        description: 'Il faut au moins 2 établissements en plan Growth ou Pro.',
      };
    }

    if (eligibleWithOffers.length < 2) {
      return {
        type: 'warning',
        title: 'Configurez les lots partagés',
        description: 'Activez au moins un lot par établissement ci-dessous.',
      };
    }

    return null;
  }

  const statusMessage = getStatusMessage();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Building2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-text">
            {T.pageTitle}
          </h1>
        </div>
        <p className="text-sm font-body text-text-muted">
          {T.pageSubtitle}
        </p>
      </div>

      {/* Global status banner */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3',
            statusMessage.type === 'success' && 'border-success/20 bg-success/5',
            statusMessage.type === 'warning' && 'border-warning/20 bg-warning/5',
            statusMessage.type === 'error' && 'border-danger/20 bg-danger/5',
          )}
        >
          {statusMessage.type === 'success' ? (
            <CircleCheck size={18} className="text-success shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className={cn('shrink-0 mt-0.5', statusMessage.type === 'error' ? 'text-danger' : 'text-warning')} />
          )}
          <div>
            <p className="text-sm font-display font-semibold text-text">
              {statusMessage.title}
            </p>
            <p className="text-xs font-body text-text-muted mt-0.5">
              {statusMessage.description}
            </p>
          </div>
        </motion.div>
      )}

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 text-danger rounded-xl px-3 py-2.5 text-sm font-body">
              <AlertCircle size={14} className="shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="shrink-0 p-0.5 hover:bg-danger/10 rounded">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
          Card 1 — Mon groupe
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border/40 p-6"
      >
        {!group ? (
          <>
            <h2 className="text-lg font-display font-bold text-text mb-2">
              {T.createTitle}
            </h2>
            <p className="text-sm font-body text-text-muted leading-relaxed mb-4">
              {T.createDescription}
            </p>

            <div className="flex gap-3">
              <Input
                id="group-name"
                placeholder={T.groupNamePlaceholder}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateGroup}
                loading={creating}
                disabled={creating || !groupName.trim()}
              >
                {!creating && <Building2 className="w-4 h-4" />}
                {T.createCta}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-display font-bold text-text">
                {group.name}
              </h2>
            </div>
            <p className="text-sm font-body text-text-muted mb-4">
              {members.length} établissement{members.length > 1 ? 's' : ''}
              {members.length > 1 && ` · ${members.reduce((sum, m) => sum + m.spins_this_month, 0)} spins ce mois`}
            </p>

            {/* Member list - compact */}
            <div className="space-y-1.5 mb-4">
              {members.map((member) => {
                const eligible = isGroupEligible(member.plan_type);
                const allDone = eligible && member.winning_segment_count > 0 && member.shared_offer_count > 0;
                return (
                  <div
                    key={member.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl border',
                      !eligible ? 'bg-warning/5 border-warning/20' : 'bg-background border-border/30',
                    )}
                  >
                    {member.logo_url ? (
                      <img src={member.logo_url} alt={member.name} className="w-7 h-7 rounded-md object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-display font-semibold text-text truncate">{member.name}</p>
                        {allDone && <CircleCheck size={13} className="text-success shrink-0" />}
                      </div>
                      <p className="text-[10px] font-body text-text-muted">
                        {eligible
                          ? `${member.shared_offer_count} lot${member.shared_offer_count !== 1 ? 's' : ''} partagé${member.shared_offer_count !== 1 ? 's' : ''}`
                          : `${member.plan_type} · Growth requis`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={!eligible ? 'warning' : 'muted'} size="sm" className="capitalize text-[9px]">
                        {member.plan_type}
                      </Badge>
                      {!eligible && (
                        <button
                          onClick={() => switchAndNavigate(member.id, '/dashboard/billing')}
                          disabled={switching === member.id}
                          className="text-[10px] font-display font-semibold text-warning disabled:opacity-50"
                        >
                          Upgrader →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/dashboard/group/add"
              className="inline-flex items-center gap-2 text-sm font-display font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              {T.addLocationCta}
            </Link>
          </>
        )}
      </motion.div>

      {/* ================================================================
          Card 2 — Lots partagés (per-member, expandable)
          ================================================================ */}
      {group && eligibleMembers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-2xl border border-border/40 p-6"
        >
          <h2 className="text-lg font-display font-bold text-text mb-1">
            Lots partagés
          </h2>
          <p className="text-sm font-body text-text-muted mb-4">
            Pour chaque établissement, choisissez les lots que les clients des autres pourront gagner.
          </p>

          <div className="space-y-3">
            {members.map((member) => {
              const eligible = isGroupEligible(member.plan_type);
              if (!eligible) return null;

              const isExpanded = expandedMember === member.id;
              const sharedCount = member.shared_offers.filter((o) => o.is_active).length;

              return (
                <div key={member.id} className="rounded-xl border border-border/30 overflow-hidden">
                  {/* Member header - tap to expand */}
                  <button
                    onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-background/50 transition-colors"
                  >
                    {member.logo_url ? (
                      <img src={member.logo_url} alt={member.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-text truncate">{member.name}</p>
                      <p className="text-[11px] font-body text-text-muted">
                        {sharedCount > 0
                          ? `${sharedCount} lot${sharedCount > 1 ? 's' : ''} partagé${sharedCount > 1 ? 's' : ''}`
                          : 'Aucun lot partagé'}
                      </p>
                    </div>
                    {sharedCount > 0 && <CircleCheck size={14} className="text-success shrink-0" />}
                    <ChevronDown
                      size={16}
                      className={cn('text-text-muted transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>

                  {/* Segments list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/30 px-4 py-2 space-y-1">
                          {member.segments.length === 0 ? (
                            <div className="py-4 text-center">
                              <p className="text-sm font-body text-text-muted">
                                Aucun lot configuré sur la roue.
                              </p>
                              <button
                                onClick={() => switchAndNavigate(member.id, '/dashboard/wheel')}
                                disabled={switching === member.id}
                                className="inline-flex items-center gap-1.5 mt-2 text-sm font-display font-semibold text-primary hover:text-primary-dark transition-colors disabled:opacity-50"
                              >
                                <Disc3 size={14} />
                                Configurer la roue
                              </button>
                            </div>
                          ) : (
                            member.segments.map((seg) => {
                              const offer = member.shared_offers.find((o) => o.segment_id === seg.id && o.is_active);
                              const isShared = !!offer;

                              return (
                                <div
                                  key={seg.id}
                                  className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                                    isShared ? 'bg-primary/5' : 'bg-transparent'
                                  )}
                                >
                                  {/* Checkbox */}
                                  <button
                                    onClick={() => handleToggleSegment(member.id, seg.id, isShared)}
                                    disabled={saving === seg.id}
                                    className="shrink-0"
                                  >
                                    {saving === seg.id ? (
                                      <Loader2 size={18} className="animate-spin text-text-muted" />
                                    ) : isShared ? (
                                      <div className="w-[18px] h-[18px] rounded bg-primary flex items-center justify-center">
                                        <Check size={12} className="text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-[18px] h-[18px] rounded border-2 border-border" />
                                    )}
                                  </button>

                                  {/* Label */}
                                  <span className="text-base shrink-0">{seg.emoji}</span>
                                  <span className={cn(
                                    'flex-1 text-sm font-body truncate',
                                    isShared ? 'text-text' : 'text-text-muted'
                                  )}>
                                    {seg.label}
                                  </span>

                                  {/* Quantity selector */}
                                  {isShared && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          const idx = STOCK_OPTIONS.indexOf(offer.monthly_stock);
                                          if (idx > 0) handleUpdateStock(member.id, seg.id, STOCK_OPTIONS[idx - 1]);
                                        }}
                                        disabled={saving === seg.id || STOCK_OPTIONS.indexOf(offer.monthly_stock) === 0}
                                        className="w-6 h-6 rounded-md bg-border/30 flex items-center justify-center text-text-muted hover:bg-border/50 disabled:opacity-30 transition-colors"
                                      >
                                        <Minus size={12} />
                                      </button>
                                      <span className="text-xs font-display font-semibold text-text w-8 text-center">
                                        {offer.monthly_stock}
                                      </span>
                                      <button
                                        onClick={() => {
                                          const idx = STOCK_OPTIONS.indexOf(offer.monthly_stock);
                                          if (idx < STOCK_OPTIONS.length - 1) handleUpdateStock(member.id, seg.id, STOCK_OPTIONS[idx + 1]);
                                        }}
                                        disabled={saving === seg.id || STOCK_OPTIONS.indexOf(offer.monthly_stock) === STOCK_OPTIONS.length - 1}
                                        className="w-6 h-6 rounded-md bg-border/30 flex items-center justify-center text-text-muted hover:bg-border/50 disabled:opacity-30 transition-colors"
                                      >
                                        <Plus size={12} />
                                      </button>
                                      <span className="text-[10px] font-body text-text-muted">/mois</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] font-body text-text-muted mt-4 flex items-start gap-1.5">
            <Gift className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Ce stock est dédié au groupe, indépendant de la roue de chaque établissement.
          </p>
        </motion.div>
      )}

      {/* ================================================================
          Card 3 — Statistiques du groupe
          ================================================================ */}
      {group && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-surface rounded-2xl border border-border/40 p-6">
            <h2 className="text-lg font-display font-bold text-text mb-4">
              {T.statsTitle}
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background rounded-xl p-4 text-center">
                <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-display font-bold text-text">{stats.given}</p>
                <p className="text-[11px] font-body text-text-muted leading-tight">{T.statsGiven}</p>
              </div>
              <div className="bg-background rounded-xl p-4 text-center">
                <ArrowDownUp className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-xl font-display font-bold text-text">{stats.received}</p>
                <p className="text-[11px] font-body text-text-muted leading-tight">{T.statsReceived}</p>
              </div>
              <div className="bg-background rounded-xl p-4 text-center">
                <Check className="w-5 h-5 text-success mx-auto mb-1" />
                <p className="text-xl font-display font-bold text-text">{stats.claimed}</p>
                <p className="text-[11px] font-body text-text-muted leading-tight">{T.statsClaimed}</p>
              </div>
            </div>

            {members.length > 1 && (
              <div className="mt-4">
                <h3 className="text-sm font-display font-semibold text-text mb-2">Par établissement</h3>
                <div className="space-y-1">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background">
                      <span className="text-sm font-body text-text truncate">{m.name}</span>
                      <span className="text-xs font-body text-text-muted">{m.spins_this_month} spins</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
