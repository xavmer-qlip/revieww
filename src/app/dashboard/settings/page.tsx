'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Link2,
  Palette,
  User,
  Save,
  HelpCircle,
  Upload,
  Eye,
  Check,
  AlertCircle,
  X,
  Sparkles,
  Globe,
  Lock,
  Image as ImageIcon,
  Gamepad2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn, slugify } from '@/lib/utils';
import { APP_URL, TEXTS } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import type { Business, FlowType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

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
          ? 'bg-success/10 border-success/20 text-success'
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
// Color preview
// ---------------------------------------------------------------------------

function ColorPreview({
  primaryColor,
  secondaryColor,
}: {
  primaryColor: string;
  secondaryColor: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-background rounded-xl border border-border/50">
      <Eye size={16} className="text-text-muted shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-display font-medium text-text-muted mb-2">
          Apercu
        </p>
        <div className="flex items-center gap-3">
          {/* Simulated button with primary */}
          <div
            className="px-4 py-2 rounded-full text-white text-xs font-semibold font-display shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            Bouton principal
          </div>
          {/* Simulated header with secondary */}
          <div
            className="px-4 py-2 rounded-full text-white text-xs font-semibold font-display shadow-sm"
            style={{ backgroundColor: secondaryColor }}
          >
            Secondaire
          </div>
          {/* Color dots */}
          <div className="flex items-center gap-1.5 ml-auto">
            <div
              className="w-6 h-6 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="w-6 h-6 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: secondaryColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Google Review link tooltip
// ---------------------------------------------------------------------------

function GoogleReviewHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-text-muted hover:text-primary transition-colors p-1"
        title="Comment trouver mon lien ?"
      >
        <HelpCircle size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 top-full mt-2 right-0 w-72 p-4 bg-surface rounded-xl border border-border shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-display font-semibold text-text">
                Comment trouver mon lien ?
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-text-muted hover:text-text transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <ol className="space-y-2 text-xs font-body text-text-muted">
              <li className="flex gap-2">
                <span className="font-semibold text-primary">1.</span>
                Cherchez votre commerce sur Google Maps
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">2.</span>
                Cliquez sur &quot;Donner un avis&quot;
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-primary">3.</span>
                Copiez l&apos;URL de la page
              </li>
            </ol>
            <p className="text-[10px] text-text-muted/60 mt-3 font-body">
              Le lien ressemble a :
              https://search.google.com/local/writereview?placeid=...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#FF6B35');
  const [secondaryColor, setSecondaryColor] = useState('#1B2A4A');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [flowType, setFlowType] = useState<FlowType>('lottery_first');
  const [requireReview, setRequireReview] = useState(true);
  const [prizeValidityDays, setPrizeValidityDays] = useState(7);

  // ---- Toast helpers ----
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Load data ----
  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setUserEmail(user.email || '');

        const { data } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .single<Business>();

        if (data) {
          setBusiness(data);
          setName(data.name);
          setSlug(data.slug);
          setAddress(data.address || '');
          setGoogleReviewLink(data.google_review_link || '');
          setPrimaryColor(data.primary_color);
          setSecondaryColor(data.secondary_color);
          setLogoUrl(data.logo_url);
          setFlowType(data.flow_type || 'lottery_first');
          setRequireReview(data.require_review ?? true);
          setPrizeValidityDays(data.prize_validity_days ?? 7);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  // ---- Auto-slug from name ----
  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      // Auto-generate slug if user hasn't manually edited it
      if (!business || slug === slugify(business.name)) {
        setSlug(slugify(value));
      }
    },
    [business, slug]
  );

  // ---- Logo file handler ----
  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate
      if (!file.type.startsWith('image/')) {
        addToast('error', 'Le fichier doit etre une image');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        addToast('error', 'L\'image ne doit pas depasser 2 Mo');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLogoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [addToast]
  );

  // ---- Save ----
  const handleSave = useCallback(async () => {
    if (!business) return;

    if (!name.trim()) {
      addToast('error', 'Le nom du commerce est requis');
      return;
    }
    if (!slug.trim()) {
      addToast('error', 'Le slug est requis');
      return;
    }

    setSaving(true);

    try {
      let newLogoUrl = logoUrl;

      // Upload logo if changed
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `logos/${business.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('business-assets')
          .upload(filePath, logoFile, { upsert: true });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          // Continue without logo update
        } else {
          const { data: urlData } = supabase.storage
            .from('business-assets')
            .getPublicUrl(filePath);
          newLogoUrl = urlData.publicUrl;
        }
      }

      // Update business
      const { error } = await supabase
        .from('businesses')
        .update({
          name: name.trim(),
          slug: slugify(slug),
          address: address.trim() || null,
          google_review_link: googleReviewLink.trim() || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          logo_url: newLogoUrl,
          flow_type: flowType,
          require_review: requireReview,
          prize_validity_days: prizeValidityDays,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id);

      if (error) throw error;

      // Update local state
      setSlug(slugify(slug));
      setLogoUrl(newLogoUrl);
      setLogoFile(null);

      addToast('success', 'Parametres sauvegardes avec succes !');
    } catch (err) {
      console.error('Save error:', err);
      addToast('error', 'Erreur lors de la sauvegarde. Reessayez.');
    } finally {
      setSaving(false);
    }
  }, [
    business,
    name,
    slug,
    address,
    googleReviewLink,
    primaryColor,
    secondaryColor,
    logoUrl,
    logoFile,
    flowType,
    requireReview,
    prizeValidityDays,
    supabase,
    addToast,
  ]);

  // ---- Password change ----
  const handlePasswordChange = useCallback(async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      addToast(
        'success',
        'Un email de reinitialisation a ete envoye a ' + userEmail
      );
    } catch (err) {
      console.error('Password reset error:', err);
      addToast('error', 'Erreur lors de l\'envoi de l\'email');
    }
  }, [supabase, userEmail, addToast]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={32} className="text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ---- Page header ---- */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-text">
            Parametres
          </h1>
          <p className="text-sm font-body text-text-muted mt-1">
            Gerez les informations de votre commerce et votre compte
          </p>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 1: Mon commerce
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-text">
                Mon commerce
              </h2>
              <p className="text-xs font-body text-text-muted">
                Informations generales de votre etablissement
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <Input
              id="business-name"
              label="Nom du commerce"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Mon Restaurant"
            />

            {/* Slug */}
            <div className="space-y-1.5">
              <Input
                id="business-slug"
                label="Slug (URL)"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="mon-restaurant"
                icon={<Globe size={16} />}
              />
              <p className="text-[11px] font-body text-text-muted flex items-center gap-1.5 pl-1">
                <Link2 size={11} />
                https://revieww.ch/play/{slug || '...'}
              </p>
            </div>

            {/* Address */}
            <Input
              id="business-address"
              label="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rue du Commerce 12, 1000 Lausanne"
            />
          </div>
        </Card>
      </motion.div>

      {/* ================================================================
          SECTION 2: Lien Google Review
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center">
              <Link2 size={20} className="text-sky" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-display font-semibold text-text">
                Lien Google Review
              </h2>
              <p className="text-xs font-body text-text-muted">
                Le lien vers lequel vos clients seront rediriges
              </p>
            </div>
            <GoogleReviewHelp />
          </div>

          <Input
            id="google-review-link"
            value={googleReviewLink}
            onChange={(e) => setGoogleReviewLink(e.target.value)}
            placeholder="https://search.google.com/local/writereview?placeid=..."
            icon={<Globe size={16} />}
          />
          <p className="text-[11px] font-body text-text-muted mt-2 pl-1">
            Collez le lien direct vers la page d&apos;avis Google de votre
            commerce
          </p>
        </Card>
      </motion.div>

      {/* ================================================================
          SECTION 3: Branding
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Palette size={20} className="text-warning" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-text">
                Branding
              </h2>
              <p className="text-xs font-body text-text-muted">
                Personnalisez l&apos;apparence de votre experience
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Logo upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text font-display">
                Logo
              </label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview || logoUrl ? (
                    <img
                      src={logoPreview || logoUrl || ''}
                      alt="Logo"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-text-muted/30" />
                  )}
                </div>

                {/* Upload button */}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-border/30 transition-all text-sm font-display font-medium text-text-muted hover:text-text cursor-pointer">
                      <Upload size={16} />
                      {logoPreview || logoUrl
                        ? 'Changer le logo'
                        : 'Telecharger un logo'}
                    </div>
                  </label>
                  <p className="text-[10px] font-body text-text-muted mt-1.5">
                    PNG, JPG ou SVG. Max 2 Mo.
                  </p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary color */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text font-display">
                  Couleur principale
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-2 border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setPrimaryColor(val);
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm font-mono rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="#FF6B35"
                  />
                </div>
              </div>

              {/* Secondary color */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text font-display">
                  Couleur secondaire
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border-2 border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setSecondaryColor(val);
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm font-mono rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder="#1B2A4A"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <ColorPreview
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />
          </div>
        </Card>
      </motion.div>

      {/* ================================================================
          SECTION 4: Mode de jeu
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Gamepad2 size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-text">
                Mode de jeu
              </h2>
              <p className="text-xs font-body text-text-muted">
                Comment vos clients interagissent avec la roue
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {([
              {
                key: 'lottery_first' as FlowType,
                label: TEXTS.onboarding.flowLotteryFirstLabel,
                desc: TEXTS.onboarding.flowLotteryFirstDesc,
                flow: '🎡 → 🔒 → ⭐ → 🎁',
                recommended: true,
              },
              {
                key: 'review_first' as FlowType,
                label: TEXTS.onboarding.flowReviewFirstLabel,
                desc: TEXTS.onboarding.flowReviewFirstDesc,
                flow: '⭐ → 📧 → 🎡 → 🎁',
                recommended: false,
              },
            ]).map((option) => {
              const selected = flowType === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setFlowType(option.key)}
                  className={cn(
                    'w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-200 cursor-pointer',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 bg-background hover:border-border'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      selected ? 'border-primary' : 'border-border'
                    )}>
                      {selected && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-display font-semibold text-text">
                          {option.label}
                        </span>
                        {option.recommended && (
                          <Badge variant="success" size="sm">
                            {TEXTS.onboarding.flowRecommended}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-body text-text-muted mt-0.5">
                        {option.desc}
                      </p>
                      <p className="text-xs font-body text-text-muted/60 mt-1 tracking-wider">
                        {option.flow}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Require review toggle — only visible in lottery_first mode */}
          <AnimatePresence>
            {flowType === 'lottery_first' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 px-4 py-3 rounded-xl bg-background border border-border/50">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <p className="text-sm font-display font-medium text-text">
                        Exiger un avis Google pour débloquer le lot
                      </p>
                      <p className="text-xs font-body text-text-muted mt-0.5">
                        Si désactivé, le client reçoit son lot directement après le spin
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={requireReview}
                      onClick={() => setRequireReview(!requireReview)}
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30',
                        requireReview ? 'bg-primary' : 'bg-border'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out',
                          requireReview ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* ================================================================
          SECTION 5: Validite des lots
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky/10 flex items-center justify-center">
              <Clock size={20} className="text-sky" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-text">
                Validité des lots
              </h2>
              <p className="text-xs font-body text-text-muted">
                Durée pendant laquelle un lot gagné peut être réclamé
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Input
                id="prize-validity"
                label="Nombre de jours"
                type="number"
                value={prizeValidityDays.toString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 90) {
                    setPrizeValidityDays(val);
                  }
                }}
                icon={<Clock size={16} />}
              />
            </div>
            <p className="text-[11px] font-body text-text-muted pl-1">
              Après ce délai, le lot sera marqué comme expiré. Entre 1 et 90 jours.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* ================================================================
          SECTION 6: Compte
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.27 }}
      >
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <User size={20} className="text-secondary" />
            </div>
            <div>
              <h2 className="text-base font-display font-semibold text-text">
                Compte
              </h2>
              <p className="text-xs font-body text-text-muted">
                Gerez votre compte et votre securite
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Email (readonly) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text font-display">
                Email
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 rounded-2xl bg-background border border-border text-sm font-body text-text-muted">
                  {userEmail}
                </div>
                <Lock size={16} className="text-text-muted/40 shrink-0" />
              </div>
            </div>

            {/* Password change */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text font-display">
                Mot de passe
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordChange}
              >
                <Lock size={14} />
                Changer mon mot de passe
              </Button>
              <p className="text-[11px] font-body text-text-muted">
                Un email de reinitialisation sera envoye a votre adresse
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ================================================================
          SAVE BUTTON
          ================================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex justify-end pt-2 pb-8"
      >
        <Button
          variant="primary"
          size="lg"
          loading={saving}
          onClick={handleSave}
        >
          <Save size={18} />
          Sauvegarder les parametres
        </Button>
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
