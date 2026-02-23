import { Plan } from './types';

export const APP_NAME = 'revieww';
export const APP_TAGLINE = 'review & win';
export const APP_DOMAIN = 'revieww.ch';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://revieww.ch';
export const PLAY_URL = process.env.NEXT_PUBLIC_PLAY_URL || 'https://play.revieww.ch';

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    currency: 'CHF',
    spinsPerMonth: 50,
    spinsLabel: '50 spins/mois',
    description: 'Idéal pour démarrer',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 39,
    currency: 'CHF',
    spinsPerMonth: 200,
    spinsLabel: '200 spins/mois',
    description: 'Le plus populaire',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    currency: 'CHF',
    spinsPerMonth: 999999,
    spinsLabel: 'Spins illimités',
    description: 'Pour les ambitieux',
  },
];

export const PLAN_SPIN_LIMITS: Record<string, number> = {
  starter: 50,
  growth: 200,
  pro: 999999,
};

export const STRIPE_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  growth: process.env.STRIPE_PRICE_GROWTH || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
};

export const WHEEL_TEMPLATES = [
  { emoji: '☕', label: 'Café offert', color: '#6F4E37', isWinning: true },
  { emoji: '🎂', label: 'Dessert offert', color: '#E91E63', isWinning: true },
  { emoji: '🍺', label: 'Boisson offerte', color: '#FF9800', isWinning: true },
  { emoji: '💰', label: '-10% prochain achat', color: '#4CAF50', isWinning: true },
  { emoji: '💰', label: '-20% prochain achat', color: '#2E7D32', isWinning: true },
  { emoji: '🎁', label: 'Surprise du chef', color: '#9C27B0', isWinning: true },
  { emoji: '❌', label: 'Perdu — retente ta chance !', color: '#78909C', isWinning: false },
  { emoji: '😢', label: 'Pas de chance', color: '#607D8B', isWinning: false },
  { emoji: '🍽️', label: 'Repas offert', color: '#FFD700', isWinning: true },
];

export const DEFAULT_SEGMENTS = [
  { emoji: '☕', label: 'Café offert', probability: 25, color: '#6F4E37', isWinning: true, position: 0 },
  { emoji: '💰', label: '-10%', probability: 20, color: '#4CAF50', isWinning: true, position: 1 },
  { emoji: '❌', label: 'Perdu', probability: 30, color: '#78909C', isWinning: false, position: 2 },
  { emoji: '🎂', label: 'Dessert offert', probability: 15, color: '#E91E63', isWinning: true, position: 3 },
  { emoji: '😢', label: 'Pas de chance', probability: 10, color: '#607D8B', isWinning: false, position: 4 },
];

export const COLORS = {
  primary: '#FF6B35',
  secondary: '#1B2A4A',
  accent: '#10B981',
  background: '#FAFAF8',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textMuted: '#6B7280',
  sidebar: '#0F1729',
  sidebarHover: '#1B2A4A',
  sidebarActive: '#FF6B35',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
};

export const TEXTS = {
  hero: {
    title: 'Boostez vos avis Google.',
    subtitle: 'Vos clients adorent jouer.',
    description: 'revieww transforme chaque avis en une chance de gagner',
    cta: 'Essai gratuit 7 jours',
  },
  howItWorks: {
    title: 'Comment ça marche',
    steps: [
      { title: 'Placez le QR code', description: 'Sur vos tables, au comptoir, dans l\'addition' },
      { title: 'Vos clients laissent un avis', description: 'Ils scannent et laissent un avis Google en 30 secondes' },
      { title: 'Ils tournent la roue et gagnent', description: 'Un jeu fun avec des lots instantanés' },
    ],
  },
  stats: {
    reviews: 'Avis déposés via revieww',
    retention: 'Commerçants actifs',
    emails: 'Emails collectés',
  },
  pricing: {
    title: 'Des prix simples et transparents',
    subtitle: 'Essai gratuit 7 jours · Sans engagement · Annulable à tout moment',
    features: [
      'QR code personnalisé',
      'Roue personnalisable',
      'Collecte d\'emails',
      'Export CSV',
      'Dashboard complet',
    ],
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} revieww.ch`,
  },
  play: {
    welcome: 'Donnez-nous votre avis et gagnez un cadeau !',
    cta: 'Laisser un avis Google',
    waitMessage: 'Prenez le temps de laisser votre avis, nous vous attendons !',
    starsQuestion: 'Merci ! Combien d\'étoiles avez-vous donné ?',
    confirmButton: 'J\'ai laissé mon avis',
    emailTitle: 'Merci pour votre avis !',
    emailPlaceholder: 'Entrez votre email pour recevoir votre cadeau',
    phonePlaceholder: 'Téléphone (optionnel)',
    optIn: 'J\'accepte de recevoir des offres de',
    spinButton: 'Tourner la roue !',
    wonTitle: 'Félicitations !',
    wonSubtitle: 'Vous avez gagné :',
    wonInstruction: 'Présentez cet écran en caisse',
    lostTitle: 'Pas de chance cette fois !',
    lostSubtitle: 'Revenez bientôt',
    quotaReached: 'Merci de votre intérêt ! Revenez bientôt',
    paused: 'Cette roue est en pause',
    alreadyPlayed: 'Vous avez déjà participé récemment !',
  },
  dashboard: {
    overview: 'Vue d\'ensemble',
    wheel: 'Ma Roue',
    qrcode: 'Mon QR Code',
    clients: 'Avis & Contacts',
    messages: 'Messages',
    settings: 'Paramètres',
    billing: 'Abonnement',
    comingSoon: 'Bientôt disponible',
  },
  onboarding: {
    step1Title: 'Choisissez votre plan',
    step2Title: 'Recherchez votre commerce',
    step2Placeholder: 'Tapez le nom de votre commerce...',
    step2Confirm: 'C\'est bien votre commerce ?',
    step2Fallback: 'Coller un lien Google Review manuellement',
    step3Title: 'Configurez votre roue',
    step3Subtitle: 'Choisissez des lots pour vos clients',
  },
};
