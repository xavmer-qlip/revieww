'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
  AnimatePresence,
} from 'motion/react';
import {
  QrCode,
  Star,
  Gift,
  Check,
  ArrowRight,
  Mail,
  Play,
  Menu,
  X,
  BarChart3,
  ChevronDown,
  Clock,
  Target,
  Globe,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { FREE_PLAN, PAID_PLANS, TEXTS, APP_DOMAIN } from '@/lib/constants';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════
   COLOR PALETTE — Summer Breeze
   ═══════════════════════════════════════════════════════════════════════════ */
const C = {
  bg: '#0b0f1a',
  surface: '#111827',
  surfaceLight: '#1a2236',
  border: '#1e293b',
  text: '#f8fafc',
  muted: '#94a3b8',
  coral: '#F88379',
  coralGlow: 'rgba(248,131,121,0.12)',
  yellow: '#FFEB3B',
  yellowGlow: 'rgba(255,235,59,0.10)',
  sky: '#82C8E5',
  skyGlow: 'rgba(130,200,229,0.10)',
  sand: '#E6D8C4',
  green: '#34d399',
};

/* ═══════════════════════════════════════════════════════════════════════════
   COUNTER HOOK
   ═══════════════════════════════════════════════════════════════════════════ */
function useCountUp(target: number, duration = 2) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  useEffect(() => {
    if (inView) animate(mv, target, { duration, ease: 'easeOut' });
  }, [inView, target, duration, mv]);
  useEffect(() => {
    const u = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v.toLocaleString('fr-CH');
    });
    return u;
  }, [rounded]);
  return ref;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LIVE COUNTER HOOK — increments randomly to simulate activity
   ═══════════════════════════════════════════════════════════════════════════ */
function useLiveCounter(base: number) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 4000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, []);
  return count;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PHONE MOCKUP
   ═══════════════════════════════════════════════════════════════════════════ */
function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div
        className="relative rounded-[2.8rem] p-[10px] shadow-2xl"
        style={{ background: 'linear-gradient(145deg, #2a2a2e 0%, #0a0a0a 100%)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 rounded-b-2xl z-10" style={{ background: '#0a0a0a' }} />
        <div className="rounded-[2.2rem] overflow-hidden w-[240px] h-[500px] relative bg-white">
          {children}
        </div>
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PHONE SCREENS — Google Review Flow
   ═══════════════════════════════════════════════════════════════════════════ */
function ScreenScanQR() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-5 text-center" style={{ background: 'linear-gradient(180deg, #fff5f4 0%, #ffffff 100%)' }}>
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${C.coral}, #e66a5f)`, boxShadow: '0 8px 20px rgba(248,131,121,0.3)' }}
      >
        <span className="text-white text-xl">🍕</span>
      </div>
      <h3 className="font-display font-bold text-[15px] text-gray-900 mb-1.5">Pizzeria Da Marco</h3>
      <p className="font-body text-[11px] text-gray-400 mb-5 leading-relaxed">
        Donnez votre avis<br />et tentez de gagner un cadeau !
      </p>
      <div
        className="w-full font-display font-bold text-[13px] py-3 rounded-2xl shadow-md text-white text-center mb-3"
        style={{ background: `linear-gradient(90deg, ${C.coral}, #e66a5f)` }}
      >
        Laisser un avis Google
      </div>
      <p className="font-body text-[10px] text-gray-300">Prend moins de 30 secondes</p>
    </div>
  );
}

function ScreenGoogleReview() {
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Google header */}
      <div className="px-4 pt-6 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">G</span>
          </div>
          <div>
            <p className="font-body text-[11px] font-semibold text-gray-800">Google Avis</p>
            <p className="font-body text-[9px] text-gray-400">Pizzeria Da Marco</p>
          </div>
        </div>
      </div>
      {/* Stars */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="font-body text-[13px] text-gray-700 mb-5 text-center">Quelle note donnez-vous ?</p>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotateZ: -20 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 400 }}
            >
              <Star
                className="w-8 h-8"
                style={{ fill: i <= 5 ? '#FBBC04' : '#e5e7eb', color: i <= 5 ? '#FBBC04' : '#e5e7eb' }}
              />
            </motion.div>
          ))}
        </div>
        <div className="w-full rounded-xl border border-gray-200 p-3 mb-4">
          <motion.p
            className="font-body text-[11px] text-gray-400"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Super pizza, service top...|
          </motion.p>
        </div>
        <div className="w-full bg-blue-500 text-white font-display font-semibold text-[12px] py-2.5 rounded-xl text-center">
          Publier
        </div>
      </div>
    </div>
  );
}

