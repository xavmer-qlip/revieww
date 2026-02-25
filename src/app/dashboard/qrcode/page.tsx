'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  QrCode,
  Palette,
  FileImage,
  FileText,
  CreditCard,
  Sticker,
  Sparkles,
  AlertCircle,
  X,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PLAY_URL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import type { Business } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface PDFFormat {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PDF_FORMATS: PDFFormat[] = [
  {
    id: 'table-tent',
    icon: FileText,
    title: 'Table Tent',
    description: 'Chevalet de table double face',
    emoji: '\uD83C\uDFEA',
  },
  {
    id: 'poster-a4',
    icon: FileImage,
    title: 'Affiche A4',
    description: 'Format poster pour mur ou vitrine',
    emoji: '\uD83D\uDDBC\uFE0F',
  },
  {
    id: 'business-card',
    icon: CreditCard,
    title: 'Carte de visite',
    description: 'Petit format pratique',
    emoji: '\uD83D\uDCB3',
  },
  {
    id: 'sticker',
    icon: Sticker,
    title: 'Sticker',
    description: 'Autocollant rond ou carre',
    emoji: '\uD83C\uDFF7\uFE0F',
  },
];

// ---------------------------------------------------------------------------
// Toast notification component
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
// Main page component
// ---------------------------------------------------------------------------

export default function QRCodePage() {
  const supabase = useMemo(() => createClient(), []);

  // State
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrColor, setQrColor] = useState<string>('#1B2A4A');
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Derived
  const playUrl = business?.slug
    ? `${PLAY_URL}/${business.slug}`
    : '';

  // ---- Toast helpers ----
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ---- Load business data on mount ----
  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .single<Business>();

        if (data) {
          setBusiness(data);
          setQrColor(data.primary_color || '#1B2A4A');
        }
      } catch (err) {
        console.error('Failed to load business:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  // ---- Generate QR codes whenever URL or color changes ----
  useEffect(() => {
    if (!playUrl) return;

    async function generateQR() {
      try {
        // PNG data URL
        const dataUrl = await QRCode.toDataURL(playUrl, {
          width: 1024,
          margin: 2,
          color: {
            dark: qrColor,
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        setQrDataUrl(dataUrl);

        // SVG string
        const svgString = await QRCode.toString(playUrl, {
          type: 'svg',
          width: 1024,
          margin: 2,
          color: {
            dark: qrColor,
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'H',
        });
        setQrSvg(svgString);
      } catch (err) {
        console.error('QR generation error:', err);
      }
    }

    generateQR();
  }, [playUrl, qrColor]);

  // ---- Actions ----
  const handleDownloadPNG = useCallback(() => {
    if (!qrDataUrl || !business) return;
    const link = document.createElement('a');
    link.download = `qr-${business.slug}.png`;
    link.href = qrDataUrl;
    link.click();
    addToast('success', 'QR Code PNG telecharge !');
  }, [qrDataUrl, business, addToast]);

  const handleDownloadSVG = useCallback(() => {
    if (!qrSvg || !business) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-${business.slug}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    addToast('success', 'QR Code SVG telecharge !');
  }, [qrSvg, business, addToast]);

  const handleCopyLink = useCallback(async () => {
    if (!playUrl) return;
    try {
      await navigator.clipboard.writeText(playUrl);
      setCopied(true);
      addToast('success', 'Lien copie dans le presse-papier !');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('error', 'Impossible de copier le lien');
    }
  }, [playUrl, addToast]);

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

  // ---- Empty state ----
  if (!business?.slug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
            <QrCode size={40} className="text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-text">
            Aucun commerce configure
          </h2>
          <p className="text-sm font-body text-text-muted max-w-sm">
            Configurez d&apos;abord votre commerce dans les parametres pour
            generer votre QR Code.
          </p>
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
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-display font-bold text-text">
          Mon QR Code
        </h1>
        <p className="text-sm font-body text-text-muted mt-1">
          Partagez ce QR code pour que vos clients jouent à la roue et gagnent un cadeau
        </p>
      </motion.div>

      {/* ---- Main layout ---- */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ================================================================
            LEFT: QR Preview + Actions
            ================================================================ */}
        <div className="w-full lg:w-[55%] space-y-5">
          {/* QR Code preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card padding="lg" className="flex flex-col items-center gap-6">
              {/* QR image */}
              <div className="relative">
                <div className="p-4 bg-white rounded-2xl shadow-lg border border-border/30">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px]"
                    />
                  ) : (
                    <div className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] bg-border/20 rounded-xl flex items-center justify-center">
                      <QrCode size={48} className="text-text-muted/30" />
                    </div>
                  )}
                </div>

                {/* Decorative corner dots */}
                <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-primary/20" />
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/20" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-primary/20" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-primary/20" />
              </div>

              {/* Download buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleDownloadPNG}
                  className="flex-1"
                >
                  <Download size={16} />
                  PNG haute resolution
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleDownloadSVG}
                  className="flex-1"
                >
                  <Download size={16} />
                  SVG vectoriel
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Color customization */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card padding="md">
              <div className="flex items-center gap-3 mb-4">
                <Palette size={18} className="text-primary" />
                <h3 className="text-sm font-display font-semibold text-text">
                  Personnalisation
                </h3>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-text-muted font-display">
                  Couleur du QR Code
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-12 h-12 rounded-xl border-2 border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-0"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={qrColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                          setQrColor(val);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm font-mono rounded-xl bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      placeholder="#1B2A4A"
                    />
                  </div>
                  {/* Quick color buttons */}
                  <div className="flex gap-1.5">
                    {['#1B2A4A', '#FF6B35', '#000000', '#10B981'].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() => setQrColor(color)}
                          className={cn(
                            'w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110',
                            qrColor === color
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border/50'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Link section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card padding="md">
              <div className="flex items-center gap-3 mb-4">
                <Link2 size={18} className="text-primary" />
                <h3 className="text-sm font-display font-semibold text-text">
                  Lien de partage
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-background rounded-xl border border-border text-sm font-mono text-text truncate">
                  {playUrl}
                </div>
                <Button
                  variant={copied ? 'primary' : 'outline'}
                  size="md"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copie !' : 'Copier'}
                </Button>
              </div>

              <a
                href={playUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline font-display"
              >
                <ExternalLink size={12} />
                Ouvrir dans un nouvel onglet
              </a>
            </Card>
          </motion.div>
        </div>

        {/* ================================================================
            RIGHT: Phone mockup + PDF formats
            ================================================================ */}
        <div className="w-full lg:w-[45%] space-y-5">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card padding="md" className="flex flex-col items-center gap-4">
              <h3 className="text-sm font-display font-semibold text-text-muted uppercase tracking-wider self-start">
                Apercu client
              </h3>

              {/* iPhone frame */}
              <div className="relative mx-auto">
                <div className="relative w-[260px] h-[520px] bg-secondary rounded-[3rem] p-3 shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-secondary rounded-b-2xl z-10" />

                  {/* Screen */}
                  <div className="w-full h-full bg-white rounded-[2.4rem] overflow-hidden flex flex-col">
                    {/* Status bar */}
                    <div className="h-12 bg-white flex items-end justify-center pb-1">
                      <div className="w-[60px] h-[5px] bg-black/20 rounded-full" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
                      {/* Mini QR */}
                      {qrDataUrl && (
                        <img
                          src={qrDataUrl}
                          alt="QR preview"
                          className="w-24 h-24 rounded-lg"
                        />
                      )}

                      <div className="text-center space-y-2">
                        <p className="text-[11px] font-bold text-gray-900 font-display">
                          {business.name}
                        </p>
                        <p className="text-[9px] text-gray-500 font-body leading-relaxed">
                          Jouez et gagnez un cadeau !
                        </p>
                      </div>

                      {/* Fake button */}
                      <div
                        className="px-4 py-2 rounded-full text-white text-[10px] font-semibold font-display"
                        style={{ backgroundColor: qrColor }}
                      >
                        Tourner la roue !
                      </div>

                      <p className="text-[8px] text-gray-400 font-body text-center mt-2">
                        {playUrl}
                      </p>
                    </div>

                    {/* Home indicator */}
                    <div className="h-8 flex items-center justify-center">
                      <div className="w-[100px] h-[4px] bg-black/20 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Shadow glow */}
                <div
                  className="absolute -inset-4 rounded-[4rem] opacity-20 blur-2xl -z-10"
                  style={{ backgroundColor: qrColor }}
                />
              </div>

              <p className="text-xs font-body text-text-muted text-center max-w-[220px]">
                Ce que vos clients voient quand ils scannent le QR code
              </p>
            </Card>
          </motion.div>

          {/* PDF formats section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-primary" />
                  <h3 className="text-sm font-display font-semibold text-text">
                    Supports d&apos;impression
                  </h3>
                </div>
                <Badge variant="primary" size="sm">
                  Nouveau
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PDF_FORMATS.map((format, index) => {
                  const Icon = format.icon;
                  return (
                    <motion.div
                      key={format.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.08 }}
                    >
                      <div
                        className={cn(
                          'relative flex items-start gap-3 p-4 rounded-xl border border-border/50',
                          'bg-background/50 transition-all duration-200',
                          'hover:border-primary/20 hover:shadow-sm'
                        )}
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg">{format.emoji}</span>
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-display font-semibold text-text">
                            {format.title}
                          </p>
                          <p className="text-[11px] font-body text-text-muted mt-0.5">
                            {format.description}
                          </p>
                          <Badge
                            variant="muted"
                            size="sm"
                            className="mt-2"
                          >
                            Bientot disponible
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-[11px] font-body text-text-muted text-center mt-4">
                Les supports d&apos;impression seront disponibles tres
                prochainement
              </p>
            </Card>
          </motion.div>
        </div>
      </div>

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
