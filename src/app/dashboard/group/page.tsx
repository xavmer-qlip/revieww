'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Gift,
  ArrowDownUp,
  Check,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Lock,
  ArrowRight,
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
// Page
// ---------------------------------------------------------------------------

export default function GroupPage() {
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [stats, setStats] = useState<Stats>({ given: 0, received: 0, claimed: 0 });

  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [savingSegment, setSavingSegment] = useState<string | null>(null);

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

    try {
      if (existingOffer) {
        await fetch('/api/group/offers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment_id: segmentId }),
        });
      } else {
        await fetch('/api/group/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment_id: segmentId, monthly_stock: 10 }),
        });
      }
      await fetchData();
    } catch { /* */ }
    setSavingSegment(null);
  }

  // ---- Update offer stock ----
  async function handleUpdateStock(segmentId: string, stock: number) {
    setSavingSegment(segmentId);
    try {
      await fetch('/api/group/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment_id: segmentId, monthly_stock: stock }),
      });
      await fetchData();
    } catch { /* */ }
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
            Disponible avec le plan Growth (39 CHF/mois) ou Pro (79 CHF/mois)
          </p>
        </motion.div>
      </div>
    );
  }

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
          Card 1 — Mon groupe
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
          // Group exists — show members
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

            <div className="space-y-2 mb-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30 bg-background"
                >
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
                    <p className="text-sm font-display font-semibold text-text truncate">
                      {member.name}
                    </p>
                    {member.address && (
                      <p className="text-[11px] font-body text-text-muted truncate">
                        {member.address}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="muted" size="sm" className="capitalize">
                      {member.plan_type}
                    </Badge>
                    <p className="text-[10px] font-body text-text-muted mt-0.5">
                      {member.spins_this_month} spin{member.spins_this_month > 1 ? 's' : ''} ce mois
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="/onboarding?add=true"
              className="inline-flex items-center gap-2 text-sm font-display font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              {T.addLocationCta}
            </a>

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
                  </div>
                )}
              </div>

              <p className="text-xs font-body text-text-muted mt-4 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 shrink-0" />
                Ce stock est indépendant de votre roue. La validité suit les paramètres de chaque établissement.
              </p>
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
