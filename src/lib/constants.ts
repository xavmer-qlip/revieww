import { Plan } from './types';

// ---------------------------------------------------------------------------
// Sector presets for onboarding
// ---------------------------------------------------------------------------

export type SectorKey = 'restaurant' | 'cafe_bar' | 'coiffeur_beaute' | 'commerce_boutique' | 'hotel' | 'autre';

export interface SectorPreset {
  emoji: string;
  label: string;
  color: string;
  isWinning: boolean;
  suggestedStock: number;
}

export const SECTOR_LABELS: Record<SectorKey, string> = {
  restaurant: 'Restaurant',
  cafe_bar: 'Café / Bar',
  coiffeur_beaute: 'Coiffeur / Beauté',
  commerce_boutique: 'Commerce / Boutique',
  hotel: 'Hôtel',
  autre: 'Autre',
};

export const SECTOR_PRESETS: Record<SectorKey, SectorPreset[]> = {
  restaurant: [
    { emoji: '☕', label: 'Café offert', color: '#6F4E37', isWinning: true, suggestedStock: 15 },
    { emoji: '🎂', label: 'Dessert offert', color: '#E91E63', isWinning: true, suggestedStock: 10 },
    { emoji: '💰', label: '-10%', color: '#4CAF50', isWinning: true, suggestedStock: 20 },
    { emoji: '🍽️', label: 'Repas offert', color: '#FFD700', isWinning: true, suggestedStock: 3 },
    { emoji: '🍺', label: 'Boisson offerte', color: '#FF9800', isWinning: true, suggestedStock: 15 },
    { emoji: '❌', label: 'Perdu — retente ta chance !', color: '#78909C', isWinning: false, suggestedStock: 0 },
  ],
  cafe_bar: [
    { emoji: '☕', label: 'Café offert', color: '#6F4E37', isWinning: true, suggestedStock: 20 },
    { emoji: '🍺', label: 'Boisson offerte', color: '#FF9800', isWinning: true, suggestedStock: 15 },
    { emoji: '💰', label: '-10%', color: '#4CAF50', isWinning: true, suggestedStock: 20 },
    { emoji: '🥐', label: 'Croissant offert', color: '#E91E63', isWinning: true, suggestedStock: 10 },
    { emoji: '❌', label: 'Perdu — retente ta chance !', color: '#78909C', isWinning: false, suggestedStock: 0 },
  ],
  coiffeur_beaute: [
    { emoji: '💰', label: '-10%', color: '#4CAF50', isWinning: true, suggestedStock: 15 },
    { emoji: '💆', label: 'Soin offert', color: '#9C27B0', isWinning: true, suggestedStock: 5 },
    { emoji: '🎁', label: 'Produit offert', color: '#E91E63', isWinning: true, suggestedStock: 8 },
    { emoji: '💰', label: '-20%', color: '#2E7D32', isWinning: true, suggestedStock: 5 },
    { emoji: '❌', label: 'Perdu — retente ta chance !', color: '#78909C', isWinning: false, suggestedStock: 0 },
  ],
  commerce_boutique: [
    { emoji: '💰', label: '-10%', color: '#4CAF50', isWinning: true, suggestedStock: 20 },
    { emoji: '💰', label: '-20%', color: '#2E7D32', isWinning: true, suggestedStock: 10 },
    { emoji: '🎁', label: 'Cadeau surprise', color: '#9C27B0', isWinning: true, suggestedStock: 5 },
    { emoji: '🚚', label: 'Livraison offerte', color: '#2196F3', isWinning: true, suggestedStock: 10 },
    { emoji: '❌', label: 'Perdu — retente ta chance !', color: '#78909C', isWinning: false, suggestedStock: 0 },
  ],
  hotel: [
    { emoji: '🥐', label: 'Petit-déjeuner offert', color: '#FF9800', isWinning: true, suggestedStock: 10 },
    { emoji: '💰', label: '-10%', color: '#4CAF50', isWinning: true, suggestedStock: 15 },
    { emoji: '⭐', label: 'Surclassement', color: '#FFD700', isWinning: true, suggestedStock: 3 },
    { emoji: '🍺', label: 'Boisson offerte', color: '#E91E63', isWinning: true, suggestedStock: 15 },
    { emoji: '❌', label: 'Perdu — retente ta chance !', color: '#78909C', isWinning: false, suggestedStock: 0 },
  ],
  autre: [
    { emoji: '💰', label: '-10%', color: '#4CAF50', isWinning: true, suggestedStock: 20 },
    { emoji: '💰', label: '-20%', color: '#2E7D32', isWinning: true, suggestedStock: 10 },
    { emoji: '🎁', label: 'Cadeau surprise', color: '#9C27B0', isWinning: true, suggestedStock: 5 },
    { emoji: '❌', label: 'Perdu — retente ta chance !', color: '#78909C', isWinning: false, suggestedStock: 0 },
  ],
};

