'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Handshake,
  ToggleLeft,
  ToggleRight,
  Gift,
  Users,
  ArrowDownUp,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Store,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';
import { TEXTS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Offer {
  id: string;
  segment_id: string;
  monthly_stock: number;
  is_active: boolean;
}

interface Segment {
  id: string;
  label: string;
  emoji: string;
  color: string;
  is_winning: boolean;
  monthly_stock: number;
}

interface Partner {
  id: string;
  name: string;
  logo_url: string | null;
  sector: string;
  address: string | null;
  shared_offers: number;
}

interface Stats {
  given: number;
  received: number;
  claimed: number;
}

// ---------------------------------------------------------------------------
// How-it-works steps
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    icon: Store,
    title: 'Matching automatique',
    description: 'woopla vous met en relation avec des commerces d\'un autre secteur dans votre ville. Jamais de concurrence directe, uniquement de la complémentarité.',
    color: '#FF6B35',
  },
  {
    icon: Gift,
    title: 'Vous choisissez vos lots',
    description: 'Sélectionnez les lots de votre roue que vous souhaitez partager au réseau, avec un stock mensuel dédié que vous contrôlez.',
    color: '#4CAF50',
  },
  {
    icon: Sparkles,
    title: 'Échange de visibilité',
    description: 'Vos lots apparaissent sur la roue des partenaires, et les leurs sur la vôtre. Chaque commerce envoie de nouveaux clients chez l\'autre.',
    color: '#2196F3',
  },
  {
    icon: QrCode,
    title: 'Validation identique',
    description: 'Le client gagnant reçoit un code valable 15 jours. Il vient chez vous, vous validez le lot exactement comme d\'habitude.',
    color: '#9C27B0',
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NetworkPage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Stats>({ given: 0, received: 0, claimed: 0 });

  const [savingSegment, setSavingSegment] = useState<string | null>(null);

  // ---- Fetch all data ----
  const fetchData = useCallback(async () => {
    try {
      const [offersRes, partnersRes, statsRes, segmentsRes] = await Promise.all([
        fetch('/api/cross-promo/offers'),
        fetch('/api/cross-promo/partners'),
        fetch('/api/cross-promo/stats'),
        fetch('/api/dashboard/segments'),
      ]);

      const offersData = await offersRes.json();
      const partnersData = await partnersRes.json();
      const statsData = await statsRes.json();

      setOffers(offersData.offers ?? []);
      setPartners(partnersData.partners ?? []);
      setCity(partnersData.city ?? null);
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
    async function init() {
      try {
        const res = await fetch('/api/dashboard/business');
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.business?.cross_promo_enabled ?? false);
          setCity(data.business?.city ?? null);
        }
      } catch { /* */ }
      fetchData();
    }
    init();
  }, [fetchData]);

  // ---- Toggle cross-promo ----
  async function handleToggle() {
    setToggling(true);
    setRegionError(null);

    try {
      const res = await fetch('/api/cross-promo/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      const data = await res.json();

      if (data.error === 'region_not_available') {
        setRegionError(data.message);
        setToggling(false);
        return;
      }

      if (data.success) {
        setEnabled(data.cross_promo_enabled);
        setCity(data.city);
        fetchData();
      }
    } catch { /* */ }
    setToggling(false);
  }

  // ---- Toggle offer for a segment ----
  async function handleToggleOffer(segmentId: string) {
    const existingOffer = offers.find((o) => o.segment_id === segmentId);
    setSavingSegment(segmentId);

    try {
      if (existingOffer) {
        await fetch('/api/cross-promo/offers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment_id: segmentId }),
        });
      } else {
        await fetch('/api/cross-promo/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment_id: segmentId, monthly_stock: 5 }),
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
      await fetch('/api/cross-promo/offers', {
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

  const T = TEXTS.crossPromo;
  const sharedCount = offers.length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ================================================================
          Header
          ================================================================ */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Handshake className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-text">
            {T.pageTitle}
          </h1>
          <Badge variant="primary" size="sm">Beta</Badge>
        </div>
        <p className="text-sm font-body text-text-muted">
          Entraidez-vous entre commerçants de votre ville
        </p>
      </div>

      {/* ================================================================
          Pitch — le concept gagnant-gagnant
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border/40 p-6"
      >
        <h2 className="text-base font-display font-bold text-text mb-3">
          Le commerce local, ensemble
        </h2>

        <p className="text-sm font-body text-text-muted leading-relaxed mb-4">
          Le réseau local connecte des commerçants de <span className="font-semibold text-text">secteurs différents</span> dans une même ville. Un coiffeur avec un café, une boutique avec un restaurant... Jamais un concurrent direct.
        </p>

        <p className="text-sm font-body text-text-muted leading-relaxed mb-4">
          Le principe est simple : vous mettez certains de vos lots en jeu sur le réseau. En retour, <span className="font-semibold text-text">des lots de vos partenaires apparaissent automatiquement sur votre roue</span>. Quand un de vos clients gagne un lot partenaire, il découvre un nouveau commerce. Et quand un client d'un partenaire gagne un de vos lots, il vient chez vous.
        </p>

        <p className="text-sm font-body text-text-muted leading-relaxed mb-5">
          <span className="font-semibold text-text">C'est gagnant-gagnant</span> : chaque commerce du réseau profite de la clientèle des autres pour se faire connaître, tout en favorisant le commerce local et l'entraide entre commerçants.
        </p>

        {/* Comment ça marche — étapes */}
        <h3 className="text-sm font-display font-semibold text-text mb-3">Comment ça marche ?</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: step.color }} />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-text mb-0.5">
                    <span className="text-text-muted font-body mr-1">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-xs font-body text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Résumé */}
        <div className="mt-5 pt-4 border-t border-border/30 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs font-body text-text-muted">Coût</p>
            <p className="text-sm font-display font-bold text-success">Gratuit</p>
          </div>
          <div>
            <p className="text-xs font-body text-text-muted">Engagement</p>
            <p className="text-sm font-display font-bold text-text">Aucun</p>
          </div>
          <div>
            <p className="text-xs font-body text-text-muted">Validité lots</p>
            <p className="text-sm font-display font-bold text-text">15 jours</p>
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          Activation — CTA clair
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={cn(
          'rounded-2xl border p-6 transition-colors',
          enabled
            ? 'bg-primary/5 border-primary/30'
            : 'bg-surface border-border/40'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-1">
              {enabled ? (
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-text-muted/30" />
              )}
              <h2 className="text-lg font-display font-bold text-text">
                {enabled ? 'Réseau activé' : 'Rejoindre le réseau'}
              </h2>
            </div>
            {enabled && city ? (
              <div className="flex items-center gap-1.5 text-sm font-body text-text-muted">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {partners.length} partenaire{partners.length > 1 ? 's' : ''} à{' '}
                  <span className="font-semibold capitalize text-text">{city}</span>
                </span>
                {sharedCount > 0 && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{sharedCount} lot{sharedCount > 1 ? 's' : ''} partagé{sharedCount > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            ) : (
              <p className="text-sm font-body text-text-muted">
                Votre ville est détectée automatiquement depuis votre adresse
              </p>
            )}
          </div>

          {enabled ? (
            <button
              onClick={handleToggle}
              disabled={toggling}
              className="shrink-0"
              title="Désactiver le réseau"
            >
              {toggling ? (
                <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
              ) : (
                <ToggleRight className="w-10 h-10 text-primary" />
              )}
            </button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleToggle}
              loading={toggling}
              disabled={toggling}
            >
              {!toggling && <Handshake className="w-4 h-4" />}
              Activer
            </Button>
          )}
        </div>

        {regionError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 px-4 py-3 bg-warning/10 border border-warning/20 rounded-xl"
          >
            <p className="text-sm font-body text-warning">{regionError}</p>
          </motion.div>
        )}
      </motion.div>

      {/* ================================================================
          Lots partagés — visible uniquement si activé
          ================================================================ */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden"
          >
            <div className="bg-surface rounded-2xl border border-border/40 p-6">
              <div className="mb-2">
                <h2 className="text-lg font-display font-bold text-text">Quels lots partager ?</h2>
                <p className="text-sm font-body text-text-muted mt-1">
                  Voici vos lots gagnants. Activez ceux que vous souhaitez offrir aux clients des commerces partenaires et définissez un stock mensuel dédié.
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
                          <span className="text-[11px] font-body text-text-muted hidden sm:inline">Réseau :</span>
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
                        title={isShared ? 'Retirer du réseau' : 'Partager au réseau'}
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
                Ce stock est indépendant de votre roue. Les lots réseau sont valables 15 jours.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================================
          Mon réseau + stats — visible uniquement si activé
          ================================================================ */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-surface rounded-2xl border border-border/40 p-6">
              <h2 className="text-lg font-display font-bold text-text mb-4">
                Partenaires à {city && <span className="capitalize">{city}</span>}
              </h2>

              {partners.length > 0 ? (
                <>
                  <div className="space-y-2 mb-6">
                    {partners.map((partner) => (
                      <div
                        key={partner.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/30 bg-background"
                      >
                        {partner.logo_url ? (
                          <img
                            src={partner.logo_url}
                            alt={partner.name}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {getInitials(partner.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display font-semibold text-text truncate">
                            {partner.name}
                          </p>
                          <p className="text-xs font-body text-text-muted">
                            {partner.sector}
                          </p>
                        </div>
                        <Badge variant="muted" size="sm">
                          {partner.shared_offers} lot{partner.shared_offers > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
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
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-text-muted/20 mx-auto mb-3" />
                  <p className="text-sm font-body text-text-muted mb-1">
                    Aucun partenaire pour le moment{city ? ` à ${city}` : ''}.
                  </p>
                  <p className="text-xs font-body text-text-muted">
                    D'autres commerces rejoindront bientôt le réseau !
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
