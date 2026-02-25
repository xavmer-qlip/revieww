'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  AnimatePresence,
} from 'motion/react';
import {
  QrCode,
  Gift,
  Check,
  ArrowRight,
  Mail,
  Play,
  Menu,
  X,
  ChevronDown,
  Star,
  Heart,
  Store,
  Users,
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
   PHONE SCREENS — Scan → Wheel → Result
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
        Tournez la roue<br />et tentez de gagner un cadeau !
      </p>
      <div
        className="w-full font-display font-bold text-[13px] py-3 rounded-2xl shadow-md text-white text-center mb-3"
        style={{ background: `linear-gradient(90deg, ${C.coral}, #e66a5f)` }}
      >
        Tourner la roue !
      </div>
      <p className="font-body text-[10px] text-gray-300">Prend moins de 30 secondes</p>
    </div>
  );
}


function ScreenWheel() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-5" style={{ background: 'linear-gradient(180deg, #fffde7 0%, #ffffff 100%)' }}>
      <p className="font-display font-bold text-[13px] text-gray-900 mb-4">C&apos;est parti !</p>
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
              Transformez chaque visite
              <br />en{' '}
              <span style={{ color: C.coral }}>moment de jeu.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="font-body text-[17px] leading-relaxed mb-8 max-w-md"
              style={{ color: C.muted }}
            >
              Un QR code sur la table, au comptoir ou dans l&apos;addition. Votre client scanne, tourne la roue et gagne un cadeau. Vous récupérez son email, vous construisez votre fichier clients, et vous lui donnez une raison de revenir. Restaurant, café, salon, boutique — woopla s&apos;adapte à tous les commerces qui reçoivent des clients sur place.
            </motion.p>

            {/* Fidélisation badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border mb-8"
              style={{ borderColor: `${C.coral}30`, background: `${C.coral}08` }}
            >
              <Gift className="w-4 h-4" style={{ color: C.coral }} />
              <span className="font-display font-bold text-sm" style={{ color: C.coral }}>Fidélisation & engagement</span>
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
    { icon: QrCode, num: '01', title: 'Scannez', desc: 'Placez un QR code sur vos tables, au comptoir ou dans l\'addition. Votre client le scanne en 2 secondes avec son téléphone — pas d\'app à télécharger, pas de compte à créer.', color: C.coral },
    { icon: Gift, num: '02', title: 'Roue & Cadeau', desc: 'La roue tourne, l\'excitation monte. Café offert, dessert gratuit, réduction surprise… Votre client découvre son lot instantanément. C\'est fun, c\'est gratifiant, et ça crée un souvenir positif lié à votre commerce.', color: C.yellow },
    { icon: Mail, num: '03', title: 'Email & Contact', desc: 'Pour récupérer son lot, votre client laisse son email. Vous construisez votre base de contacts qualifiés pour vos futures campagnes marketing — sans effort, sans friction.', color: C.sky },
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
   LOCAL MERCHANTS — Value props for shop owners
   ═══════════════════════════════════════════════════════════════════════════ */
function LocalMerchantsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });
  const cards = [
    {
      icon: Star,
      title: 'Boostez vos avis Google',
      desc: 'Après avoir joué, vos clients sont dans un état d\'esprit positif — le moment idéal pour leur proposer de laisser un avis. Plus d\'avis positifs = meilleur référencement sur Google Maps = plus de nouveaux clients qui vous découvrent.',
      color: C.yellow,
    },
    {
      icon: Users,
      title: 'Construisez votre fichier clients',
      desc: 'Chaque spin = un email qualifié, récupéré naturellement. En un mois, vous pouvez collecter des dizaines de contacts. Exportez-les vers Mailchimp, Brevo, Klaviyo — ou utilisez-les directement pour annoncer vos offres, vos événements ou vos nouveautés.',
      color: C.sky,
    },
    {
      icon: Heart,
      title: 'Donnez envie de revenir',
      desc: 'Un client qui gagne un café se souvient de vous. La gamification crée une émotion positive, un souvenir ludique. Résultat : il revient, il en parle autour de lui, et il amène ses proches. C\'est la fidélisation par le plaisir.',
      color: C.coral,
    },
    {
      icon: Store,
      title: 'Créez un réseau de quartier',
      desc: 'Imaginez : un client gagne chez vous un bon pour le café d\'à côté. Et les clients du café découvrent votre restaurant. Les commerçants du quartier se soutiennent et partagent leurs communautés. Tout le monde y gagne.',
      color: C.green,
    },
  ];

  return (
    <section className="py-28 sm:py-36" style={{ background: C.surface }}>
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.coral }}>Pour les commerçants</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-4" style={{ color: C.text }}>
            Conçu pour les{' '}
            <span style={{ color: C.coral }}>commerçants locaux.</span>
          </h2>
          <p className="font-body text-lg max-w-lg mx-auto" style={{ color: C.muted }}>
            Plus qu&apos;un jeu. Un outil concret pour développer votre commerce.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.6, delay: inView ? i * 0.1 : 0, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02, y: -3 }}
            >
              <div
                className="rounded-2xl p-7 h-full border transition-all duration-300"
                style={{ background: C.bg, borderColor: C.border }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = `${card.color}30`)}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: `${card.color}15` }}>
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <h3 className="font-display font-bold text-base mb-2" style={{ color: C.text }}>{card.title}</h3>
                <p className="font-body text-[14px] leading-relaxed" style={{ color: C.muted }}>{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CLIENT EXPERIENCE MOCKUP — Mobile flow + Client recap
   ═══════════════════════════════════════════════════════════════════════════ */

function MiniPhone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div
        className="relative rounded-[2rem] p-[6px] shadow-xl"
        style={{ background: 'linear-gradient(145deg, #2a2a2e 0%, #0a0a0a 100%)', boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-3.5 rounded-b-xl z-10" style={{ background: '#0a0a0a' }} />
        <div className="rounded-[1.6rem] overflow-hidden w-[180px] h-[360px] relative bg-white">
          {children}
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}

function FlowScreenWelcome() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 text-center" style={{ background: 'linear-gradient(180deg, #fff5f4 0%, #ffffff 100%)' }}>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-md"
        style={{ background: `linear-gradient(135deg, ${C.coral}, #e66a5f)`, boxShadow: '0 6px 16px rgba(248,131,121,0.3)' }}
      >
        <span className="text-white text-base">🍕</span>
      </div>
      <h3 className="font-display font-bold text-[12px] text-gray-900 mb-1">Pizzeria Da Marco</h3>
      <p className="font-body text-[9px] text-gray-400 mb-4 leading-relaxed">
        Tournez la roue<br />et tentez de gagner !
      </p>
      <div
        className="w-full font-display font-bold text-[10px] py-2 rounded-xl text-white text-center"
        style={{ background: `linear-gradient(90deg, ${C.coral}, #e66a5f)` }}
      >
        Tourner la roue !
      </div>
    </div>
  );
}