const GOOGLE_CATEGORY_MAP: Record<string, SectorKey> = {
  restaurant: 'restaurant',
  food: 'restaurant',
  meal_delivery: 'restaurant',
  meal_takeaway: 'restaurant',
  cafe: 'cafe_bar',
  bar: 'cafe_bar',
  night_club: 'cafe_bar',
  bakery: 'cafe_bar',
  hair_care: 'coiffeur_beaute',
  beauty_salon: 'coiffeur_beaute',
  spa: 'coiffeur_beaute',
  store: 'commerce_boutique',
  clothing_store: 'commerce_boutique',
  shopping_mall: 'commerce_boutique',
  shoe_store: 'commerce_boutique',
  jewelry_store: 'commerce_boutique',
  electronics_store: 'commerce_boutique',
  furniture_store: 'commerce_boutique',
  book_store: 'commerce_boutique',
  pet_store: 'commerce_boutique',
  florist: 'commerce_boutique',
  lodging: 'hotel',
  hotel: 'hotel',
};

export function mapGoogleCategoryToSector(googleCategory: string | null): SectorKey {
  if (!googleCategory) return 'autre';
  const lower = googleCategory.toLowerCase().trim();
  // Try exact match first
  if (GOOGLE_CATEGORY_MAP[lower]) return GOOGLE_CATEGORY_MAP[lower];
  // Try partial match
  for (const [key, sector] of Object.entries(GOOGLE_CATEGORY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return sector;
  }
  return 'autre';
}

// ---------------------------------------------------------------------------
// App constants
// ---------------------------------------------------------------------------

export const APP_NAME = 'revieww';
export const APP_TAGLINE = 'review & win';
export const APP_DOMAIN = 'revieww.ch';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://revieww.ch';
export const PLAY_URL = process.env.NEXT_PUBLIC_PLAY_URL || 'https://play.revieww.ch';

export const FREE_PLAN: Plan = {
  id: 'free',
  name: 'Free',
  price: 0,
  currency: 'CHF',
  spinsPerMonth: 30,
  spinsLabel: '30 spins offerts',
  contactsLimit: 30,
  contactsLabel: '30 contacts',
  description: 'Testez gratuitement',
  features: [
    'QR code personnalisé',
    'Roue personnalisable',
    '30 spins offerts',
    'Dashboard complet',
  ],
};

export const PAID_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    currency: 'CHF',
    spinsPerMonth: 50,
    spinsLabel: '50 spins/mois',
    contactsLimit: 200,
    contactsLabel: '200 contacts',
    description: 'Pour lancer votre collecte',
    features: [
      'Tout du plan Free',
      '50 spins/mois',
      '200 contacts en base',
      'Collecte d\'emails',
      'Export CSV',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 59,
    currency: 'CHF',
    spinsPerMonth: 250,
    spinsLabel: '250 spins/mois',
    contactsLimit: 1000,
    contactsLabel: '1\'000 contacts',
    description: 'Le plus populaire',
    popular: true,
    features: [
      'Tout du plan Starter',
      '250 spins/mois',
      '1\'000 contacts en base',
      'Multi-établissements',
      'Dashboard partagé',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 89,
    currency: 'CHF',
    spinsPerMonth: 999999,
    spinsLabel: 'Spins illimités',
    contactsLimit: 999999,
    contactsLabel: 'Contacts illimités',
    description: 'Sans limites',
    features: [
      'Tout du plan Growth',
      'Spins illimités',
      'Contacts illimités',
      'Multi-établissements dégressif',
      'Support prioritaire',
    ],
  },
];

export const PLANS: Plan[] = [FREE_PLAN, ...PAID_PLANS];

export const PLAN_SPIN_LIMITS: Record<string, number> = {
  free: 30,
  starter: 50,
  growth: 250,
  pro: 999999,
};

export const PLAN_CONTACT_LIMITS: Record<string, number> = {
  free: 30,
  starter: 200,
  growth: 1000,
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
    cta: 'Commencer gratuitement',
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
    subtitle: 'Commencez gratuitement · Sans engagement · Annulable à tout moment',
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
    waitingMessages: [
      '📝 Écrivez quelques mots sur votre expérience...',
      '⭐ N\'oubliez pas de choisir vos étoiles !',
      '👍 Presque fini...',
      '✨ Parfait, vous pouvez revenir !',
    ],
    waitingStatus: 'En cours...',
    starsQuestion: 'Combien d\'étoiles avez-vous donné ?',
    confirmButton: 'J\'ai laissé mon avis',
    emailTitle: 'Merci pour votre avis !',
    emailPlaceholder: 'Entrez votre email pour recevoir votre cadeau',
    phonePlaceholder: 'Téléphone (optionnel)',
    optIn: 'J\'accepte de recevoir des offres de',
    spinButton: 'Tourner la roue !',
    wonTitle: 'Félicitations !',
    wonSubtitle: 'Vous avez gagné :',
    wonInstruction: 'Présentez ce code en caisse',
    validationCode: 'Votre code de validation',
    lostTitle: 'Pas de chance cette fois !',
    lostSubtitle: 'Revenez bientôt',
    quotaReached: 'Merci de votre intérêt ! Revenez bientôt',
    paused: 'Cette roue est en pause',
    alreadyPlayed: 'Vous avez déjà participé récemment !',
    lotteryWelcome: 'Tournez la roue et tentez de gagner un cadeau !',
    lotteryCta: 'Tourner la roue !',
    lockedTitle: 'Vous avez gagné !',
    lockedSubtitle: 'Laissez un avis Google pour débloquer votre cadeau !',
    lockedCta: 'Laisser un avis Google',
    lostLockedTitle: 'Pas de chance cette fois...',
    lostLockedSubtitle: 'Mais vous pouvez quand même nous aider !',
    lostLockedCta: 'Laisser un avis Google',
    lostLockedSkip: 'Continuer sans avis',
    lostEmailTitle: 'Merci !',
    lostEmailSubtitle: 'Laissez votre email pour être informé de nos prochaines offres',
    lostEmailCta: 'Valider',
    noReviewEmailTitle: 'Vous avez gagné !',
    noReviewEmailSubtitle: 'Entrez votre email pour recevoir votre cadeau',
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
  dashboardValidate: {
    title: 'Valider un lot',
    subtitle: 'Scannez le QR code du client ou entrez son code',
    placeholder: 'Ex: RW-ABCD',
    shareTitle: 'Lien rapide',
    shareDesc: 'Sauvegardez ce lien pour valider les lots depuis votre téléphone',
  },
  validate: {
    title: 'Validation du lot',
    prize: 'Lot gagné',
    email: 'Email du client',
    date: 'Date du gain',
    claim: 'Marquer comme réclamé',
    claimed: 'Lot déjà réclamé',
    claimedAt: 'Réclamé le',
    expired: 'Ce lot a expiré',
    notFound: 'Code introuvable',
    notFoundDescription: 'Ce code de validation n\'existe pas ou a été supprimé.',
    loginRequired: 'Connectez-vous pour valider ce lot',
    loginButton: 'Se connecter',
    notOwner: 'Vous n\'êtes pas le propriétaire de ce commerce',
    success: 'Lot marqué comme réclamé !',
    validFor: 'Valable 7 jours',
  },
  onboarding: {
    step1Title: 'Trouvez votre commerce',
    step1Placeholder: 'Tapez le nom de votre commerce...',
    step1Confirm: 'C\'est bien votre commerce ?',
    step1Fallback: 'Coller un lien Google Review manuellement',
    step2Title: 'Configurez votre roue',
    step2Subtitle: 'Choisissez des lots pour vos clients',
    howItWorksTitle: 'Comment ça marche',
    prizesTitle: 'Configurez vos lots',
    prizesSubtitle: 'Choisissez les récompenses pour vos clients',
    summaryTitle: 'Votre QR code est prêt !',
    summarySubtitle: 'Partagez-le pour commencer à collecter des avis',
    flowTitle: 'Choisissez le mode de jeu',
    flowSubtitle: 'Comment vos clients interagissent avec la roue',
    flowLotteryFirstLabel: 'Loterie d\'abord',
    flowLotteryFirstDesc: 'Le client tourne la roue, puis laisse un avis Google pour débloquer son lot.',
    flowReviewFirstLabel: 'Avis d\'abord',
    flowReviewFirstDesc: 'Le client laisse un avis Google, puis tourne la roue pour découvrir son lot.',
    flowRecommended: 'Recommandé',
  },
};
