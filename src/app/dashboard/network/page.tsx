'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Handshake,
  ToggleLeft,
  ToggleRight,
  Gift,
  Users,
  ArrowDownUp,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  wheel_segments: {
    id: string;
    label: string;
    emoji: string;
    color: string;
  };
}

interface Segment {
  id: string;
  label: string;
  emoji: string;
  color: string;
  is_winning: boolean;
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
// Page
// ---------------------------------------------------------------------------

export default function NetworkPage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [city, setCity] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState('');
  const [showCityForm, setShowCityForm] = useState(false);
  const [toggling, setToggling] = useState(false);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [stats, setStats] = useState<Stats>({ given: 0, received: 0, claimed: 0 });

  const [savingSegment, setSavingSegment] = useState<string | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);

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

  // ---- Fetch enabled state from business ----
  useEffect(() => {
    async function fetchBusiness() {
      try {
        const res = await fetch('/api/cross-promo/partners');
        const data = await res.json();
        setCity(data.city ?? null);
        // If we have partners, the feature is enabled
        // Also check toggle state via a separate mechanism
      } catch { /* */ }
    }
    fetchBusiness();
  }, []);

  useEffect(() => {
    // Initial enabled state: fetch from business data
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
    if (!enabled && !city) {
      setShowCityForm(true);
      return;
    }

    setToggling(true);
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

      if (data.error === 'city_required') {
        setShowCityForm(true);
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

  // ---- Submit city then enable ----
  async function handleCitySubmit() {
    if (!cityInput.trim()) return;
    setToggling(true);
    try {
      const res = await fetch('/api/cross-promo/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, city: cityInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setEnabled(true);
        setCity(data.city);
        setShowCityForm(false);
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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Handshake className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold text-text">
            {T.pageTitle}
          </h1>
          <Badge variant="primary" size="sm">Beta</Badge>
        </div>
        <p className="text-sm font-body text-text-muted">
          {T.pageSubtitle}
        </p>
      </div>

      {/* ================================================================
          Card 1: Activation
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border/40 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-text">{T.activationTitle}</h2>
            <p className="text-sm font-body text-text-muted mt-1">
              {T.activationDescription}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="shrink-0"
          >
            {toggling ? (
              <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
            ) : enabled ? (
              <ToggleRight className="w-10 h-10 text-primary" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-text-muted" />
            )}
          </button>
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

        {showCityForm && !city && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-end gap-3 mt-4"
          >
            <div className="flex-1">
              <Input
                id="city"
                label={T.cityLabel}
                placeholder={T.cityPlaceholder}
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleCitySubmit}
              disabled={!cityInput.trim() || toggling}
              loading={toggling}
            >
              <Check className="w-4 h-4" />
              Activer
            </Button>
          </motion.div>
        )}

        {enabled && city && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-2 px-3 py-2 bg-primary/5 rounded-xl"
          >
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-body text-text">
              {partners.length} {T.partnersCount}{' '}
              <span className="font-semibold capitalize">{city}</span>
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* ================================================================
          Card 2: Mes lots partagés
          ================================================================ */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-2xl border border-border/40 p-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-display font-bold text-text">{T.offersTitle}</h2>
            <p className="text-sm font-body text-text-muted mt-1">
              {T.offersDescription}
            </p>
          </div>

          <div className="space-y-3">
            {segments.map((seg) => {
              const offer = offers.find((o) => o.segment_id === seg.id);
              const isShared = !!offer;

              return (
                <div
                  key={seg.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors',
                    isShared ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-background'
                  )}
                >
                  <span className="text-xl">{seg.emoji}</span>
                  <span className="flex-1 text-sm font-body font-medium text-text">
                    {seg.label}
                  </span>

                  {isShared && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-body text-text-muted">{T.offersStockLabel}:</label>
                      <select
                        value={offer.monthly_stock}
                        onChange={(e) => handleUpdateStock(seg.id, parseInt(e.target.value))}
                        className="text-sm border border-border/40 rounded-lg px-2 py-1 bg-surface text-text"
                      >
                        {[1, 2, 3, 5, 10, 15, 20, 30, 50].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={() => handleToggleOffer(seg.id)}
                    disabled={savingSegment === seg.id}
                    className="shrink-0"
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
              <p className="text-sm font-body text-text-muted text-center py-6">
                Aucun lot gagnant configuré sur votre roue.
              </p>
            )}
          </div>

          <p className="text-xs font-body text-text-muted mt-4">
            {T.offersValidityNote}
          </p>
        </motion.div>
      )}

      {/* ================================================================
          Card 3: Mon réseau
          ================================================================ */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface rounded-2xl border border-border/40 p-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-display font-bold text-text">{T.networkTitle}</h2>
          </div>

          {partners.length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-background"
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
                      {partner.shared_offers} lots
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background rounded-xl p-4 text-center">
                  <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-display font-bold text-text">{stats.given}</p>
                  <p className="text-xs font-body text-text-muted">{T.statsGiven}</p>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <ArrowDownUp className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xl font-display font-bold text-text">{stats.received}</p>
                  <p className="text-xs font-body text-text-muted">{T.statsReceived}</p>
                </div>
                <div className="bg-background rounded-xl p-4 text-center">
                  <Check className="w-5 h-5 text-success mx-auto mb-1" />
                  <p className="text-xl font-display font-bold text-text">{stats.claimed}</p>
                  <p className="text-xs font-body text-text-muted">{T.statsClaimed}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Handshake className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
              <p className="text-sm font-body text-text-muted mb-1">
                {T.networkEmpty}{city ? ` à ${city}` : ''}.
              </p>
              <p className="text-xs font-body text-text-muted">
                {T.networkEmptyInvite}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
