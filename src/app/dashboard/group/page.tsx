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
  ToggleLeft,
  ToggleRight,
  Plus,
  ArrowRight,
  Settings,
  Zap,
  AlertCircle,
  Disc3,
  CreditCard,
  X,
  CircleCheck,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';
import { TEXTS } from '@/lib/constants';
import type { PlanType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroupInfo {
  id: string;
  name: string;
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
}

interface Offer {
  id: string;
  segment_id: string;
  monthly_stock: number;
  is_active: boolean;
  share_with: string;
}

interface Segment {
  id: string;
  label: string;
  emoji: string;
  color: string;
  is_winning: boolean;
  monthly_stock: number;
}

interface Stats {
  given: number;
  received: number;
  claimed: number;
}

// ---------------------------------------------------------------------------
// Status checklist helper
// ---------------------------------------------------------------------------

function MemberChecklist({ member, onSwitch, switching }: {
  member: Member;
  onSwitch: (id: string, dest: string) => void;
  switching: string | null;
}) {
  const isFree = member.plan_type === 'free';
  const hasWheel = member.winning_segment_count > 0;
  const hasOffers = member.shared_offer_count > 0;
  const hasPlan = !isFree;

  const steps = [
    {
      done: hasPlan,
      label: hasPlan ? `Plan ${member.plan_type}` : 'Plan Free',
      action: isFree ? () => onSwitch(member.id, '/dashboard/billing') : undefined,
      actionLabel: 'Upgrader',
      actionColor: 'text-warning',
    },
    {
      done: hasWheel,
      label: hasWheel ? `${member.winning_segment_count} lot${member.winning_segment_count > 1 ? 's' : ''} sur la roue` : 'Roue non configurée',
      action: !hasWheel ? () => onSwitch(member.id, '/dashboard/wheel') : undefined,
      actionLabel: 'Configurer',
      actionColor: 'text-primary',
    },
    {
      done: hasOffers,
      label: hasOffers ? `${member.shared_offer_count} lot${member.shared_offer_count > 1 ? 's' : ''} partagé${member.shared_offer_count > 1 ? 's' : ''}` : 'Aucun lot partagé',
      action: undefined, // handled by the offers section below
      actionLabel: undefined,
      actionColor: undefined,
    },
  ];

  const allDone = steps.every((s) => s.done);

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3',
        isFree ? 'bg-warning/5 border-warning/20' : allDone ? 'bg-background border-border/30' : 'bg-background border-border/30',
      )}
    >
      <div className="flex items-center gap-3">
        {member.logo_url ? (
          <img
            src={member.logo_url}
            alt={member.name}
            className="w-9 h-9 rounded-lg object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {getInitials(member.name)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-display font-semibold text-text truncate">
              {member.name}
            </p>
            <Badge variant={isFree ? 'warning' : 'muted'} size="sm" className="capitalize shrink-0">
              {member.plan_type}
            </Badge>
            {allDone && (
              <CircleCheck size={14} className="text-success shrink-0" />
            )}
          </div>
          {member.address && (
            <p className="text-[11px] font-body text-text-muted truncate">
              {member.address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onSwitch(member.id, '/dashboard')}
            disabled={switching === member.id}
            className="text-[11px] font-display font-semibold text-primary hover:text-primary-dark transition-colors disabled:opacity-50 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-primary/5"
          >
            <Settings size={11} />
            Gérer
          </button>
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-2.5 pl-12 space-y-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] font-body">
            {step.done ? (
              <CircleCheck size={13} className="text-success shrink-0" />
            ) : (
              <Circle size={13} className="text-text-muted/40 shrink-0" />
            )}
            <span className={step.done ? 'text-text-muted' : 'text-text'}>
              {step.label}
            </span>
            {step.action && step.actionLabel && (
              <button
                onClick={step.action}
                disabled={switching === member.id}
                className={cn(
                  'font-display font-semibold transition-colors disabled:opacity-50 flex items-center gap-0.5 ml-1',
                  step.actionColor
                )}
              >
                {step.actionLabel} →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Spins info */}
      <div className="mt-2 pl-12">
        <p className="text-[10px] font-body text-text-muted">
          {member.spins_this_month} spin{member.spins_this_month > 1 ? 's' : ''} ce mois
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GroupPage() {
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [stats, setStats] = useState<Stats>({ given: 0, received: 0, claimed: 0 });

  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [savingSegment, setSavingSegment] = useState<string | null>(null);
  const [error, setError] = useState('');

  const T = TEXTS.group;

  // ---- Fetch all data ----
  const fetchData = useCallback(async () => {
    try {
      const [bizRes, infoRes, offersRes, statsRes, segmentsRes] = await Promise.all([
        fetch('/api/dashboard/business'),
        fetch('/api/group/info'),
        fetch('/api/group/offers'),
        fetch('/api/group/stats'),
        fetch('/api/dashboard/segments'),
      ]);

      if (bizRes.ok) {
        const bizData = await bizRes.json();
        setPlanType(bizData.business?.plan_type ?? bizData.plan_type ?? 'free');
      }

      const infoData = await infoRes.json();
      const offersData = await offersRes.json();
      const statsData = await statsRes.json();

      setGroup(infoData.group ?? null);
      setMembers(infoData.members ?? []);
      setOffers(offersData.offers ?? []);
      setStats(statsData);

      if (segmentsRes.ok) {
        const segData = await segmentsRes.json();
        setSegments((segData.segments ?? []).filter((s: Segment) => s.is_winning));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // ---- Toggle offer for a segment ----
  async function handleToggleOffer(segmentId: string) {
    const existingOffer = offers.find((o) => o.segment_id === segmentId);
    setSavingSegment(segmentId);
    setError('');

    try {
      let res: Response;
      if (existingOffer) {
        res = await fetch('/api/group/offers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment_id: segmentId }),
        });
      } else {
        res = await fetch('/api/group/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment_id: segmentId, monthly_stock: 10 }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'Business is not in a group') {
          setError('Créez d\'abord un groupe pour partager des lots.');
        } else {
          setError(data.error || 'Erreur lors de la mise à jour.');
        }
      }

      await fetchData();
    } catch {
      setError('Erreur réseau. Réessayez.');
    }
    setSavingSegment(null);
  }

  // ---- Update offer stock ----
  async function handleUpdateStock(segmentId: string, stock: number) {
    setSavingSegment(segmentId);
    setError('');

    try {
      const res = await fetch('/api/group/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment_id: segmentId, monthly_stock: stock }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la mise à jour du stock.');
      }

      await fetchData();
    } catch {
      setError('Erreur réseau. Réessayez.');
    }
    setSavingSegment(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-text-muted" />
      </div>
    );
  }

  // ---- Upgrade gate for free/starter plans ----
  if (planType && planType !== 'growth' && planType !== 'pro') {
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
            <a
              href="mailto:xavier@qlip.ch?subject=woopla - Multi-établissements"
              className="text-sm font-body text-text-muted hover:text-primary transition-colors"
            >
              Contactez-nous
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
  const paidMembers = members.filter((m) => m.plan_type !== 'free');
  const freeMembers = members.filter((m) => m.plan_type === 'free');
  const membersWithOffers = members.filter((m) => m.shared_offer_count > 0);
  const membersWithoutOffers = members.filter((m) => m.shared_offer_count === 0);
  const membersWithoutWheel = members.filter((m) => m.winning_segment_count === 0);

  // Multi-establishment works when: group exists + at least 2 paid members + at least 2 members share offers
  const isGroupActive = !!group && paidMembers.length >= 2 && membersWithOffers.length >= 2;

  // Determine what's blocking
  function getStatusMessage(): { type: 'success' | 'warning' | 'error'; title: string; description: string } | null {
    if (!group) return null;

    if (isGroupActive) {
      return {
        type: 'success',
        title: 'Multi-établissements actif',
        description: `${membersWithOffers.length} établissements partagent des lots entre eux. Vos clients peuvent gagner des cadeaux croisés.`,
      };
    }

    if (members.length < 2) {
      return {
        type: 'warning',
        title: 'Ajoutez un 2e établissement',
        description: 'Il faut au moins 2 établissements dans le groupe pour activer le partage de lots.',
      };
    }

    if (paidMembers.length < 2) {
      const needed = 2 - paidMembers.length;
      return {
        type: 'error',
        title: `${needed} établissement${needed > 1 ? 's' : ''} à upgrader`,
        description: 'Il faut au moins 2 établissements avec un plan payant (Growth ou plus) pour que le partage fonctionne.',
      };
    }

    if (membersWithOffers.length < 2) {
      const needed = 2 - membersWithOffers.length;
      return {
        type: 'warning',
        title: `${needed} établissement${needed > 1 ? 's' : ''} sans lots partagés`,
        description: 'Chaque établissement doit partager au moins un lot pour que les clients puissent gagner des cadeaux croisés.',
      };
    }

    return null;
  }

  const statusMessage = getStatusMessage();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ================================================================
          Header
          ================================================================ */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Building2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-text">
            {T.pageTitle}
          </h1>
          <Badge variant="primary" size="sm">New</Badge>
        </div>
        <p className="text-sm font-body text-text-muted">
          {T.pageSubtitle}
        </p>
      </div>

      {/* ================================================================
          Global status banner
          ================================================================ */}
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
          ) : statusMessage.type === 'error' ? (
            <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
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

      {/* ================================================================
          Card 1 — Mon groupe + checklist par membre
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border/40 p-6"
      >
        {!group ? (
          // No group yet — creation flow
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
          // Group exists — show members with checklist
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-display font-bold text-text">
                  {group.name}
                </h2>
                <p className="text-sm font-body text-text-muted">
                  {members.length} établissement{members.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Summary line */}
            {members.length > 1 && (
              <p className="text-xs font-body text-text-muted mb-3">
                Total : {members.reduce((sum, m) => sum + m.spins_this_month, 0)} spins ce mois sur {members.length} établissements
              </p>
            )}

            <div className="space-y-2 mb-4">
              {members.map((member) => (
                <MemberChecklist
                  key={member.id}
                  member={member}
                  onSwitch={switchAndNavigate}
                  switching={switching}
                />
              ))}
            </div>

            <Link
              href="/dashboard/group/add"
              className="inline-flex items-center gap-2 text-sm font-display font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              {T.addLocationCta}
            </Link>

            <p className="text-xs font-body text-text-muted mt-3">
              {T.requiresGrowth}
            </p>
          </>
        )}
      </motion.div>

      {/* ================================================================
          Card 2 — Lots partagés au groupe (visible only if group exists)
          ================================================================ */}
      <AnimatePresence>
        {group && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden"
          >
            <div className="bg-surface rounded-2xl border border-border/40 p-6">
              <div className="mb-2">
                <h2 className="text-lg font-display font-bold text-text">{T.offersTitle}</h2>
                <p className="text-sm font-body text-text-muted mt-1">
                  {T.offersDescription}
                </p>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 bg-danger/5 border border-danger/20 text-danger rounded-xl px-3 py-2.5 mt-3 text-sm font-body">
                      <AlertCircle size={14} className="shrink-0" />
                      <span className="flex-1">{error}</span>
                      <button onClick={() => setError('')} className="shrink-0 p-0.5 hover:bg-danger/10 rounded">
                        <X size={12} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2 mt-4">
                {segments.map((seg) => {
                  const offer = offers.find((o) => o.segment_id === seg.id);
                  const isShared = !!offer;

                  return (
                    <div
                      key={seg.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                        isShared ? 'border-primary/30 bg-primary/5' : 'border-border/30 bg-background'
                      )}
                    >
                      <span className="text-xl shrink-0">{seg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-text truncate">{seg.label}</p>
                        <p className="text-[11px] font-body text-text-muted">
                          Stock roue : {seg.monthly_stock > 0 ? `${seg.monthly_stock}/mois` : 'illimité'}
                        </p>
                      </div>

                      {isShared && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] font-body text-text-muted hidden sm:inline">Groupe :</span>
                          <select
                            value={offer.monthly_stock}
                            onChange={(e) => handleUpdateStock(seg.id, parseInt(e.target.value))}
                            className="text-sm border border-border/40 rounded-lg px-2 py-1 bg-surface text-text w-16"
                          >
                            {[1, 2, 3, 5, 10, 15, 20, 30, 50].map((n) => (
                              <option key={n} value={n}>{n}/m</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        onClick={() => handleToggleOffer(seg.id)}
                        disabled={savingSegment === seg.id}
                        className="shrink-0"
                        title={isShared ? 'Retirer du groupe' : 'Partager au groupe'}
                      >
                        {savingSegment === seg.id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                        ) : isShared ? (
                          <ToggleRight className="w-8 h-8 text-primary" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-text-muted" />
                        )}
                      </button>
                    </div>
                  );
                })}

                {segments.length === 0 && (
                  <div className="text-center py-6">
                    <Gift className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                    <p className="text-sm font-body text-text-muted">
                      Aucun lot gagnant configuré sur votre roue.
                    </p>
                    <p className="text-xs font-body text-text-muted mt-1">
                      Ajoutez des lots depuis la page "Ma Roue" pour les partager ici.
                    </p>
                    <Link href="/dashboard/wheel" className="inline-flex items-center gap-1.5 mt-3 text-sm font-display font-semibold text-primary hover:text-primary-dark transition-colors">
                      <Disc3 size={14} />
                      Configurer ma roue
                    </Link>
                  </div>
                )}
              </div>

              <p className="text-xs font-body text-text-muted mt-4 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 shrink-0" />
                Ce stock est indépendant de votre roue. La validité suit les paramètres de chaque établissement.
              </p>

              {/* Per-member offers summary */}
              {members.length > 1 && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <h3 className="text-xs font-display font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Lots partagés par établissement
                  </h3>
                  <div className="space-y-1">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg">
                        <span className="text-sm font-body text-text truncate">{m.name}</span>
                        <span className={cn(
                          'text-xs font-body',
                          m.shared_offer_count > 0 ? 'text-primary' : 'text-text-muted/50'
                        )}>
                          {m.shared_offer_count > 0
                            ? `${m.shared_offer_count} lot${m.shared_offer_count > 1 ? 's' : ''}`
                            : 'aucun'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {membersWithoutOffers.length > 0 && (
                    <p className="text-[11px] font-body text-text-muted mt-2">
                      Basculez sur chaque établissement pour configurer ses lots partagés.
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
          Card 3 — Statistiques du groupe
          ================================================================ */}
      <AnimatePresence>
        {group && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-surface rounded-2xl border border-border/40 p-6">
              <h2 className="text-lg font-display font-bold text-text mb-4">
                {T.statsTitle}
              </h2>

              <h3 className="text-sm font-display font-semibold text-text mb-3">Ce mois-ci</h3>
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

              {/* Per-member table */}
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
      </AnimatePresence>
    </div>
  );
}