function FlowScreenWheel() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, #fffde7 0%, #ffffff 100%)' }}>
      <p className="font-display font-bold text-[11px] text-gray-900 mb-3">La roue tourne...</p>
      {/* Simplified wheel */}
      <div className="relative w-28 h-28 mb-3">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {[
            { color: '#F88379', start: 0 },
            { color: '#FFEB3B', start: 60 },
            { color: '#82C8E5', start: 120 },
            { color: '#34d399', start: 180 },
            { color: '#F88379', start: 240 },
            { color: '#E6D8C4', start: 300 },
          ].map((seg, i) => {
            const startAngle = (seg.start * Math.PI) / 180;
            const endAngle = ((seg.start + 60) * Math.PI) / 180;
            const x1 = 50 + 45 * Math.cos(startAngle);
            const y1 = 50 + 45 * Math.sin(startAngle);
            const x2 = 50 + 45 * Math.cos(endAngle);
            const y2 = 50 + 45 * Math.sin(endAngle);
            return (
              <path
                key={i}
                d={`M50,50 L${x1},${y1} A45,45 0 0,1 ${x2},${y2} Z`}
                fill={seg.color}
                opacity={0.8}
              />
            );
          })}
          <circle cx="50" cy="50" r="12" fill="white" />
          <text x="50" y="53" textAnchor="middle" className="font-display font-bold text-[10px]" fill={C.coral}>W</text>
        </svg>
        {/* Arrow indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-3" style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid ${C.coral}` }} />
      </div>
      <p className="font-body text-[9px] text-gray-400">Bonne chance !</p>
    </div>
  );
}

function FlowScreenResult() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 text-center" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' }}>
      <div className="text-3xl mb-2">☕</div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: `${C.green}20` }}>
        <Check className="w-4 h-4" style={{ color: C.green }} />
      </div>
      <p className="font-display font-bold text-[11px] mb-1" style={{ color: C.green }}>Félicitations !</p>
      <p className="font-display font-bold text-[12px] text-gray-900 mb-3">Café offert</p>
      <div className="bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
        <p className="font-body text-[8px] text-gray-400">Code de validation</p>
        <p className="font-display font-bold text-[11px] text-blue-700 tracking-wider">WP-7K3M</p>
      </div>
      <p className="font-body text-[8px] text-gray-400">Présentez ce code en caisse</p>
    </div>
  );
}

function FlowScreenSocial() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 text-center" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)' }}>
      <p className="font-display font-bold text-[11px] text-gray-900 mb-3">Merci pour votre visite !</p>
      {/* Google review stars */}
      <div className="bg-white rounded-xl border border-gray-100 p-3 w-full mb-3 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">G</span>
          </div>
          <span className="font-body text-[9px] text-gray-600">Laisser un avis Google</span>
        </div>
        <div className="flex gap-0.5 justify-center">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
      </div>
      {/* Social links */}
      <div className="flex gap-2 w-full">
        <div className="flex-1 bg-white rounded-lg border border-gray-100 py-2 flex items-center justify-center shadow-sm">
          <span className="text-[10px]">📷</span>
        </div>
        <div className="flex-1 bg-white rounded-lg border border-gray-100 py-2 flex items-center justify-center shadow-sm">
          <span className="text-[10px]">👍</span>
        </div>
        <div className="flex-1 bg-white rounded-lg border border-gray-100 py-2 flex items-center justify-center shadow-sm">
          <span className="text-[10px]">🎵</span>
        </div>
      </div>
      <p className="font-body text-[8px] text-gray-300 mt-3">Suivez Pizzeria Da Marco</p>
    </div>
  );
}

function ClientExperienceSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.05 });

  return (
    <section className="py-28 sm:py-36" style={{ background: C.bg }}>
      <div ref={sectionRef} className="max-w-6xl mx-auto px-6">
        {/* --- Part A: Mobile flow --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.sky }}>Expérience client</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-4" style={{ color: C.text }}>
            Vos clients vivent{' '}
            <span style={{ color: C.sky }}>cette expérience.</span>
          </h2>
          <p className="font-body text-lg max-w-lg mx-auto" style={{ color: C.muted }}>
            Du scan du QR code au partage sur Google. Tout est fluide, rapide et engageant. Moins de 30 secondes, zéro friction.
          </p>
        </motion.div>

        {/* 4 mobile screens */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.8, delay: inView ? 0.15 : 0, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-24"
        >
          {[
            { label: 'Accueil', screen: <FlowScreenWelcome /> },
            { label: 'La roue', screen: <FlowScreenWheel /> },
            { label: 'Résultat', screen: <FlowScreenResult /> },
            { label: 'Avis & Social', screen: <FlowScreenSocial /> },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: inView ? 0.2 + i * 0.1 : 0 }}
              className="flex flex-col items-center gap-3"
            >
              <MiniPhone>{item.screen}</MiniPhone>
              <span className="font-display font-semibold text-[12px]" style={{ color: C.muted }}>{item.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* --- Part B: Client dashboard recap --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: inView ? 0.3 : 0 }}
          className="text-center mb-12"
        >
          <p className="font-display font-semibold text-[13px] tracking-wider uppercase mb-4" style={{ color: C.coral }}>Dashboard</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-4" style={{ color: C.text }}>
            Suivez vos résultats{' '}
            <span style={{ color: C.coral }}>en temps réel.</span>
          </h2>
          <p className="font-body text-lg max-w-lg mx-auto" style={{ color: C.muted }}>
            Contacts, spins, lots distribués. Tout est mesuré. Vous savez exactement ce que woopla vous rapporte.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.8, delay: inView ? 0.4 : 0, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto"
        >
          {/* Browser chrome */}
          <div className="rounded-2xl border overflow-hidden shadow-2xl" style={{ borderColor: C.border, boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ background: '#0F1729', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-full text-[11px] font-display" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                  woopla.ch/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5 sm:p-8" style={{ background: '#f8fafc' }}>
              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
                {[
                  { label: 'Spins ce mois', value: '847', trend: '+23%', color: C.coral },
                  { label: 'Contacts', value: '312', trend: '+18%', color: C.sky },
                  { label: 'Lots distribués', value: '214', trend: '+12%', color: C.green },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
                    <p className="font-body text-[10px] sm:text-[11px] text-gray-400 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span className="font-display font-extrabold text-lg sm:text-xl text-gray-900">{stat.value}</span>
                      <span className="font-display font-semibold text-[10px] sm:text-[11px]" style={{ color: stat.color }}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {/* Recent wins */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="font-display font-bold text-xs sm:text-sm text-gray-900">Derniers gains</p>
                  </div>
                  {[
                    { email: 'marie@email.ch', prize: 'Café offert', emoji: '☕', time: 'Il y a 2 min', status: 'Validé', statusColor: C.green },
                    { email: 'lucas@email.ch', prize: 'Dessert offert', emoji: '🎂', time: 'Il y a 8 min', status: 'En attente', statusColor: C.yellow },
                    { email: 'sophie@email.ch', prize: '-10% sur l\'addition', emoji: '🏷️', time: 'Il y a 15 min', status: 'Validé', statusColor: C.green },
                  ].map((spin, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{spin.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-body text-[11px] sm:text-[12px] text-gray-700 truncate">{spin.email}</p>
                          <p className="font-body text-[9px] sm:text-[10px] text-gray-400">{spin.time}</p>
                        </div>
                      </div>
                      <span className="font-display font-semibold text-[10px] shrink-0 ml-2 px-2 py-0.5 rounded-full" style={{ background: `${spin.statusColor}15`, color: spin.statusColor }}>
                        {spin.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Google reviews + messages */}
                <div className="space-y-4">
                  {/* Google reviews card */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-xs text-gray-900">Avis Google</p>
                        <p className="font-body text-[10px] text-gray-400">Ce mois-ci</p>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-2xl text-gray-900">4.8</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('w-3 h-3', s <= 4 ? 'fill-yellow-400 text-yellow-400' : 'fill-yellow-400/50 text-yellow-400/50')} />
                        ))}
                      </div>
                      <span className="font-body text-[10px] text-gray-400">(+24 avis)</span>
                    </div>
                  </div>

                  {/* Messages preview */}
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <p className="font-display font-bold text-xs text-gray-900 mb-3">Messages envoyés</p>
                    {[
                      { subject: '🏆 Votre cadeau vous attend !', to: '312 contacts', time: 'Hier' },
                      { subject: '🍕 Menu spécial ce weekend', to: '287 contacts', time: 'Il y a 3j' },
                    ].map((msg, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div className="min-w-0">
                          <p className="font-body text-[11px] text-gray-700 truncate">{msg.subject}</p>
                          <p className="font-body text-[9px] text-gray-400">{msg.to}</p>
                        </div>
                        <span className="font-body text-[9px] text-gray-300 shrink-0 ml-2">{msg.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
      a: 'Vous créez votre compte en 1 minute : entrez le nom de votre commerce, on récupère automatiquement votre fiche Google (adresse, photo, lien avis). Ensuite, personnalisez votre roue avec vos lots — on vous propose des suggestions adaptées à votre secteur. Imprimez le QR code et placez-le sur vos tables ou au comptoir. Vos clients scannent, tournent la roue, découvrent leur lot et laissent leur email. Vous suivez tout en temps réel depuis votre dashboard.',
    },
    {
      q: 'Combien de temps prend la mise en place ?',
      a: 'Moins d\'une minute, vraiment. Tapez le nom de votre commerce, notre outil récupère tout via Google (adresse, horaires, lien avis). On vous propose des lots adaptés à votre secteur (café offert pour un restaurant, soin découverte pour un spa…). Validez, imprimez votre QR code, et c\'est parti. Pas de configuration technique, pas de compétences particulières.',
    },
    {
      q: 'Faut-il un avis Google pour jouer ?',
      a: 'Non, jamais. Le jeu est une animation commerciale 100% indépendante des avis Google. Vos clients jouent, gagnent un cadeau et vous laissent leur email. Après le jeu, on leur propose de laisser un avis — mais c\'est totalement optionnel et ne conditionne jamais le lot gagné. Tout est conforme aux règles de Google.',
    },
    {
      q: 'Comment fidéliser mes clients avec woopla ?',
      a: 'Chaque participation génère un contact qualifié. Utilisez votre base pour envoyer des offres personnalisées, annoncer vos événements, vos menus du jour ou vos promotions saisonnières. Un client qui gagne un café gratuit se souvient de vous et revient — avec ses amis. La gamification transforme une simple visite en expérience mémorable.',
    },
    {
      q: 'Que se passe-t-il avec les emails collectés ?',
      a: 'Chaque email est stocké en toute sécurité dans votre dashboard. Vous pouvez exporter la liste complète en CSV en un clic, ou la connecter directement à vos outils marketing préférés (Mailchimp, Brevo, Klaviyo) via Zapier. Les données restent les vôtres — nous ne les partageons jamais avec des tiers.',
    },
    {
      q: 'Je peux choisir les lots et les probabilités ?',
      a: 'Absolument. Vous contrôlez tout : chaque lot, son emoji, sa couleur, sa probabilité de gain et son stock mensuel. Vous voulez que 70% des joueurs gagnent un petit lot et 5% un gros lot ? C\'est vous qui décidez. Notre outil vous recommande les meilleures combinaisons pour maximiser l\'engagement tout en maîtrisant votre budget.',
    },
    {
      q: 'Puis-je annuler à tout moment ?',
      a: 'Oui, sans aucune condition. Pas d\'engagement, pas de frais cachés, pas de période minimale. Vous pouvez annuler depuis votre dashboard en un clic — l\'abonnement reste actif jusqu\'à la fin de la période payée. Le plan gratuit (30 spins) ne nécessite même pas de carte bancaire.',
    },
    {
      q: 'C\'est adapté à quel type de commerce ?',
      a: 'Restaurants, cafés, salons de coiffure, spas, escape games, boutiques, bars, boulangeries, fitness, food trucks… Tout commerce qui reçoit des clients sur place. Nos lots prédéfinis s\'adaptent automatiquement à votre secteur d\'activité. Que vous ayez 10 ou 500 clients par jour, woopla s\'adapte à votre volume.',
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
            Prêt à animer{' '}
            <span style={{ color: C.coral }}>votre commerce ?</span>
          </h2>
          <p className="font-body text-lg mb-10 max-w-lg mx-auto" style={{ color: C.muted }}>
            Créez votre compte en 1 minute, personnalisez votre roue, imprimez le QR code. 30 spins offerts pour tester, sans carte bancaire. Vos premiers contacts dès aujourd&apos;hui.
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
              Plus d&apos;engagement. Plus de contacts. Plus de fidélité.
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
            <a href="mailto:hello@woopla.ch" className="inline-flex items-center gap-2 font-body text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <Mail className="w-3.5 h-3.5" />hello@woopla.ch
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
      <LocalMerchantsSection />
      <ClientExperienceSection />
      <LocalVisionSection />
      <DemoSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
