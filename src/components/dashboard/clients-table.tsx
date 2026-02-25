'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Star,
  Filter,
  Users,
  Disc3,
  TrendingUp,
  QrCode,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Spin } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientsTableProps {
  spins: Spin[];
  totalCount: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

type DateFilter = '7d' | '30d' | 'all';

const ROWS_PER_PAGE = 15;

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border font-body text-sm',
        toast.type === 'success'
          ? 'bg-sky/10 border-sky/20 text-sky'
          : 'bg-danger/10 border-danger/20 text-danger'
      )}
    >
      {toast.type === 'success' ? (
        <Check size={16} />
      ) : (
        <AlertCircle size={16} />
      )}
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-auto p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Star rating display
// ---------------------------------------------------------------------------

function StarRating({ stars }: { stars: number | null }) {
  if (!stars) return <span className="text-text-muted text-xs">-</span>;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={cn(
            'transition-colors',
            i <= stars
              ? 'text-warning fill-warning'
              : 'text-border fill-transparent'
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card padding="md" hover className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '15' }}
        >
          <Icon size={22} style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-text">{value}</p>
          <p className="text-xs font-body text-text-muted mt-0.5">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('fr-CH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ClientsTable({ spins, totalCount }: ClientsTableProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [prizeFilter, setPrizeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [claimedMap, setClaimedMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    spins.forEach((s) => { map[s.id] = s.claimed; });
    return map;
  });

  // ---- Toast helpers ----
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Toggle claimed status ----
  const handleToggleClaimed = useCallback(async (spinId: string) => {
    const current = claimedMap[spinId] ?? false;
    const newValue = !current;

    // Optimistic update
    setClaimedMap((prev) => ({ ...prev, [spinId]: newValue }));

    try {
      const res = await fetch('/api/toggle-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spinId, claimed: newValue }),
      });

      if (!res.ok) throw new Error('update failed');
      addToast('success', newValue ? 'Lot marqué comme réclamé' : 'Lot marqué comme non réclamé');
    } catch {
      // Revert on error
      setClaimedMap((prev) => ({ ...prev, [spinId]: current }));
      addToast('error', 'Erreur lors de la mise à jour');
    }
  }, [claimedMap, addToast]);

  // ---- Unique prizes for filter dropdown ----
  const uniquePrizes = useMemo(() => {
    const prizes = new Set(spins.map((s) => s.prize_label));
    return Array.from(prizes).sort();
  }, [spins]);

  // ---- Filtered data ----
  const filteredSpins = useMemo(() => {
    let result = [...spins];

    // Search by email
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.email.toLowerCase().includes(query) ||
          (s.phone && s.phone.toLowerCase().includes(query))
      );
    }

    // Filter by prize
    if (prizeFilter !== 'all') {
      result = result.filter((s) => s.prize_label === prizeFilter);
    }

    // Filter by date
    if (dateFilter === '7d') {
      result = result.filter((s) => isWithinDays(s.created_at, 7));
    } else if (dateFilter === '30d') {
      result = result.filter((s) => isWithinDays(s.created_at, 30));
    }

    return result;
  }, [spins, searchQuery, prizeFilter, dateFilter]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const uniqueEmails = new Set(spins.map((s) => s.email)).size;
    const totalSpins = spins.length;
    const winners = spins.filter((s) => s.is_winner).length;
    const conversionRate =
      totalSpins > 0 ? Math.round((winners / totalSpins) * 100) : 0;

    return { uniqueEmails, totalSpins, conversionRate };
  }, [spins]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredSpins.length / ROWS_PER_PAGE));
  const paginatedSpins = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredSpins.slice(start, start + ROWS_PER_PAGE);
  }, [filteredSpins, currentPage]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, prizeFilter, dateFilter]);

  // ---- CSV Export ----
  const handleExportCSV = useCallback(() => {
    if (spins.length === 0) {
      addToast('error', 'Aucune donnee a exporter');
      return;
    }

    const headers = [
      'Date',
      'Email',
      'Telephone',
      'Lot gagne',
      'Code',
      'Gagnant',
      'Reclame',
      'Etoiles',
      'Marketing opt-in',
    ];

    const rows = spins.map((s) => {
      return [
        formatDate(s.created_at),
        s.email,
        s.phone || '',
        `${s.prize_emoji || ''} ${s.prize_label}`,
        s.validation_code || '',
        s.is_winner ? 'Oui' : 'Non',
        (claimedMap[s.id] ?? s.claimed) ? 'Oui' : 'Non',
        s.self_reported_stars?.toString() || '',
        s.opted_in_marketing ? 'Oui' : 'Non',
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts-revieww-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export CSV telecharge !');
  }, [spins, claimedMap, addToast]);

  // ---- Empty state ----
  if (spins.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-text">
            Avis & Contacts
          </h1>
          <p className="text-sm font-body text-text-muted mt-1">
            Retrouvez tous les contacts collectes via votre roue
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card padding="lg" className="text-center py-16">
            <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <QrCode size={40} className="text-primary" />
              </div>
              <h2 className="text-xl font-display font-bold text-text">
                Aucun contact pour le moment
              </h2>
              <p className="text-sm font-body text-text-muted">
                Partagez votre QR code pour commencer a collecter des contacts
                et des avis !
              </p>
              <Button variant="primary" size="md" onClick={() => window.location.href = '/dashboard/qrcode'}>
                <QrCode size={16} />
                Voir mon QR Code
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-text">
            Avis & Contacts
          </h1>
          <p className="text-sm font-body text-text-muted mt-1">
            {totalCount} participation{totalCount > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download size={16} />
          Export CSV
        </Button>
      </motion.div>

      {/* ---- Stats bar ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Emails uniques"
          value={stats.uniqueEmails}
          color="#FF6B35"
          delay={0}
        />
        <StatCard
          icon={Disc3}
          label="Total spins"
          value={stats.totalSpins}
          color="#1B2A4A"
          delay={0.08}
        />
        <StatCard
          icon={TrendingUp}
          label="Taux de gain"
          value={`${stats.conversionRate}%`}
          color="#10B981"
          delay={0.16}
        />
      </div>

      {/* ---- Filters ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="flex-1 w-full sm:max-w-xs">
              <Input
                placeholder="Rechercher par email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={16} />}
                className="!py-2 !text-xs"
              />
            </div>

            {/* Prize filter */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-text-muted" />
                <select
                  value={prizeFilter}
                  onChange={(e) => setPrizeFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-body rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none pr-8 cursor-pointer"
                >
                  <option value="all">Tous les lots</option>
                  {uniquePrizes.map((prize) => (
                    <option key={prize} value={prize}>
                      {prize}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-1.5">
              {[
                { label: '7 jours', value: '7d' as DateFilter },
                { label: '30 jours', value: '30d' as DateFilter },
                { label: 'Tout', value: 'all' as DateFilter },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateFilter(option.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium font-display rounded-lg transition-all duration-200',
                    dateFilter === option.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-background text-text-muted hover:bg-border/50 hover:text-text'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Result count */}
            <span className="text-xs font-body text-text-muted ml-auto">
              {filteredSpins.length} resultat{filteredSpins.length > 1 ? 's' : ''}
            </span>
          </div>
        </Card>
      </motion.div>

      {/* ---- Table ---- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card padding="sm" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Telephone
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Lot gagne
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Etoiles
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-display font-semibold text-text-muted uppercase tracking-wider">
                    Reclame
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {paginatedSpins.map((spin, index) => {
                    return (
                      <motion.tr
                        key={spin.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={cn(
                          'border-b border-border/30 transition-colors duration-150',
                          'hover:bg-primary/[0.03]',
                          index % 2 === 0 ? 'bg-transparent' : 'bg-background/50'
                        )}
                      >
                        <td className="px-4 py-3 text-xs font-body text-text-muted whitespace-nowrap">
                          {formatDate(spin.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm font-body font-medium text-text">
                          {spin.email}
                        </td>
                        <td className="px-4 py-3 text-xs font-body text-text-muted">
                          {spin.phone || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={spin.is_winner ? 'success' : 'muted'}
                            size="sm"
                          >
                            {spin.prize_emoji && (
                              <span>{spin.prize_emoji}</span>
                            )}
                            {spin.prize_label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs font-display font-bold text-blue-700 tracking-wider whitespace-nowrap">
                          {spin.validation_code || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <StarRating stars={spin.self_reported_stars} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {spin.is_winner ? (
                            <button
                              type="button"
                              onClick={() => handleToggleClaimed(spin.id)}
                              className={cn(
                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer',
                                claimedMap[spin.id] ? 'bg-sky' : 'bg-border'
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
                                  claimedMap[spin.id] ? 'translate-x-6' : 'translate-x-1'
                                )}
                              />
                            </button>
                          ) : (
                            <span className="text-text-muted text-xs">-</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* No results after filtering */}
          {filteredSpins.length === 0 && (
            <div className="py-12 text-center">
              <Search size={32} className="text-text-muted/30 mx-auto mb-3" />
              <p className="text-sm font-body text-text-muted">
                Aucun resultat pour ces filtres
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredSpins.length > ROWS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
                Precedent
              </Button>
              <span className="text-xs font-body text-text-muted">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Suivant
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ---- Toast notifications ---- */}
      <div className="fixed top-4 right-4 z-[60] space-y-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastNotification
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