function ScreenWheel() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-5" style={{ background: 'linear-gradient(180deg, #fffde7 0%, #ffffff 100%)' }}>
      <p className="font-display font-bold text-[13px] text-gray-900 mb-4">Merci pour votre avis !</p>
      <div className="relative w-40 h-40 mb-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full shadow-lg"
          style={{ background: `conic-gradient(from 0deg, ${C.coral} 0deg 72deg, #f9fafb 72deg 144deg, ${C.sky} 144deg 216deg, ${C.yellow} 216deg 288deg, ${C.sand} 288deg 360deg)` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
            <span className="font-display font-extrabold text-[10px]" style={{ color: C.coral }}>GO</span>
          </div>
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px]" style={{ borderTopColor: C.coral }} />
        </div>
      </div>
      <p className="font-display font-bold text-[14px] text-gray-900">Tournez la roue !</p>
      <p className="font-body text-[11px] text-gray-400 mt-1">Tentez de gagner un cadeau</p>
    </div>
  );
}

function ScreenResult() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-5 text-center" style={{ background: 'linear-gradient(180deg, #e8f5e9 0%, #ffffff 100%)' }}>
      <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl mb-4 block">☕</motion.span>
      <h3 className="font-display font-bold text-[16px] text-gray-900 mb-1">Bravo !</h3>
      <p className="font-body text-[13px] text-gray-500 mb-2">Vous avez gagné :</p>
      <p className="font-display font-bold text-[15px] text-gray-900 mb-5">Un café offert</p>
      <div className="w-full bg-gray-900 text-white font-display font-semibold text-[12px] py-2.5 rounded-xl text-center mb-3">
        Montrez cet écran en caisse
      </div>
      <p className="font-body text-[10px] text-gray-400">Valable 7 jours</p>
    </div>
  );
}

