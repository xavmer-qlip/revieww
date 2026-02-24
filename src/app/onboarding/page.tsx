'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, Download, Copy, Send, ArrowRight, Trash2, Plus, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TEXTS,
  PLAN_SPIN_LIMITS,
  PLAN_CONTACT_LIMITS,
  PLAY_URL,
  SECTOR_PRESETS,
  SECTOR_LABELS,
  mapGoogleCategoryToSector,
} from '@/lib/constants';
import type { SectorKey, SectorPreset } from '@/lib/constants';
import { slugify, cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { FlowType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SelectedPreset extends SectorPreset {
  enabled: boolean;
  stock: number;
}

interface CreatedBusiness {
  id: string;
  slug: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Step 0 — How it works
// ---------------------------------------------------------------------------

const HOW_IT_WORKS_CARDS = [
  {
    emoji: '📱',
    title: 'Placez le QR code',
    description: 'Sur vos tables, au comptoir, dans l\'addition',
  },
  {
    emoji: '⭐',
    title: 'Vos clients laissent un avis',
    description: 'Ils scannent et laissent un avis Google',
  },
  {
    emoji: '🎡',
    title: 'Ils tournent et gagnent',
    description: 'Un jeu fun avec des lots instantanés',
  },
];

const EMOJI_GRID = [
  '☕', '🎂', '🍺', '💰', '🎁', '🍽️',
  '❌', '😢', '🎉', '🏆', '⭐', '💎',
  '🌟', '🔥', '🌈', '🥳', '🥇', '🎯',
  '💥', '🍀', '🍰', '🍩', '🍔', '🍕',
  '🍿', '🥤', '🍷', '🍸', '🍓', '🍫',
];

function StepHowItWorks() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
          {TEXTS.onboarding.howItWorksTitle}
        </h2>
        <p className="mt-2 text-text-muted font-body">
          revieww en 3 étapes simples
        </p>
      </div>

      <div className="grid gap-4 max-w-lg mx-auto">
        {HOW_IT_WORKS_CARDS.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.12, type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card padding="md" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl">{card.emoji}</span>
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-text">
                  {card.title}
                </h3>
                <p className="text-xs font-body text-text-muted mt-0.5">
                  {card.description}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Configure prizes with sector presets
// ---------------------------------------------------------------------------

function StepConfigurePrizes({
  detectedSector,
  currentSector,
  onSectorChange,
  presets,
  onToggle,
  onStockChange,
  onLabelChange,
  onEmojiChange,
  onAddPreset,
  onDeletePreset,
  validation,
}: {
  detectedSector: SectorKey;
  currentSector: SectorKey;
  onSectorChange: (sector: SectorKey) => void;
  presets: SelectedPreset[];
  onToggle: (index: number) => void;
  onStockChange: (index: number, stock: number) => void;
  onLabelChange: (index: number, label: string) => void;
  onEmojiChange: (index: number, emoji: string) => void;
  onAddPreset: () => void;
  onDeletePreset: (index: number) => void;
  validation: { valid: boolean; message: string };
}) {
  const sectorKeys = Object.keys(SECTOR_LABELS) as SectorKey[];
  const [openEmojiIndex, setOpenEmojiIndex] = useState<number | null>(null);
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
          {TEXTS.onboarding.prizesTitle}
        </h2>
        <p className="mt-2 text-text-muted font-body">
          {TEXTS.onboarding.prizesSubtitle}
        </p>
      </div>

      {/* Sector badge + selector */}
      <div className="flex flex-col items-center gap-3">
        <Badge variant="primary" size="md">
          {SECTOR_LABELS[detectedSector]} détecté
        </Badge>
        <div className="flex flex-wrap justify-center gap-2">
          {sectorKeys.map((key) => (
            <button
              key={key}
              onClick={() => onSectorChange(key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-display font-medium transition-all',
                currentSector === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-background text-text-muted hover:bg-primary/10 border border-border/50'
              )}
            >
              {SECTOR_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Preset grid */}
      <div className="space-y-3 max-w-lg mx-auto">
        {presets.map((preset, index) => (
          <motion.div
            key={`${currentSector}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              padding="sm"
              className={cn(
                'transition-all duration-200',
                preset.enabled
                  ? 'border-primary/30 bg-primary/5'
                  : 'opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                {/* Toggle checkbox */}
                <button
                  onClick={() => onToggle(index)}
                  className={cn(
                    'w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all',
                    preset.enabled
                      ? 'border-primary bg-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {preset.enabled && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>

                {/* Emoji button */}
                <button
                  onClick={() => setOpenEmojiIndex(openEmojiIndex === index ? null : index)}
                  className="text-xl hover:scale-110 transition-transform shrink-0"
                  title="Changer l'emoji"
                >
                  {preset.emoji}
                </button>
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: preset.color }}
                />

                {/* Editable label */}
                <input
                  type="text"
                  value={preset.label}
                  onChange={(e) => onLabelChange(index, e.target.value)}
                  className="text-sm font-medium font-body text-text flex-1 min-w-0 px-2 py-1 rounded-lg bg-transparent border border-transparent focus:border-primary/30 focus:bg-background focus:outline-none transition-all"
                />

                {/* Delete button */}
                <button
                  onClick={() => onDeletePreset(index)}
                  className="p-1 rounded-lg text-text-muted/40 hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>

                {/* Stock input or "Illimité" */}
                {preset.isWinning && preset.enabled ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min={0}
                      value={preset.stock}
                      onChange={(e) => onStockChange(index, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 px-2 py-1 text-xs font-body rounded-lg bg-background border border-border/50 text-text text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-[10px] text-text-muted font-body">/mois</span>
                  </div>
                ) : !preset.isWinning ? (
                  <span className="text-[10px] text-text-muted font-body shrink-0">Illimité</span>
                ) : null}
              </div>

              {/* Inline emoji picker */}
              <AnimatePresence>
                {openEmojiIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-6 gap-1 pt-2 mt-2 border-t border-border/30">
                      {EMOJI_GRID.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onEmojiChange(index, emoji);
                            setOpenEmojiIndex(null);
                          }}
                          className={cn(
                            'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all',
                            'hover:bg-primary/10 hover:scale-110',
                            emoji === preset.emoji && 'bg-primary/15 ring-2 ring-primary/30',
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add preset button */}
      <div className="max-w-lg mx-auto">
        <button
          onClick={onAddPreset}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-border/50 text-sm font-medium font-body text-text-muted hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
        >
          <Plus size={14} />
          Ajouter un lot
        </button>
      </div>

      {/* Validation message */}
      {!validation.valid && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-warning font-body"
        >
          {validation.message}
        </motion.p>
      )}

    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Choose flow type
// ---------------------------------------------------------------------------

const FLOW_OPTIONS: {
  key: FlowType;
  labelKey: 'flowLotteryFirstLabel' | 'flowReviewFirstLabel';
  descKey: 'flowLotteryFirstDesc' | 'flowReviewFirstDesc';
  steps: { emoji: string; label: string }[];
  recommended: boolean;
}[] = [
  {
    key: 'lottery_first',
    labelKey: 'flowLotteryFirstLabel',
    descKey: 'flowLotteryFirstDesc',
    steps: [
      { emoji: '🎡', label: 'Tourner' },
      { emoji: '🔒', label: 'Lot verrouillé' },
      { emoji: '⭐', label: 'Avis + Email' },
      { emoji: '🎁', label: 'Débloqué !' },
    ],
    recommended: true,
  },
  {
    key: 'review_first',
    labelKey: 'flowReviewFirstLabel',
    descKey: 'flowReviewFirstDesc',
    steps: [
      { emoji: '⭐', label: 'Avis Google' },
      { emoji: '📧', label: 'Email' },
      { emoji: '🎡', label: 'Tourner' },
      { emoji: '🎁', label: 'Résultat' },
    ],
    recommended: false,
  },
];

function StepChooseFlow({
  flowType,
  onSelect,
}: {
  flowType: FlowType;
  onSelect: (ft: FlowType) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
          {TEXTS.onboarding.flowTitle}
        </h2>
        <p className="mt-2 text-text-muted font-body">
          {TEXTS.onboarding.flowSubtitle}
        </p>
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        {FLOW_OPTIONS.map((option) => {
          const selected = flowType === option.key;
          return (
            <motion.button
              key={option.key}
              onClick={() => onSelect(option.key)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: option.key === 'lottery_first' ? 0.1 : 0.2, type: 'spring', stiffness: 300, damping: 25 }}
              className={cn(
                'w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer',
                selected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border/50 bg-surface opacity-60 hover:opacity-80 hover:border-border'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Radio indicator */}
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                  selected ? 'border-primary' : 'border-border'
                )}>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="w-2.5 h-2.5 rounded-full bg-primary"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-display font-bold text-text">
                      {TEXTS.onboarding[option.labelKey]}
                    </h3>
                    {option.recommended && (
                      <Badge variant="success" size="sm">
                        {TEXTS.onboarding.flowRecommended}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-body text-text-muted mb-4">
                    {TEXTS.onboarding[option.descKey]}
                  </p>

                  {/* Animated flow steps */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {option.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <motion.div
                          initial={selected ? { opacity: 0, scale: 0.5, y: 10 } : { opacity: 1, scale: 1, y: 0 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={selected ? {
                            delay: 0.15 + i * 0.12,
                            type: 'spring',
                            stiffness: 400,
                            damping: 15,
                          } : { duration: 0 }}
                          key={`${option.key}-${selected}`}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <span className="text-lg">{s.emoji}</span>
                          <span className="text-[9px] font-body text-text-muted whitespace-nowrap">{s.label}</span>
                        </motion.div>
                        {i < option.steps.length - 1 && (
                          <ChevronRight size={12} className="text-text-muted/40 shrink-0 mt-[-12px]" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — QR code ready
// ---------------------------------------------------------------------------

function StepQRReady({
  business,
  qrDataUrl,
  playUrl,
}: {
  business: CreatedBusiness;
  qrDataUrl: string | null;
  playUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${business.slug}.png`;
    link.href = qrDataUrl;
    link.click();
  }, [qrDataUrl, business.slug]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [playUrl]);

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `Laissez un avis sur ${business.name} et gagnez un cadeau ! ${playUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [business.name, playUrl]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`Donnez votre avis sur ${business.name}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nLaissez un avis et gagnez un cadeau !\n${playUrl}\n\nMerci !`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [business.name, playUrl]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-accent" />
        </motion.div>

        <h2 className="text-2xl sm:text-3xl font-display font-bold text-text">
          {TEXTS.onboarding.summaryTitle}
        </h2>
        <p className="mt-2 text-text-muted font-body">
          {TEXTS.onboarding.summarySubtitle}
        </p>
      </div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-3"
      >
        {qrDataUrl ? (
          <div className="p-4 bg-white rounded-2xl shadow-lg border border-border/30">
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-[200px] h-[200px]"
            />
          </div>
        ) : (
          <div className="w-[200px] h-[200px] bg-border/20 rounded-xl animate-pulse" />
        )}

        <p className="text-xs font-mono text-text-muted">{playUrl}</p>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3 max-w-sm mx-auto"
      >
        <Button variant="primary" size="sm" onClick={handleDownload}>
          <Download size={14} />
          Télécharger
        </Button>
        <Button variant="outline" size="sm" onClick={handleWhatsApp}>
          <Send size={14} />
          WhatsApp
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy size={14} />
          {copied ? 'Copié !' : 'Copier le lien'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleEmail}>
          <Send size={14} />
          Email
        </Button>
      </motion.div>

      {/* Email verification reminder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-sm mx-auto rounded-xl border border-warning/20 bg-warning/5 px-4 py-3"
      >
        <p className="text-sm font-body text-text text-center">
          <span className="font-semibold">Dernière étape :</span> vérifiez votre email pour que vos clients puissent scanner et jouer.
        </p>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === currentStep ? 24 : 8,
            backgroundColor: i === currentStep ? '#FF6B35' : i < currentStep ? '#10B981' : '#D1D5DB',
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Business metadata from user
  const [businessName, setBusinessName] = useState('');
  const [googleCategory, setGoogleCategory] = useState<string | null>(null);

  // Sector & presets
  const [detectedSector, setDetectedSector] = useState<SectorKey>('autre');
  const [currentSector, setCurrentSector] = useState<SectorKey>('autre');
  const [presets, setPresets] = useState<SelectedPreset[]>([]);

  // Flow type (step 2)
  const [flowType, setFlowType] = useState<FlowType>('lottery_first');

  // Created business (after step 2 completes)
  const [createdBusiness, setCreatedBusiness] = useState<CreatedBusiness | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // --- Load user metadata on mount (with localStorage fallback for OAuth) ---
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const meta = user.user_metadata ?? {};
      let name = (meta.business_name as string) || '';
      let cat = (meta.google_category as string) || null;

      // OAuth fallback: read business data saved before OAuth redirect
      if (!name) {
        try {
          const stored = localStorage.getItem('oauth_business_data');
          if (stored) {
            const data = JSON.parse(stored);
            name = data.business_name || '';
            cat = data.google_category || null;
            localStorage.removeItem('oauth_business_data');

            // Persist to user metadata so it's available in business creation
            await supabase.auth.updateUser({
              data: {
                business_name: data.business_name,
                google_place_id: data.google_place_id,
                google_rating: data.google_rating,
                google_review_count: data.google_review_count,
                google_category: data.google_category,
                google_review_link: data.google_review_link,
                business_address: data.business_address,
              },
            });
          }
        } catch {
          // localStorage not available — ignore
        }
      }

      setBusinessName(name);
      setGoogleCategory(cat);

      const sector = mapGoogleCategoryToSector(cat);
      setDetectedSector(sector);
      setCurrentSector(sector);
      initPresets(sector);
    }
    loadUser();
  }, []);

  // --- Initialize presets from a sector ---
  const initPresets = useCallback((sector: SectorKey) => {
    const sectorPresets = SECTOR_PRESETS[sector];
    setPresets(
      sectorPresets.map((p) => ({
        ...p,
        enabled: true,
        stock: p.suggestedStock,
      }))
    );
  }, []);

  // --- Change sector ---
  const handleSectorChange = useCallback((sector: SectorKey) => {
    setCurrentSector(sector);
    initPresets(sector);
  }, [initPresets]);

  // --- Toggle preset ---
  const togglePreset = useCallback((index: number) => {
    setPresets((prev) =>
      prev.map((p, i) => (i === index ? { ...p, enabled: !p.enabled } : p))
    );
  }, []);

  // --- Update stock ---
  const updateStock = useCallback((index: number, stock: number) => {
    setPresets((prev) =>
      prev.map((p, i) => (i === index ? { ...p, stock } : p))
    );
  }, []);

  // --- Update label ---
  const updateLabel = useCallback((index: number, label: string) => {
    setPresets((prev) =>
      prev.map((p, i) => (i === index ? { ...p, label } : p))
    );
  }, []);

  // --- Update emoji ---
  const updateEmoji = useCallback((index: number, emoji: string) => {
    setPresets((prev) =>
      prev.map((p, i) => (i === index ? { ...p, emoji } : p))
    );
  }, []);

  // --- Add custom preset ---
  const addPreset = useCallback(() => {
    setPresets((prev) => [
      ...prev,
      { emoji: '🎁', label: 'Mon lot', color: '#9C27B0', isWinning: true, enabled: true, stock: 5, suggestedStock: 5 },
    ]);
  }, []);

  // --- Delete preset ---
  const deletePreset = useCallback((index: number) => {
    setPresets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Validation ---
  const enabledPresets = useMemo(() => presets.filter((p) => p.enabled), [presets]);
  const validation = useMemo(() => {
    const total = enabledPresets.length;
    const winners = enabledPresets.filter((p) => p.isWinning).length;
    const losers = enabledPresets.filter((p) => !p.isWinning).length;

    if (total < 3) return { valid: false, message: 'Sélectionnez au moins 3 lots' };
    if (winners < 1) return { valid: false, message: 'Il faut au moins 1 lot gagnant' };
    if (losers < 1) return { valid: false, message: 'Il faut au moins 1 lot perdant' };
    return { valid: true, message: '' };
  }, [enabledPresets]);

  // --- Play URL ---
  const playUrl = createdBusiness ? `${PLAY_URL}/${createdBusiness.slug}` : '';

  // --- Generate QR code when business is created ---
  useEffect(() => {
    if (!createdBusiness) return;
    const url = `${PLAY_URL}/${createdBusiness.slug}`;
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: '#1B2A4A', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [createdBusiness]);

  // --- Step navigation ---
  const handleNext = useCallback(async () => {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!validation.valid) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      // Create business + segments (flow_type is now known)
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('Session expirée. Veuillez vous reconnecter.');
          setLoading(false);
          return;
        }

        const meta = user.user_metadata ?? {};
        const name = (meta.business_name as string) || '';

        if (!name.trim()) {
          setError('Données du commerce introuvables. Veuillez vous réinscrire.');
          setLoading(false);
          return;
        }

        // Create business
        const spinLimit = PLAN_SPIN_LIMITS.free;
        const contactLimit = PLAN_CONTACT_LIMITS.free;

        const { data: business, error: bizError } = await supabase
          .from('businesses')
          .insert({
            user_id: user.id,
            name: name.trim(),
            slug: slugify(name.trim()) + '-' + Date.now().toString(36),
            google_review_link: (meta.google_review_link as string) || null,
            google_place_id: (meta.google_place_id as string) || null,
            google_rating: (meta.google_rating as number) ?? null,
            google_review_count: (meta.google_review_count as number) ?? 0,
            google_business_category: (meta.google_category as string) || null,
            address: (meta.business_address as string) || null,
            plan_type: 'free',
            monthly_spin_limit: spinLimit,
            contact_limit: contactLimit,
            subscription_status: 'free',
            trial_ends_at: new Date().toISOString(),
            primary_color: '#FF6B35',
            secondary_color: '#1B2A4A',
            onboarding_completed: true,
            flow_type: flowType,
          })
          .select()
          .single();

        if (bizError || !business) {
          console.error('Business creation error:', bizError);
          setError('Erreur lors de la création du commerce. Réessayez.');
          setLoading(false);
          return;
        }

        // Calculate probabilities: 30% for losers, 70% for winners
        const winners = enabledPresets.filter((p) => p.isWinning);
        const losers = enabledPresets.filter((p) => !p.isWinning);
        const loserProb = losers.length > 0 ? Math.floor(30 / losers.length) : 0;
        const winnerProb = winners.length > 0 ? Math.floor(70 / winners.length) : 0;

        // Adjust for remainder
        const totalCalc = loserProb * losers.length + winnerProb * winners.length;
        const remainder = 100 - totalCalc;

        const segmentsToInsert = enabledPresets.map((preset, position) => {
          const isLoser = !preset.isWinning;
          const prob = isLoser ? loserProb : winnerProb;

          return {
            business_id: business.id,
            label: preset.label,
            emoji: preset.emoji,
            color: preset.color,
            is_winning: preset.isWinning,
            probability: prob + (position === 0 ? remainder : 0),
            position,
            monthly_stock: preset.isWinning ? preset.stock : 0,
          };
        });

        const { error: segError } = await supabase
          .from('wheel_segments')
          .insert(segmentsToInsert);

        if (segError) {
          console.error('Segments insertion error:', segError);
        }

        setCreatedBusiness({
          id: business.id,
          slug: business.slug,
          name: business.name,
        });
        setStep(3);

        // Fire-and-forget: send verification email
        fetch('/api/send-verification', { method: 'POST' }).catch(() => {});
      } catch (err) {
        console.error('Onboarding error:', err);
        setError('Une erreur est survenue. Réessayez.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 3) {
      window.location.href = '/dashboard';
    }
  }, [step, validation, enabledPresets, flowType, router]);

  // --- Button label ---
  const buttonLabel = step === 3 ? 'Aller au dashboard' : 'Suivant';
  const canProceed = step === 0 || (step === 1 && validation.valid) || step === 2 || step === 3;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center pt-8 pb-4">
        <Logo size="md" showTagline />
      </header>

      {/* Step indicator */}
      <div className="py-3">
        <StepIndicator currentStep={step} totalSteps={4} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12 pt-2">
        <Card
          padding="lg"
          className="w-full max-w-2xl relative overflow-hidden"
        >
          {/* Step content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <StepHowItWorks />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <StepConfigurePrizes
                    detectedSector={detectedSector}
                    currentSector={currentSector}
                    onSectorChange={handleSectorChange}
                    presets={presets}
                    onToggle={togglePreset}
                    onStockChange={updateStock}
                    onLabelChange={updateLabel}
                    onEmojiChange={updateEmoji}
                    onAddPreset={addPreset}
                    onDeletePreset={deletePreset}
                    validation={validation}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <StepChooseFlow
                    flowType={flowType}
                    onSelect={setFlowType}
                  />
                </motion.div>
              )}

              {step === 3 && createdBusiness && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <StepQRReady
                    business={createdBusiness}
                    qrDataUrl={qrDataUrl}
                    playUrl={playUrl}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-danger font-body mt-4"
            >
              {error}
            </motion.p>
          )}

          {/* Footer action */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={handleNext}
              disabled={!canProceed}
              loading={loading}
              className="w-full sm:w-auto min-w-[200px]"
            >
              {step === 3 ? (
                <>
                  {buttonLabel}
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  {buttonLabel}
                  <ChevronRight size={16} />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
