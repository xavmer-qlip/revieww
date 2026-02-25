'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Save,
  RotateCcw,
  Sparkles,
  Palette,
  Check,
  X,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WheelCanvas } from '@/components/wheel/wheel-canvas';
import { EmojiExplosion } from '@/components/wheel/emoji-explosion';
import { WHEEL_TEMPLATES, DEFAULT_SEGMENTS } from '@/lib/constants';
import { cn, pickWeightedSegment } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { WheelSegment } from '@/lib/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMOJI_GRID = [
  '\u2615', '\uD83C\uDF82', '\uD83C\uDF7A', '\uD83D\uDCB0', '\uD83C\uDF81',
  '\uD83C\uDF7D\uFE0F', '\u274C', '\uD83D\uDE22', '\uD83C\uDF89', '\uD83C\uDFC6',
  '\u2B50', '\uD83D\uDC8E', '\uD83C\uDF1F', '\uD83D\uDD25', '\uD83C\uDF08',
  '\uD83E\uDD73', '\uD83E\uDD47', '\uD83C\uDFAF', '\uD83D\uDCA5', '\uD83C\uDF40',
  '\uD83C\uDF70', '\uD83C\uDF69', '\uD83C\uDF54', '\uD83C\uDF55', '\uD83C\uDF7F',
  '\uD83E\uDD64', '\uD83C\uDF77', '\uD83C\uDF78', '\uD83C\uDF53', '\uD83C\uDF6B',
];