/* Cycling phone that rotates through screens */
function CyclingPhones() {
  const [step, setStep] = useState(0);
  const screens = [
    { component: <ScreenScanQR />, label: 'Scan QR' },
    { component: <ScreenGoogleReview />, label: 'Avis Google' },
    { component: <ScreenWheel />, label: 'Roue' },
    { component: <ScreenResult />, label: 'Cadeau' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % screens.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [screens.length]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {screens.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setStep(i)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-display font-semibold transition-all cursor-pointer"
            style={{
              background: step === i ? `${C.coral}20` : 'rgba(255,255,255,0.04)',
              color: step === i ? C.coral : C.muted,
              borderColor: step === i ? `${C.coral}30` : C.border,
              border: '1px solid',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Phone>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              {screens[step].component}
            </motion.div>
          </AnimatePresence>
        </Phone>
      </motion.div>

      {/* Flow arrow indicators */}
      <div className="flex items-center gap-2 mt-5">
        {screens.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: step === i ? C.coral : `${C.muted}40`, transform: step === i ? 'scale(1.3)' : 'scale(1)' }}
            />
            {i < screens.length - 1 && (
              <div className="w-4 h-px" style={{ background: `${C.muted}30` }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      setHidden(y > lastY.current && y > 400);
      lastY.current = y;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const links = [
    { label: 'Fonctionnement', id: 'how' },
    { label: 'Tarifs', id: 'pricing' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled ? 'backdrop-blur-2xl border-b' : 'bg-transparent'
        )}
        style={{
          backgroundColor: scrolled ? 'rgba(11,15,26,0.9)' : 'transparent',
          borderColor: scrolled ? C.border : 'transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" variant="light" animate />
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="px-5 py-2.5 text-base font-medium rounded-lg transition-all cursor-pointer font-body hover:bg-white/5"
                style={{ color: C.muted }}
                onMouseOver={(e) => (e.currentTarget.style.color = C.text)}
                onMouseOut={(e) => (e.currentTarget.style.color = C.muted)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold font-display transition-colors hover:text-white"
              style={{ color: C.muted }}
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="px-7 py-3 text-sm font-bold rounded-full font-display transition-all hover:scale-[1.02] active:scale-[0.98] text-white"
              style={{ backgroundColor: C.coral, boxShadow: '0 4px 15px rgba(248,131,121,0.3)' }}
            >
              Commencer gratuitement
            </Link>
          </div>
          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 cursor-pointer" style={{ color: C.muted }}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8"
            style={{ background: C.bg }}
          >
            <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-5 cursor-pointer" style={{ color: C.muted }}>
              <X className="w-6 h-6" />
            </button>
            {links.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className="font-display text-xl font-bold cursor-pointer" style={{ color: C.text }}>
                {l.label}
              </button>
            ))}
            <div className="flex flex-col gap-3 mt-6 w-48">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center py-3 rounded-full border font-display font-semibold" style={{ borderColor: C.border, color: C.muted }}>
                Se connecter
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="text-center py-3 rounded-full font-display font-bold text-white" style={{ backgroundColor: C.coral }}>
                Commencer gratuitement
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20" style={{ background: C.bg }}>
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-15%] right-[5%] w-[700px] h-[700px] rounded-full blur-[150px]"
          style={{ background: C.coralGlow }}
        />
        <motion.div
          animate={{ x: [0, -25, 15, 0], y: [0, 15, -25, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full blur-[130px]"
          style={{ background: C.skyGlow }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`, backgroundSize: '60px 60px' }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 w-full py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          {/* Left — copy */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-extrabold text-[clamp(2.4rem,5.5vw,4.2rem)] leading-[1.08] tracking-[-0.03em] mb-6"
              style={{ color: C.text }}
            >
              Transformez chaque client
              <br />en{' '}
              <span style={{ color: C.coral }}>ambassadeur.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-body text-[17px] leading-relaxed mb-8 max-w-md"
              style={{ color: C.muted }}
            >
              Un QR code sur la table. Votre client laisse un avis Google, tourne la roue, repart avec un cadeau. Vous, vous récupérez son email et un avis 5 étoiles.
            </motion.p>

            {/* Google 5-star badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border mb-8"
              style={{ borderColor: 'rgba(255,235,59,0.2)', background: 'rgba(255,235,59,0.06)' }}
            >
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0, rotateZ: -30 }}
                    animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                    transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    <Star className="w-4 h-4" style={{ fill: C.yellow, color: C.yellow }} />
                  </motion.span>
                ))}
              </div>
              <span className="font-display font-bold text-sm" style={{ color: C.yellow }}>5.0</span>
              <span className="font-body text-xs" style={{ color: C.muted }}>c&apos;est le but</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="flex flex-wrap gap-3 items-center mb-8">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 font-display font-bold text-sm rounded-full transition-all hover:scale-[1.03] active:scale-[0.97] text-white shadow-lg"
                style={{ backgroundColor: C.coral, boxShadow: '0 8px 30px rgba(248,131,121,0.25)' }}
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-5 py-3.5 font-display font-semibold text-sm transition-colors cursor-pointer hover:text-white"
                style={{ color: C.muted }}
              >
                <Play className="w-4 h-4" />
                Voir la démo
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap items-center gap-5 text-[13px] font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {['Sans carte bancaire', 'Prêt en 1 minute', 'Annulable à tout moment'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full" style={{ background: C.green }} />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — cycling phone mockups */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <CyclingPhones />
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: `linear-gradient(to top, ${C.bg}, transparent)` }} />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SOCIAL PROOF MARQUEE
   ═══════════════════════════════════════════════════════════════════════════ */
function SocialProofBar() {
  const items = ['🍕 Restaurants', '☕ Cafés', '💇 Salons', '🎮 Escape Games', '🏪 Boutiques', '🍸 Bars', '💆 Spas', '🎂 Pâtisseries', '🏋️ Fitness', '🎵 Concerts', '🍕 Restaurants', '☕ Cafés', '💇 Salons', '🎮 Escape Games', '🏪 Boutiques', '🍸 Bars', '💆 Spas', '🎂 Pâtisseries'];
  return (
    <section className="py-5 overflow-hidden border-y" style={{ background: C.surface, borderColor: C.border }}>
      <motion.div animate={{ x: [0, -1200] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="flex gap-10 whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="text-sm font-display font-medium tracking-wide" style={{ color: 'rgba(255,255,255,0.2)' }}>{item}</span>
        ))}
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  const steps = [
    { icon: QrCode, num: '01', title: 'Scannez', desc: 'Un QR code sur vos tables, au comptoir ou dans l\'addition. Le client scanne avec son téléphone.', color: C.coral },
    { icon: Star, num: '02', title: 'Avis Google', desc: 'Il est redirigé vers votre fiche Google. 30 secondes pour laisser un avis.', color: C.yellow },
    { icon: Gift, num: '03', title: 'Roue & Cadeau', desc: 'Il tourne la roue, gagne un lot, et vous laisse son email. Tout le monde y gagne.', color: C.sky },
  ];
  return (
    <section id="how" className="py-28 sm:py-36" style={{ background: C.bg }}>
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.coral }}>Comment ça marche</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl" style={{ color: C.text }}>
            Trois étapes.{' '}
            <span style={{ color: C.coral }}>Zéro friction.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.92 }}
              transition={{ duration: 0.6, delay: inView ? i * 0.15 : 0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.03, y: -4 }}
            >
              <div
                className="relative rounded-2xl p-8 h-full group transition-all duration-500 border"
                style={{ background: C.surface, borderColor: C.border }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = `${s.color}30`)}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <span className="absolute -top-3 -right-1 font-display font-extrabold text-[6rem] leading-none select-none pointer-events-none" style={{ color: `${s.color}08` }}>
                  {s.num}
                </span>
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `${s.color}15` }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </motion.div>
                <h3 className="font-display font-bold text-lg mb-3" style={{ color: C.text }}>{s.title}</h3>
                <p className="font-body text-[15px] leading-relaxed" style={{ color: C.muted }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEW COUNTER — wow effect
   ═══════════════════════════════════════════════════════════════════════════ */
function ReviewCounterSection() {
  const baseCount = 12847;
  const liveCount = useLiveCounter(baseCount);
  const countRef = useCountUp(baseCount, 3);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section className="py-20 relative overflow-hidden" style={{ background: C.surface }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: C.coralGlow }} />
      </div>
      <div ref={sectionRef} className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-6" style={{ color: C.coral }}>En temps réel</p>
          <div className="font-display font-extrabold text-6xl sm:text-7xl lg:text-8xl tracking-tight mb-4" style={{ color: C.text }}>
            <motion.span
              key={liveCount}
              initial={{ opacity: 0.8, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {liveCount.toLocaleString('fr-CH')}
            </motion.span>
          </div>
          <p className="font-body text-lg mb-2" style={{ color: C.muted }}>
            avis Google déposés grâce à <span className="font-display font-bold" style={{ color: C.text }}>revieww</span>
          </p>
          <p className="font-body text-sm" style={{ color: `${C.muted}80` }}>
            et ça continue de grimper
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FEATURES / PILLARS
   ═══════════════════════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  const features = [
    {
      icon: Clock,
      title: 'Onboarding en 1 minute',
      desc: 'Entrez le nom de votre établissement. On récupère automatiquement votre fiche Google My Business, vos horaires, votre adresse. C\'est tout.',
      color: C.coral,
    },
    {
      icon: Target,
      title: 'Lots guidés par l\'IA',
      desc: 'Notre outil vous recommande les bons lots et la bonne fréquence de gain. Vous gardez le contrôle, on vous guide.',
      color: C.yellow,
    },
    {
      icon: Mail,
      title: 'Collecte emails & SMS',
      desc: 'Chaque spin = un contact qualifié. Lancez des campagnes email ou SMS directement, ou exportez vers Mailchimp, Brevo, Klaviyo ou via Zapier.',
      color: C.sky,
    },
    {
      icon: BarChart3,
      title: 'Dashboard complet',
      desc: 'Avis, contacts, spins, taux de conversion. Tout est mesuré. Vous savez exactement ce que revieww vous rapporte.',
      color: C.green,
    },
  ];

  return (
    <section className="py-28 sm:py-36" style={{ background: C.bg }}>
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.sky }}>Fonctionnalités</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-4" style={{ color: C.text }}>
            Tout ce qu&apos;il faut.{' '}
            <span style={{ color: C.coral }}>Rien de trop.</span>
          </h2>
          <p className="font-body text-lg max-w-lg mx-auto" style={{ color: C.muted }}>
            Un outil simple qui fait le job. Pas de usine à gaz.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.6, delay: inView ? i * 0.1 : 0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div className="rounded-2xl p-7 h-full border transition-all duration-300" style={{ background: C.surface, borderColor: C.border }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = `${f.color}30`)}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.color}15` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-display font-bold text-base mb-2" style={{ color: C.text }}>{f.title}</h3>
                <p className="font-body text-[14px] leading-relaxed" style={{ color: C.muted }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integration logos bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: inView ? 0.4 : 0 }}
          className="mt-12 text-center"
        >
          <p className="font-body text-[13px] mb-4" style={{ color: `${C.muted}60` }}>S&apos;intègre avec vos outils</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Mailchimp', 'Brevo', 'Klaviyo', 'Zapier', 'HubSpot'].map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 rounded-full text-[12px] font-display font-semibold border"
                style={{ borderColor: C.border, color: `${C.muted}80` }}
              >
                {tool}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL VISION — Future teaser
   ═══════════════════════════════════════════════════════════════════════════ */
function LocalVisionSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  return (
    <section className="py-28 sm:py-36 relative overflow-hidden" style={{ background: C.surface }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px]" style={{ background: C.skyGlow }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[130px]" style={{ background: C.yellowGlow }} />
      </div>
      <div ref={sectionRef} className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-display font-semibold border mb-6"
              style={{ borderColor: `${C.sky}30`, background: `${C.sky}08`, color: C.sky }}
            >
              <Globe className="w-3.5 h-3.5" />
              Bientôt
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-5 leading-tight" style={{ color: C.text }}>
              Le réseau{' '}
              <span style={{ color: C.sky }}>des commerçants locaux.</span>
            </h2>
            <p className="font-body text-[16px] leading-relaxed mb-6" style={{ color: C.muted }}>
              Imaginez : un client gagne sur votre roue un bon pour le café d&apos;à côté. Et les clients du café découvrent votre restaurant. Les commerçants d&apos;une même ville se soutiennent et partagent leurs communautés.
            </p>
            <p className="font-body text-[15px] leading-relaxed mb-6" style={{ color: C.muted }}>
              Événements, ouvertures, offres spéciales — tout passe par la roue. Une vraie visibilité locale, entre voisins.
            </p>
            <p className="font-display font-semibold text-sm" style={{ color: C.sky }}>
              C&apos;est notre vision. Et on y travaille.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={inView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 30, scale: 0.95 }}
            transition={{ duration: 0.7, delay: inView ? 0.15 : 0, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Network visualization */}
              <div className="w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] relative">
                {/* Center node */}
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl z-10 border"
                  style={{ background: C.surfaceLight, borderColor: `${C.coral}30` }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="text-3xl">🍕</span>
                </motion.div>
                {/* Orbiting nodes */}
                {[
                  { emoji: '☕', angle: 0, delay: 0 },
                  { emoji: '💇', angle: 72, delay: 0.5 },
                  { emoji: '🎮', angle: 144, delay: 1 },
                  { emoji: '🍸', angle: 216, delay: 1.5 },
                  { emoji: '💆', angle: 288, delay: 2 },
                ].map((node, i) => {
                  const rad = ((node.angle - 90) * Math.PI) / 180;
                  const radius = 120;
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-14 h-14 rounded-xl flex items-center justify-center shadow-lg border"
                      style={{
                        background: C.surface,
                        borderColor: C.border,
                        left: `calc(50% + ${Math.cos(rad) * radius}px - 28px)`,
                        top: `calc(50% + ${Math.sin(rad) * radius}px - 28px)`,
                      }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ delay: inView ? 0.3 + node.delay * 0.2 : 0, type: 'spring', stiffness: 200 }}
                    >
                      <span className="text-xl">{node.emoji}</span>
                    </motion.div>
                  );
                })}
                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
                  {[0, 72, 144, 216, 288].map((angle, i) => {
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const radius = 120;
                    return (
                      <motion.line
                        key={i}
                        x1="50%" y1="50%"
                        x2={`${50 + (Math.cos(rad) * radius / 3.4)}%`}
                        y2={`${50 + (Math.sin(rad) * radius / 3.4)}%`}
                        stroke={C.sky}
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        initial={{ pathLength: 0 }}
                        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
                        transition={{ delay: inView ? 0.5 + i * 0.15 : 0, duration: 0.8 }}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO — Interactive Wheel
   ═══════════════════════════════════════════════════════════════════════════ */
function DemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ emoji: string; label: string } | null>(null);
  const [rotation, setRotation] = useState(0);

  const prizes = [
    { emoji: '☕', label: 'Café offert !' },
    { emoji: '🎂', label: 'Dessert offert !' },
    { emoji: '💰', label: '-20% prochaine visite !' },
    { emoji: '🎁', label: 'Surprise du chef !' },
    { emoji: '🍺', label: 'Boisson offerte !' },
  ];

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setRotation((r) => r + 1800 + Math.random() * 360);
    setTimeout(() => {
      setSpinning(false);
      setResult(prizes[Math.floor(Math.random() * prizes.length)]);
    }, 3500);
  };

  return (
    <section id="demo" className="py-28 sm:py-36" style={{ background: C.bg }}>
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Wheel */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }} transition={{ duration: 0.7 }} className="flex justify-center order-2 lg:order-1">
            <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
              <div className="absolute inset-[-10%] rounded-full blur-[50px]" style={{ background: C.coralGlow }} />
              <div
                className="absolute inset-0 rounded-full shadow-2xl border-2"
                style={{
                  borderColor: C.border,
                  background: `conic-gradient(from 0deg, ${C.coral} 0deg 72deg, ${C.sand} 72deg 144deg, ${C.sky} 144deg 216deg, ${C.yellow} 216deg 288deg, ${C.surfaceLight} 288deg 360deg)`,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 3.5s cubic-bezier(0.12, 0.8, 0.08, 1)' : 'none',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
              />
              {['☕', '🎂', '💰', '🎁', '🍺'].map((e, i) => {
                const a = i * 72 + 36;
                const r = ((a - 90) * Math.PI) / 180;
                return (
                  <span
                    key={i}
                    className="absolute text-2xl pointer-events-none"
                    style={{
                      left: `calc(50% + ${Math.cos(r) * 90}px - 14px)`,
                      top: `calc(50% + ${Math.sin(r) * 90}px - 14px)`,
                      transform: `rotate(${rotation}deg)`,
                      transition: spinning ? 'transform 3.5s cubic-bezier(0.12, 0.8, 0.08, 1)' : 'none',
                    }}
                  >
                    {e}
                  </span>
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={spin}
                  disabled={spinning}
                  className="w-20 h-20 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform disabled:cursor-wait z-10 border"
                  style={{ background: C.bg, borderColor: C.border }}
                >
                  <span className="font-display font-extrabold text-base" style={{ color: C.coral }}>{spinning ? '...' : 'GO'}</span>
                </button>
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px]" style={{ borderTopColor: C.coral }} />
              </div>
            </div>
          </motion.div>

          {/* Copy */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }} transition={{ duration: 0.6, delay: inView ? 0.1 : 0 }} className="order-1 lg:order-2">
            <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.coral }}>Essayez maintenant</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-4" style={{ color: C.text }}>
              Votre client voit{' '}
              <span style={{ color: C.yellow }}>exactement ça.</span>
            </h2>
            <p className="font-body text-lg leading-relaxed mb-8 max-w-md" style={{ color: C.muted }}>
              Personnalisez les lots, les couleurs, les probabilités. Cliquez sur GO pour tester.
            </p>
            <div className="h-20 mb-8">
              <AnimatePresence mode="wait">
                {result && (
                  <motion.div key="r" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.15)' }}>
                    <span className="text-3xl">{result.emoji}</span>
                    <div>
                      <p className="font-display font-bold" style={{ color: C.text }}>Bravo !</p>
                      <p className="font-body text-sm" style={{ color: C.muted }}>{result.label}</p>
                    </div>
                  </motion.div>
                )}
                {!result && !spinning && (
                  <motion.p key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-body" style={{ color: C.muted }}>
                    Cliquez sur GO pour lancer la roue
                  </motion.p>
                )}
                {spinning && (
                  <motion.p key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-body font-semibold animate-pulse" style={{ color: C.coral }}>
                    La roue tourne...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 font-display font-bold text-sm rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] text-white"
              style={{ backgroundColor: C.coral, boxShadow: '0 8px 24px rgba(248,131,121,0.2)' }}
            >
              Créer ma roue <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PRICING
   ═══════════════════════════════════════════════════════════════════════════ */
function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  return (
    <section id="pricing" className="py-28 sm:py-36" style={{ background: C.surface }}>
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.yellow }}>Tarifs</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-4" style={{ color: C.text }}>
            Simple.{' '}
            <span style={{ color: C.coral }}>Transparent.</span>
          </h2>
          <p className="font-body text-lg max-w-md mx-auto" style={{ color: C.muted }}>
            {TEXTS.pricing.subtitle}
          </p>
        </motion.div>

        {/* Free plan highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: inView ? 0.1 : 0 }}
          className="max-w-lg mx-auto mb-10"
        >
          <div className="rounded-2xl p-6 text-center border" style={{ background: C.bg, borderColor: C.border }}>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-display font-bold mb-3" style={{ background: `${C.green}15`, color: C.green }}>
              Gratuit
            </span>
            <h3 className="font-display font-bold text-lg mb-1" style={{ color: C.text }}>Commencez sans payer</h3>
            <p className="font-body text-sm mb-4" style={{ color: C.muted }}>
              {FREE_PLAN.spinsLabel} · {FREE_PLAN.contactsLabel} · QR code · Dashboard complet
            </p>
            <Link
              href="/signup"
              className="inline-block px-8 py-2.5 rounded-full font-display font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: C.green, color: '#fff' }}
            >
              Commencer gratuitement
            </Link>
          </div>
        </motion.div>

        {/* Paid plans */}
        <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PAID_PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.92 }}
              transition={{ duration: 0.6, delay: inView ? 0.15 + i * 0.12 : 0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: plan.popular ? 1.04 : 1.02, y: -6 }}
            >
              <div
                className={cn('rounded-2xl p-7 h-full flex flex-col transition-all duration-300 border', plan.popular ? 'ring-1' : '')}
                style={{
                  background: C.bg,
                  borderColor: plan.popular ? C.coral : C.border,
                  ...(plan.popular ? { boxShadow: '0 0 40px rgba(248,131,121,0.1)', ringColor: `${C.coral}50` } : {}),
                }}
              >
                {plan.popular && (
                  <span
                    className="inline-flex items-center gap-1 self-start px-3 py-1 rounded-full text-[11px] font-display font-bold mb-4"
                    style={{ background: `${C.coral}15`, color: C.coral }}
                  >
                    Populaire
                  </span>
                )}
                <h3 className="font-display font-bold text-base" style={{ color: C.text }}>{plan.name}</h3>
                <p className="font-body text-[13px] mb-5" style={{ color: C.muted }}>{plan.description}</p>
                <div className="mb-3">
                  <span className="font-display font-extrabold text-4xl" style={{ color: C.text }}>{plan.price}</span>
                  <span className="font-body text-sm ml-1" style={{ color: C.muted }}>{plan.currency}/mois</span>
                </div>
                <div className="flex flex-col gap-1 mb-6">
                  <span className="inline-block px-3 py-1 rounded-lg text-[13px] font-display font-semibold self-start" style={{ background: 'rgba(255,255,255,0.04)', color: C.muted }}>
                    {plan.spinsLabel}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-lg text-[13px] font-display font-semibold self-start" style={{ background: 'rgba(255,255,255,0.04)', color: C.muted }}>
                    {plan.contactsLabel}
                  </span>
                </div>
                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {(plan.features ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.green }} />
                      <span className="font-body text-[13px]" style={{ color: C.muted }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="block text-center py-3 rounded-full font-display font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: plan.popular ? C.coral : 'rgba(255,255,255,0.06)',
                    color: plan.popular ? '#fff' : C.text,
                    ...(plan.popular ? { boxShadow: '0 4px 15px rgba(248,131,121,0.25)' } : {}),
                  }}
                >
                  Commencer
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-center font-body text-[13px] mt-10" style={{ color: C.muted }}>
          Commencez gratuitement · Sans engagement · Annulable à tout moment
        </p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════════════════ */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b transition-colors"
      style={{ borderColor: C.border }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="font-display font-semibold text-[15px] pr-4 group-hover:text-white transition-colors" style={{ color: open ? C.text : C.muted }}>
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 shrink-0" style={{ color: C.muted }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="font-body text-[14px] leading-relaxed pb-5" style={{ color: C.muted }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  const faqs = [
    {
      q: 'Comment ça fonctionne concrètement ?',
      a: 'Vous créez votre compte, entrez le nom de votre commerce (on récupère automatiquement votre fiche Google), personnalisez votre roue avec vos lots, et imprimez le QR code. Vos clients le scannent, laissent un avis Google, puis tournent la roue pour gagner un cadeau. Vous récupérez leur email au passage.',
    },
    {
      q: 'Combien de temps prend la mise en place ?',
      a: 'Moins d\'une minute. Entrez le nom de votre établissement, notre outil récupère tout via l\'API Google (adresse, horaires, lien avis). Choisissez vos lots — on vous guide avec des recommandations — et c\'est prêt.',
    },
    {
      q: 'Est-ce que les avis sont vérifiés ?',
      a: 'Oui. Notre système détecte si le client a réellement passé du temps sur Google pour laisser un avis grâce à la Page Visibility API. Un score de confiance est calculé automatiquement.',
    },
    {
      q: 'Est-ce conforme aux règles de Google ?',
      a: 'revieww n\'incite pas à laisser un avis positif. On motive le client à laisser un avis — quelle que soit la note. C\'est conforme aux guidelines Google.',
    },
    {
      q: 'Que se passe-t-il avec les emails collectés ?',
      a: 'Chaque email est stocké dans votre dashboard. Vous pouvez exporter la liste en CSV ou la connecter directement à vos outils marketing (Mailchimp, Brevo, Klaviyo) via Zapier ou nos intégrations natives.',
    },
    {
      q: 'Je peux choisir les lots et les probabilités ?',
      a: 'Absolument. Vous définissez chaque lot, son emoji, sa probabilité de gain. Notre outil vous recommande les meilleures combinaisons pour maximiser l\'engagement sans exploser votre budget.',
    },
    {
      q: 'Puis-je annuler à tout moment ?',
      a: 'Oui. Pas d\'engagement, pas de frais cachés. Vous pouvez annuler depuis votre dashboard en un clic. Le plan gratuit ne nécessite pas de carte bancaire.',
    },
    {
      q: 'C\'est adapté à quel type de commerce ?',
      a: 'Restaurants, cafés, salons de coiffure, spas, escape games, boutiques, bars, fitness... Tout commerce qui reçoit des clients sur place et veut booster ses avis Google.',
    },
  ];

  return (
    <section id="faq" className="py-28 sm:py-36" style={{ background: C.bg }}>
      <div ref={sectionRef} className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.yellow }}>FAQ</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl" style={{ color: C.text }}>
            Questions{' '}
            <span style={{ color: C.coral }}>fréquentes.</span>
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: inView ? 0.1 : 0 }}
        >
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════════════════════════════════════ */
function FinalCTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.1 });
  return (
    <section className="py-28 sm:py-36 relative overflow-hidden" style={{ background: C.surface }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[130px]" style={{ background: C.coralGlow }} />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: C.skyGlow }} />
      </div>
      <div ref={sectionRef} className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.92 }} animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.92 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mb-6 leading-tight" style={{ color: C.text }}>
            Prêt à récolter{' '}
            <span style={{ color: C.coral }}>des avis ?</span>
          </h2>
          <p className="font-body text-lg mb-10 max-w-md mx-auto" style={{ color: C.muted }}>
            1 minute pour s&apos;inscrire. 30 spins offerts. 0 raison d&apos;hésiter.
          </p>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2.5 px-8 py-4 font-display font-bold text-base rounded-full transition-all hover:scale-[1.03] active:scale-[0.97] text-white"
            style={{ backgroundColor: C.coral, boxShadow: '0 10px 40px rgba(248,131,121,0.25)' }}
          >
            Commencer gratuitement
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="font-body text-[13px] mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Sans carte bancaire · Annulable à tout moment
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="pt-16 pb-8 border-t" style={{ background: '#060810', borderColor: C.border }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div>
            <Logo size="sm" variant="light" animate />
            <p className="font-body text-[13px] mt-4 leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Plus d&apos;avis Google. Plus de clients. Plus de fidélité.
            </p>
          </div>
          {[
            { title: 'Produit', links: [{ label: 'Fonctionnement', id: 'how' }, { label: 'Tarifs', id: 'pricing' }, { label: 'FAQ', id: 'faq' }] },
            { title: 'Légal', links: [{ label: 'CGU', href: '/cgu' }, { label: 'CGV', href: '/cgv' }, { label: 'Confidentialité', href: '/confidentialite' }] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-bold text-[11px] uppercase tracking-wider mb-4" style={{ color: C.muted }}>{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l: { label: string; id?: string; href?: string }) => (
                  <li key={l.label}>
                    <a href={l.href || `#${l.id}`} className="font-body text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-display font-bold text-[11px] uppercase tracking-wider mb-4" style={{ color: C.muted }}>Contact</h4>
            <a href="mailto:hello@revieww.ch" className="inline-flex items-center gap-2 font-body text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <Mail className="w-3.5 h-3.5" />hello@revieww.ch
            </a>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: C.border }}>
          <p className="font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>© 2026 {APP_DOMAIN}</p>
          <p className="font-body text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>Fait en Suisse 🇨🇭</p>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen font-body" style={{ background: C.bg, color: C.text }}>
      <Navbar />
      <HeroSection />
      <SocialProofBar />
      <HowItWorksSection />
      <ReviewCounterSection />
      <FeaturesSection />
      <DemoSection />
      <LocalVisionSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
