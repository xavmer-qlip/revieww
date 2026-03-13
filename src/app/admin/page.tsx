'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Search,
  Users,
  LogIn,
  CreditCard,
  Ban,
  Trash2,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Unlock,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BusinessRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  email: string | null;
  plan_type: string;
  subscription_status: string;
  monthly_spin_limit: number;
  trial_ends_at: string;
  created_at: string;
  logo_url: string | null;
  address: string | null;
  google_place_id: string | null;
  group_id: string | null;
  total_spins: number;
  onboarding_completed: boolean;
  email_verified: boolean;
  blocked: boolean;
}

type ModalAction = null | {
  type: 'plan' | 'block' | 'delete' | 'impersonate';
  business: BusinessRow;
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-amber-100 text-amber-800',
  growth: 'bg-blue-100 text-blue-800',
  pro: 'bg-emerald-100 text-emerald-800',
};

const STATUS_COLORS: Record<string, string> = {
  free: 'text-gray-500',
  active: 'text-emerald-600',
  trialing: 'text-blue-600',
  past_due: 'text-amber-600',
  canceled: 'text-red-500',
  expired: 'text-red-700',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<ModalAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  // Plan modal state
  const [selectedPlan, setSelectedPlan] = useState('growth');
  const [planExpiry, setPlanExpiry] = useState('');

  // Delete modal state
  const [deleteUser, setDeleteUser] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      setBusinesses(data.businesses ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch { /* */ }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    setPage(1);
  }, [search]);

  // ---- Actions ----
  async function handleImpersonate(business: BusinessRow) {
    setActionLoading(true);
    setActionResult(null);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: business.user_id }),
      });
      const data = await res.json();
      if (data.loginUrl) {
        window.open(data.loginUrl, '_blank');
        setActionResult(`Lien généré pour ${data.email}`);
      } else {
        setActionResult(`Erreur: ${data.error}`);
      }
    } catch { setActionResult('Erreur réseau'); }
    setActionLoading(false);
  }

  async function handlePlanChange() {
    if (!modal?.business) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: modal.business.id,
          planType: selectedPlan,
          expiresAt: planExpiry || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult(`Plan ${selectedPlan} appliqué`);
        fetchUsers();
        setTimeout(() => setModal(null), 1000);
      } else {
        setActionResult(`Erreur: ${data.error}`);
      }
    } catch { setActionResult('Erreur réseau'); }
    setActionLoading(false);
  }

  async function handleBlock() {
    if (!modal?.business) return;
    setActionLoading(true);
    try {
      const newBlocked = !modal.business.blocked;
      const res = await fetch('/api/admin/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: modal.business.id, blocked: newBlocked }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult(newBlocked ? 'Compte bloqué' : 'Compte débloqué');
        fetchUsers();
        setTimeout(() => setModal(null), 1000);
      }
    } catch { setActionResult('Erreur réseau'); }
    setActionLoading(false);
  }

  async function handleDelete() {
    if (!modal?.business) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: modal.business.id, deleteUser }),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult(`${data.deleted} supprimé`);
        fetchUsers();
        setTimeout(() => setModal(null), 1500);
      }
    } catch { setActionResult('Erreur réseau'); }
    setActionLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-display font-bold text-gray-900">Admin woopla</h1>
            <Badge variant="primary" size="sm" className="bg-red-100 text-red-700">Mega-Admin</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{total} comptes</span>
            <a href="/dashboard" className="text-blue-600 hover:underline flex items-center gap-1">
              Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Commerce</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Email</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Plan</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Statut</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Spins</th>
                      <th className="text-left px-4 py-3 font-display font-semibold text-gray-600">Créé le</th>
                      <th className="text-right px-4 py-3 font-display font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((biz) => (
                      <motion.tr
                        key={biz.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
                          biz.blocked && 'bg-red-50/30'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {biz.logo_url ? (
                              <img src={biz.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {biz.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 truncate max-w-[180px]">{biz.name}</p>
                              <p className="text-[11px] text-gray-400">/{biz.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{biz.email ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-semibold', PLAN_COLORS[biz.plan_type] || 'bg-gray-100')}>
                            {biz.plan_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs font-medium', STATUS_COLORS[biz.subscription_status] || 'text-gray-500')}>
                            {biz.subscription_status}
                          </span>
                          {biz.blocked && <span className="ml-1 text-[10px] text-red-500 font-bold">BLOQUÉ</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{biz.total_spins}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(biz.created_at).toLocaleDateString('fr-CH')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleImpersonate(biz)}
                              title="Se connecter en tant que"
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            >
                              <LogIn className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setModal({ type: 'plan', business: biz }); setSelectedPlan(biz.plan_type); setPlanExpiry(''); setActionResult(null); }}
                              title="Gérer le plan"
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setModal({ type: 'block', business: biz }); setActionResult(null); }}
                              title={biz.blocked ? 'Débloquer' : 'Bloquer'}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors',
                                biz.blocked ? 'hover:bg-green-50 text-green-600' : 'hover:bg-orange-50 text-orange-600'
                              )}
                            >
                              {biz.blocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => { setModal({ type: 'delete', business: biz }); setDeleteUser(false); setActionResult(null); }}
                              title="Supprimer"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {businesses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          Aucun résultat
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Result Toast */}
      {actionResult && !modal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm z-50"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          {actionResult}
          <button onClick={() => setActionResult(null)} className="ml-2 text-white/50 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* ================================================================
          Modals
          ================================================================ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !actionLoading && setModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
          >
            {/* Plan Modal */}
            {modal.type === 'plan' && (
              <>
                <h3 className="text-lg font-display font-bold text-gray-900 mb-1">Gérer le plan</h3>
                <p className="text-sm text-gray-500 mb-4">{modal.business.name}</p>

                <div className="space-y-3 mb-4">
                  <label className="text-sm font-medium text-gray-700">Plan</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['free', 'starter', 'growth', 'pro'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPlan(p)}
                        className={cn(
                          'py-2 rounded-xl text-sm font-semibold border-2 transition-all capitalize',
                          selectedPlan === p
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-gray-700">Date d'expiration (optionnel)</label>
                  <input
                    type="date"
                    value={planExpiry}
                    onChange={(e) => setPlanExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-gray-400">Laisser vide = pas d'expiration</p>
                </div>

                {actionResult && <p className="text-sm text-emerald-600 mb-3">{actionResult}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePlanChange}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Appliquer
                  </button>
                </div>
              </>
            )}

            {/* Block Modal */}
            {modal.type === 'block' && (
              <>
                <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
                  {modal.business.blocked ? 'Débloquer le compte' : 'Bloquer le compte'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{modal.business.name}</p>
                <p className="text-sm text-gray-600 mb-6">
                  {modal.business.blocked
                    ? 'Le compte sera réactivé et pourra à nouveau utiliser woopla.'
                    : 'Le compte sera désactivé. La roue ne fonctionnera plus et le dashboard affichera une erreur.'}
                </p>

                {actionResult && <p className="text-sm text-emerald-600 mb-3">{actionResult}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBlock}
                    disabled={actionLoading}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2',
                      modal.business.blocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                    )}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : modal.business.blocked ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    {modal.business.blocked ? 'Débloquer' : 'Bloquer'}
                  </button>
                </div>
              </>
            )}

            {/* Delete Modal */}
            {modal.type === 'delete' && (
              <>
                <h3 className="text-lg font-display font-bold text-red-600 mb-1">Supprimer le compte</h3>
                <p className="text-sm text-gray-500 mb-2">{modal.business.name}</p>
                <p className="text-sm text-red-600 mb-4 font-medium">
                  Cette action est irréversible. Toutes les données (spins, segments, contacts) seront supprimées.
                </p>

                <label className="flex items-center gap-2 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteUser}
                    onChange={(e) => setDeleteUser(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Supprimer aussi le compte utilisateur (auth)</span>
                </label>

                {actionResult && <p className="text-sm text-emerald-600 mb-3">{actionResult}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => setModal(null)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Supprimer définitivement
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