const COLOR_SWATCHES = [
  '#FF6B35', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B',
  '#FFC107', '#FF9800', '#795548', '#607D8B',
  '#6F4E37', '#2E7D32', '#78909C', '#FFD700',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LocalSegment {
  id: string;
  label: string;
  emoji: string;
  probability: number;
  color: string;
  position: number;
  is_winning: boolean;
  promo_code: string | null;
  monthly_stock: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// ---------------------------------------------------------------------------
// Generate a temp ID
// ---------------------------------------------------------------------------

function tempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Emoji picker popup */
function EmojiPicker({
  currentEmoji,
  onSelect,
  onClose,
}: {
  currentEmoji: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute z-30 top-full mt-1 left-0 bg-surface rounded-xl border border-border shadow-xl p-2 w-[220px]"
    >
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium text-text-muted font-display">Choisir un emoji</span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text transition-colors p-0.5 rounded"
        >
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {EMOJI_GRID.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all duration-150',
              'hover:bg-primary/10 hover:scale-110',
              emoji === currentEmoji && 'bg-primary/15 ring-2 ring-primary/30',
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/** Color picker popup */
function ColorPicker({
  currentColor,
  onSelect,
  onClose,
}: {
  currentColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}) {
  const [customColor, setCustomColor] = useState(currentColor);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -4 }}
      transition={{ duration: 0.15 }}
      className="absolute z-30 top-full mt-1 right-0 bg-surface rounded-xl border border-border shadow-xl p-3 w-[232px]"
    >
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span className="text-xs font-medium text-text-muted font-display">Couleur</span>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text transition-colors p-0.5 rounded"
        >
          <X size={14} />
        </button>
      </div>
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {COLOR_SWATCHES.map((color) => (
          <button
            key={color}
            onClick={() => {
              onSelect(color);
              onClose();
            }}
            className={cn(
              'w-9 h-9 rounded-xl transition-all duration-150 hover:scale-110 border-2',
              color === currentColor
                ? 'border-text ring-2 ring-primary/30 scale-105'
                : 'border-transparent',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      {/* Custom hex input */}
      <div className="flex gap-2 items-center">
        <div
          className="w-8 h-8 rounded-lg border border-border shrink-0"
          style={{ backgroundColor: customColor }}
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
              onSelect(customColor);
              onClose();
            }
          }}
          placeholder="#FF6B35"
          className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => {
            if (/^#[0-9A-Fa-f]{6}$/.test(customColor)) {
              onSelect(customColor);
              onClose();
            }
          }}
          className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          <Check size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/** Probability slider */
function ProbabilitySlider({
  value,
  color,
  onChange,
}: {
  value: number;
  color: string;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="relative flex-1 h-2 bg-border/40 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.2 }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <span className="text-xs font-semibold font-display w-10 text-right tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

/** Winning toggle */
function WinToggle({
  isWinning,
  onToggle,
}: {
  isWinning: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
        isWinning ? 'bg-success' : 'bg-border',
      )}
    >
      <motion.span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: isWinning ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/** Individual segment card */
function SegmentCard({
  segment,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  segment: LocalSegment;
  index: number;
  total: number;
  onUpdate: (id: string, data: Partial<LocalSegment>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close pickers on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
        setColorPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Card padding="sm" className="relative group">
        {/* Left color accent */}
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors"
          style={{ backgroundColor: segment.color }}
        />

        <div className="flex gap-3 pl-3">
          {/* Move buttons + grip */}
          <div className="flex flex-col items-center gap-0.5 pt-1">
            <button
              onClick={() => onMoveUp(segment.id)}
              disabled={index === 0}
              className="text-text-muted/40 hover:text-text-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5"
            >
              <ChevronUp size={14} />
            </button>
            <GripVertical size={14} className="text-text-muted/30" />
            <button
              onClick={() => onMoveDown(segment.id)}
              disabled={index === total - 1}
              className="text-text-muted/40 hover:text-text-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors p-0.5"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Top row: emoji + label + delete */}
            <div className="flex items-center gap-2.5">
              {/* Emoji button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setEmojiPickerOpen(!emojiPickerOpen);
                    setColorPickerOpen(false);
                  }}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                    'transition-all duration-200 hover:scale-110',
                    'border-2 border-border/40 hover:border-primary/40',
                  )}
                  style={{ backgroundColor: segment.color + '20' }}
                >
                  {segment.emoji}
                </button>
                <AnimatePresence>
                  {emojiPickerOpen && (
                    <EmojiPicker
                      currentEmoji={segment.emoji}
                      onSelect={(emoji) => onUpdate(segment.id, { emoji })}
                      onClose={() => setEmojiPickerOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Label input */}
              <input
                type="text"
                value={segment.label}
                onChange={(e) => onUpdate(segment.id, { label: e.target.value })}
                placeholder="Nom du lot"
                className="flex-1 min-w-0 px-3 py-2 text-sm font-medium font-body rounded-xl bg-background border border-border/50 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />

              {/* Color picker button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setColorPickerOpen(!colorPickerOpen);
                    setEmojiPickerOpen(false);
                  }}
                  className="p-2 rounded-lg hover:bg-border/30 transition-colors"
                  title="Couleur"
                >
                  <Palette size={16} className="text-text-muted" />
                </button>
                <AnimatePresence>
                  {colorPickerOpen && (
                    <ColorPicker
                      currentColor={segment.color}
                      onSelect={(color) => onUpdate(segment.id, { color })}
                      onClose={() => setColorPickerOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete(segment.id)}
                className="p-2 rounded-lg text-text-muted/40 hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Probability slider */}
            <ProbabilitySlider
              value={segment.probability}
              color={segment.color}
              onChange={(probability) => onUpdate(segment.id, { probability })}
            />

            {/* Bottom row: winning toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WinToggle
                  isWinning={segment.is_winning}
                  onToggle={() => onUpdate(segment.id, { is_winning: !segment.is_winning })}
                />
                <span className={cn(
                  'text-xs font-medium font-display transition-colors',
                  segment.is_winning ? 'text-success' : 'text-text-muted',
                )}>
                  {segment.is_winning ? 'Lot gagnant' : 'Perdant'}
                </span>
              </div>
              {/* Small color dot */}
              <div
                className="w-3 h-3 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: segment.color }}
              />
            </div>

            {/* Monthly stock (winning segments only) */}
            {segment.is_winning && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium font-display text-text-muted whitespace-nowrap">
                  Stock mensuel :
                </span>
                <input
                  type="number"
                  min={0}
                  value={segment.monthly_stock}
                  onChange={(e) => onUpdate(segment.id, { monthly_stock: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-20 px-2 py-1 text-sm font-body rounded-lg bg-background border border-border/50 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center"
                />
                <span className="text-xs text-text-muted font-body">/mois</span>
                <span className="text-[10px] text-text-muted/60 font-body">(0 = illimité)</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/** Probability total bar */
function ProbabilityBar({ total }: { total: number }) {
  const isValid = total === 100;
  const isOver = total > 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium font-display text-text-muted">Total des probabilites</span>
        <span
          className={cn(
            'text-sm font-bold font-display tabular-nums transition-colors',
            isValid ? 'text-success' : isOver ? 'text-danger' : 'text-warning',
          )}
        >
          {total}%
        </span>
      </div>
      <div className="h-2.5 w-full bg-border/30 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full transition-colors duration-300',
            isValid ? 'bg-success' : isOver ? 'bg-danger' : 'bg-warning',
          )}
          animate={{ width: `${Math.min(total, 100)}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {!isValid && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5"
        >
          <AlertCircle size={12} className={isOver ? 'text-danger' : 'text-warning'} />
          <span className={cn(
            'text-xs font-body',
            isOver ? 'text-danger' : 'text-warning',
          )}>
            {isOver
              ? `Le total depasse 100% (${total - 100}% en trop)`
              : `Il manque ${100 - total}% pour atteindre 100%`}
          </span>
        </motion.div>
      )}
    </div>
  );
}

/** Toast notification */
function ToastNotification({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
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
          : 'bg-danger/10 border-danger/20 text-danger',
      )}
    >
      {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
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
// Main page component
// ---------------------------------------------------------------------------

export default function WheelEditorPage() {
  const supabase = useMemo(() => createClient(), []);

  // State
  const [segments, setSegments] = useState<LocalSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Wheel preview
  const [previewSpinning, setPreviewSpinning] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<string | undefined>();
  const [explosionData, setExplosionData] = useState<{
    emoji: string;
    isWinner: boolean;
  } | null>(null);

  // ---- Toast helpers ----
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Load data on mount ----
  useEffect(() => {
    async function load() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get business
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!business) return;
        setBusinessId(business.id);

        // Get existing segments
        const { data: existingSegments } = await supabase
          .from('wheel_segments')
          .select('*')
          .eq('business_id', business.id)
          .order('position', { ascending: true });

        if (existingSegments && existingSegments.length > 0) {
          setSegments(
            existingSegments.map((s) => ({
              id: s.id,
              label: s.label,
              emoji: s.emoji,
              probability: s.probability,
              color: s.color,
              position: s.position,
              is_winning: s.is_winning,
              promo_code: s.promo_code,
              monthly_stock: s.monthly_stock ?? 0,
            })),
          );
        } else {
          // Use defaults
          setSegments(
            DEFAULT_SEGMENTS.map((s, i) => ({
              id: tempId(),
              label: s.label,
              emoji: s.emoji,
              probability: s.probability,
              color: s.color,
              position: i,
              is_winning: s.isWinning,
              promo_code: null,
              monthly_stock: 0,
            })),
          );
        }
      } catch (err) {
        console.error('Failed to load segments:', err);
        addToast('error', 'Erreur lors du chargement des segments');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase, addToast]);

  // ---- Segment CRUD ----
  const updateSegment = useCallback((id: string, data: Partial<LocalSegment>) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...data } : seg)),
    );
  }, []);

  const deleteSegment = useCallback((id: string) => {
    setSegments((prev) => {
      const next = prev.filter((seg) => seg.id !== id);
      // Re-index positions
      return next.map((seg, i) => ({ ...seg, position: i }));
    });
  }, []);

  const moveSegmentUp = useCallback((id: string) => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, position: i }));
    });
  }, []);

  const moveSegmentDown = useCallback((id: string) => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((s, i) => ({ ...s, position: i }));
    });
  }, []);

  const addSegment = useCallback(() => {
    setSegments((prev) => [
      ...prev,
      {
        id: tempId(),
        label: 'Nouveau lot',
        emoji: '\uD83C\uDF81',
        probability: 10,
        color: COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)],
        position: prev.length,
        is_winning: true,
        promo_code: null,
        monthly_stock: 0,
      },
    ]);
  }, []);

  const addFromTemplate = useCallback((template: typeof WHEEL_TEMPLATES[number]) => {
    setSegments((prev) => [
      ...prev,
      {
        id: tempId(),
        label: template.label,
        emoji: template.emoji,
        probability: 10,
        color: template.color,
        position: prev.length,
        is_winning: template.isWinning,
        promo_code: null,
        monthly_stock: 0,
      },
    ]);
  }, []);

  const resetToDefaults = useCallback(() => {
    setSegments(
      DEFAULT_SEGMENTS.map((s, i) => ({
        id: tempId(),
        label: s.label,
        emoji: s.emoji,
        probability: s.probability,
        color: s.color,
        position: i,
        is_winning: s.isWinning,
        promo_code: null,
        monthly_stock: 0,
      })),
    );
  }, []);

  // ---- Total probability ----
  const totalProbability = useMemo(
    () => segments.reduce((sum, s) => sum + s.probability, 0),
    [segments],
  );

  // ---- Save to Supabase ----
  const handleSave = useCallback(async () => {
    if (!businessId) {
      addToast('error', 'Commerce introuvable. Rechargez la page.');
      return;
    }
    if (totalProbability !== 100) {
      addToast('error', 'Le total des probabilites doit etre egal a 100%');
      return;
    }
    if (segments.length < 2) {
      addToast('error', 'Il faut au moins 2 segments');
      return;
    }

    setSaving(true);
    try {
      // Delete all existing segments for this business
      const { error: deleteError } = await supabase
        .from('wheel_segments')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) throw deleteError;

      // Insert new segments
      const rows = segments.map((seg, i) => ({
        business_id: businessId,
        label: seg.label,
        emoji: seg.emoji,
        probability: seg.probability,
        color: seg.color,
        position: i,
        is_winning: seg.is_winning,
        promo_code: seg.promo_code,
        monthly_stock: seg.is_winning ? seg.monthly_stock : 0,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('wheel_segments')
        .insert(rows)
        .select();

      if (insertError) throw insertError;

      // Update local IDs with real DB IDs
      if (inserted) {
        setSegments(
          inserted.map((s) => ({
            id: s.id,
            label: s.label,
            emoji: s.emoji,
            probability: s.probability,
            color: s.color,
            position: s.position,
            is_winning: s.is_winning,
            promo_code: s.promo_code,
            monthly_stock: s.monthly_stock ?? 0,
          })),
        );
      }

      addToast('success', 'Roue sauvegardee avec succes !');
    } catch (err) {
      console.error('Save error:', err);
      addToast('error', 'Erreur lors de la sauvegarde. Reessayez.');
    } finally {
      setSaving(false);
    }
  }, [businessId, segments, totalProbability, supabase, addToast]);

  // ---- Preview spin ----
  const handlePreviewSpin = useCallback(() => {
    if (previewSpinning || segments.length < 2) return;

    const winnerId = pickWeightedSegment(
      segments.map((s) => ({ id: s.id, probability: s.probability })),
    );
    setPreviewTarget(winnerId);
    setPreviewSpinning(true);
  }, [previewSpinning, segments]);

  const handleSpinEnd = useCallback(
    (winner: WheelSegment) => {
      setPreviewSpinning(false);

      // Find local segment to get is_winning
      const local = segments.find((s) => s.id === winner.id);
      if (local) {
        setExplosionData({
          emoji: local.emoji,
          isWinner: local.is_winning,
        });
      }
    },
    [segments],
  );

  // ---- Convert local segments to WheelSegment for canvas ----
  const wheelSegments: WheelSegment[] = useMemo(
    () =>
      segments.map((s) => ({
        id: s.id,
        business_id: businessId || '',
        label: s.label,
        emoji: s.emoji,
        probability: s.probability,
        color: s.color,
        position: s.position,
        is_winning: s.is_winning,
        promo_code: s.promo_code,
        monthly_stock: s.monthly_stock,
        created_at: '',
      })),
    [segments, businessId],
  );

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
    <div className="space-y-6">
      {/* ---- Page header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Ma Roue</h1>
          <p className="text-sm font-body text-text-muted mt-1">
            Personnalisez les lots et les probabilites de votre roue
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
          >
            <RotateCcw size={16} />
            Reinitialiser
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={saving}
            onClick={handleSave}
            disabled={totalProbability !== 100 || segments.length < 2}
          >
            <Save size={16} />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* ---- Split-screen layout ---- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ================================================================
            LEFT PANEL: Configuration (60%)
            ================================================================ */}
        <div className="w-full lg:w-[60%] space-y-5">
          {/* Segments heading */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-text">
              Mes lots
              <span className="ml-2 text-sm font-normal text-text-muted">
                ({segments.length})
              </span>
            </h2>
            <Button variant="outline" size="sm" onClick={addSegment}>
              <Plus size={16} />
              Ajouter un segment
            </Button>
          </div>

          {/* Segment cards */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {segments.map((seg, i) => (
                <SegmentCard
                  key={seg.id}
                  segment={seg}
                  index={i}
                  total={segments.length}
                  onUpdate={updateSegment}
                  onDelete={deleteSegment}
                  onMoveUp={moveSegmentUp}
                  onMoveDown={moveSegmentDown}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {segments.length === 0 && (
            <Card padding="lg" className="text-center">
              <p className="text-text-muted font-body">
                Aucun segment. Ajoutez-en un ou utilisez un modele ci-dessous.
              </p>
            </Card>
          )}

          {/* ---- Templates section ---- */}
          <div className="space-y-3">
            <h3 className="text-sm font-display font-semibold text-text-muted uppercase tracking-wider">
              Modeles rapides
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {WHEEL_TEMPLATES.map((tpl, i) => (
                <motion.button
                  key={`${tpl.emoji}-${tpl.label}-${i}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => addFromTemplate(tpl)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/50',
                    'bg-surface hover:bg-background transition-all duration-200 text-left',
                    'hover:border-primary/30 hover:shadow-sm',
                  )}
                >
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-lg shrink-0"
                    style={{ backgroundColor: tpl.color + '18' }}
                  >
                    {tpl.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium font-display text-text truncate">
                      {tpl.label}
                    </p>
                    <p className="text-[10px] font-body text-text-muted">
                      {tpl.isWinning ? 'Gagnant' : 'Perdant'}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ---- Probability bar ---- */}
          <Card padding="sm">
            <ProbabilityBar total={totalProbability} />
          </Card>
        </div>

        {/* ================================================================
            RIGHT PANEL: Live preview (40%)
            ================================================================ */}
        <div className="w-full lg:w-[40%]">
          <div className="lg:sticky lg:top-8 space-y-5">
            <Card padding="md" className="flex flex-col items-center gap-5">
              <h3 className="text-sm font-display font-semibold text-text-muted uppercase tracking-wider self-start">
                Apercu en direct
              </h3>

              {/* Wheel */}
              <div className="flex justify-center w-full">
                <WheelCanvas
                  segments={wheelSegments}
                  size={340}
                  spinning={previewSpinning}
                  onSpinEnd={handleSpinEnd}
                  targetSegmentId={previewTarget}
                />
              </div>

              {/* Test spin button */}
              <Button
                variant="secondary"
                size="md"
                onClick={handlePreviewSpin}
                disabled={previewSpinning || segments.length < 2}
                className="w-full max-w-[200px]"
              >
                <Play size={16} />
                {previewSpinning ? 'En cours...' : 'Tester'}
              </Button>

              {/* Segment count summary */}
              <div className="flex items-center gap-4 text-xs font-body text-text-muted">
                <span>
                  {segments.filter((s) => s.is_winning).length} gagnant{segments.filter((s) => s.is_winning).length > 1 ? 's' : ''}
                </span>
                <span className="w-px h-3 bg-border" />
                <span>
                  {segments.filter((s) => !s.is_winning).length} perdant{segments.filter((s) => !s.is_winning).length > 1 ? 's' : ''}
                </span>
                <span className="w-px h-3 bg-border" />
                <span>{segments.length} total</span>
              </div>
            </Card>

            {/* Save reminder */}
            {totalProbability === 100 && segments.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <p className="text-xs font-body text-success flex items-center justify-center gap-1.5">
                  <Check size={14} />
                  Pret a sauvegarder
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Emoji explosion overlay ---- */}
      <AnimatePresence>
        {explosionData && (
          <EmojiExplosion
            emoji={explosionData.emoji}
            isWinner={explosionData.isWinner}
            onComplete={() => setExplosionData(null)}
          />
        )}
      </AnimatePresence>

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
