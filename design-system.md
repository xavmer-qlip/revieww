# revieww — Design System

> Document de référence pour toutes les décisions visuelles et UX du projet.
> Dernière mise à jour : février 2026.

---

## 1. Identité de marque

### Nom
**revieww** — toujours en minuscule, 2 "w" (review + w).

### Logo
- Texte seul, unicolor, **bold** (font-display `font-extrabold`)
- Pas d'icône, pas d'étoile, pas de tagline
- Le 2e "w" porte une **animation rotative 3D** (rotateY 360°) style lottery/spin, déclenchée périodiquement
- Variantes : `light` (blanc) pour fonds sombres, `dark` (text color) pour fonds clairs
- Tailles : `sm` (text-xl), `md` (text-2xl), `lg` (text-4xl), `xl` (text-6xl)
- Composant : `src/components/ui/logo.tsx`

### Tagline
"review & win" — utilisé uniquement dans les métadonnées SEO, **jamais affiché dans l'UI**.

---

## 2. Couleurs

### Palette "Summer Breeze"

| Token                | Hex         | Usage                                       |
|----------------------|-------------|---------------------------------------------|
| `--color-primary`    | `#F88379`   | Coral — CTAs, accents principaux, liens      |
| `--color-primary-light` | `#fab5af` | Coral clair — hover states, backgrounds légers |
| `--color-primary-dark` | `#e66a5f`  | Coral foncé — hover sur boutons primaires    |
| `--color-secondary`  | `#1B2A4A`  | Bleu nuit — sidebar, éléments structurels    |
| `--color-accent`     | `#FFEB3B`  | Jaune vif — badges, étoiles, highlights      |
| `--color-accent-light` | `#fff176` | Jaune clair — backgrounds subtils            |
| `--color-sky`        | `#82C8E5`  | Bleu ciel — éléments de confiance, tertiaire |
| `--color-sand`       | `#E6D8C4`  | Sable/beige — warmth subtile                 |

### Couleurs fonctionnelles

| Token                | Hex         | Usage                                       |
|----------------------|-------------|---------------------------------------------|
| `--color-success`    | `#10B981`  | Vert — validation, tendances positives       |
| `--color-warning`    | `#F59E0B`  | Orange — alertes, quotas élevés              |
| `--color-danger`     | `#EF4444`  | Rouge — erreurs, suppressions                |

### Couleurs de surface

| Token                | Hex         | Usage                                       |
|----------------------|-------------|---------------------------------------------|
| `--color-background` | `#FAFAF8`  | Fond global (pages light/dashboard)          |
| `--color-surface`    | `#FFFFFF`  | Cartes, inputs, éléments surélevés           |
| `--color-text`       | `#1A1A2E`  | Texte principal                              |
| `--color-text-muted` | `#6B7280`  | Texte secondaire, labels, placeholders       |
| `--color-border`     | `#E5E7EB`  | Bordures, séparateurs                        |
| `--color-sidebar`    | `#0F1729`  | Sidebar dashboard                            |

### Landing page (thème sombre)

La landing page utilise son propre système de couleurs via un objet `C` local :

```typescript
const C = {
  bg: '#0b0f1a',           // Fond principal
  surface: '#111827',       // Cartes / sections alternées
  surfaceLight: '#1a2236',  // Éléments surélevés
  border: '#1e293b',        // Bordures
  text: '#f8fafc',          // Texte principal (blanc)
  muted: '#94a3b8',         // Texte secondaire
  coral: '#F88379',         // = primary
  yellow: '#FFEB3B',        // = accent
  sky: '#82C8E5',           // = sky
  sand: '#E6D8C4',          // = sand
  green: '#34d399',         // Validation / tendances
};
```

Les couleurs d'accent (coral, yellow, sky, sand) sont **identiques** entre les deux thèmes. Seuls les fonds et textes changent.

---

## 3. Typographie

### Polices

| Rôle     | Police     | Variable CSS        | Classe Tailwind  |
|----------|------------|---------------------|------------------|
| Display  | **Geom**   | `--font-geom`       | `font-display`   |
| Body     | **DM Sans**| `--font-dm-sans`    | `font-body`      |

### Hiérarchie

| Élément         | Font     | Weight       | Classe Tailwind                    |
|-----------------|----------|--------------|------------------------------------|
| H1 (hero)       | Display  | 800          | `font-display font-extrabold`      |
| H2 (sections)   | Display  | 800          | `font-display font-extrabold`      |
| H3 (cards)      | Display  | 700          | `font-display font-bold`           |
| Sous-titres     | Display  | 600          | `font-display font-semibold`       |
| Body text       | Body     | 400          | `font-body`                        |
| Body emphasis   | Body     | 600          | `font-body font-semibold`          |
| Labels          | Display  | 500-600      | `font-display font-medium`         |
| Small / captions| Body     | 400          | `font-body text-[13px]`            |
| Boutons         | Display  | 600-700      | `font-display font-semibold/bold`  |

### Tailles de texte courantes

- Hero H1 : `text-[clamp(2.4rem,5.5vw,4.2rem)]`
- Section H2 : `text-3xl sm:text-4xl lg:text-5xl`
- Card H3 : `text-lg` ou `text-base`
- Body : `text-[15px]` à `text-[17px]`
- Caption / muted : `text-[13px]`
- Micro : `text-[11px]`

---

## 4. Espacement & Layout

### Conteneur principal
- Max width : `max-w-6xl` (1152px)
- Padding horizontal : `px-6`
- Centré : `mx-auto`

### Sections
- Padding vertical : `py-28 sm:py-36` (landing)
- Padding vertical (compact) : `py-20` (stats, séparateurs)
- Gap entre sections : pas d'espace explicit, chaque section a son propre padding

### Grilles
- 3 colonnes : `grid md:grid-cols-3 gap-6`
- 2 colonnes : `grid sm:grid-cols-2 gap-6`
- Pricing : `grid md:grid-cols-3 gap-5 max-w-4xl mx-auto`

### Cartes
- Border radius : `rounded-2xl`
- Padding : `p-7` (standard), `p-8` (large)
- Border : `border border-border` (light) ou `border` + inline `borderColor` (dark)

---

## 5. Composants UI

### Button (`src/components/ui/button.tsx`)

| Variant     | Style                                                    |
|-------------|----------------------------------------------------------|
| `primary`   | `bg-primary text-white` + shadow coral                   |
| `secondary` | `bg-secondary text-white` + shadow                       |
| `outline`   | `border-2 border-border text-text` → hover coral         |
| `ghost`     | Transparent, text muted → hover text                     |
| `danger`    | `bg-danger text-white`                                   |

| Size | Padding          | Border radius |
|------|------------------|---------------|
| `sm` | `px-4 py-2`      | `rounded-xl`  |
| `md` | `px-6 py-3`      | `rounded-2xl` |
| `lg` | `px-8 py-4`      | `rounded-2xl` |
| `xl` | `px-10 py-5`     | `rounded-full`|

- Hover : `scale-[1.02]`
- Active : `scale-[0.98]`
- Loading : spinner SVG animé
- Font : `font-display font-semibold`

### Input (`src/components/ui/input.tsx`)
- Background : `bg-surface`
- Border : `border-border` → focus `border-primary ring-2 ring-primary/30`
- Border radius : `rounded-2xl`
- Padding : `px-4 py-3`
- Icon : positionné à gauche, `pl-10` quand présent
- Error state : `border-danger`

### Card (`src/components/ui/card.tsx`)
- Background : `bg-surface`
- Border : `border-border/50`
- Shadow : `shadow-sm`, hover optionnel `shadow-lg`
- Border radius : `rounded-2xl`

### Badge (`src/components/ui/badge.tsx`)
- Shape : `rounded-full`
- Font : `font-display font-semibold`
- Variants : default, primary, success, warning, danger, muted

---

## 6. Thèmes par page

### Landing page (`/`)
- **Thème sombre** : fond `#0b0f1a`, texte blanc
- Couleurs d'accent sur fond sombre (coral sur dark = très contrasté)
- Blobs lumineux animés en arrière-plan (blur-[150px], opacity faible)
- Grille subtile en overlay (`opacity-[0.03]`)
- Alternance de sections `bg` / `surface` pour rythme visuel
- CTAs : boutons `rounded-full` avec `shadow` coral

### Auth pages (`/login`, `/signup`)
- **Split screen** : gauche sombre (gradient #0F1729 → #1B2A4A), droite blanche
- Gauche : orbes flottantes animées, témoignage client, logo light
- Droite : formulaire sur fond blanc, logo dark (mobile)
- Inputs : `rounded-2xl`, fond blanc, bordure subtle

### Dashboard (`/dashboard/*`)
- **Thème clair** : fond `#FAFAF8`, cartes blanches
- Sidebar sombre (`#0F1729`) avec nav items
- Couleur active sidebar : barre verticale coral à gauche
- Topbar mobile avec blur backdrop
- Cartes avec `shadow-sm` et `border-border/50`

### Onboarding (`/onboarding`)
- **Thème clair** : fond `#FAFAF8`
- Flow en 3 étapes avec progress indicator animé
- Cards sélectionnables avec `border-primary` quand actives
- Transitions slide (spring) entre étapes

### Play page (`/play/[slug]`)
- **Thème clair / blanc** : mobile-only
- Couleurs personnalisables par commerce (CSS variables)
- Flow en 5 étapes : welcome → vérification → email → roue → résultat
- Roue SVG animée avec confettis

---

## 7. Animations

### Framework
**motion/react** (anciennement framer-motion) — import : `import { motion } from 'motion/react'`

### Patterns récurrents

| Pattern              | Usage                                    | Propriétés                                            |
|----------------------|------------------------------------------|-------------------------------------------------------|
| Fade up              | Apparition de sections                   | `initial={{ opacity: 0, y: 30 }}` → `animate/whileInView` |
| Scale hover          | Cartes, boutons                          | `whileHover={{ scale: 1.02-1.04, y: -4 }}`           |
| Spring               | Éléments interactifs                     | `type: 'spring', stiffness: 300-400, damping: 15-25`  |
| Staggered children   | Listes, grilles                          | `delay: i * 0.1-0.15`                                 |
| Floating             | Phones, éléments hero                    | `animate={{ y: [0, -10, 0] }}` repeat Infinity        |
| Count up             | Compteurs, stats                         | `useMotionValue` + `useTransform` + `animate`         |
| Slide (onboarding)   | Transitions entre étapes                 | `x: ±300`, spring transition                          |
| Rotate (logo W)      | Logo 2e W                                | `rotateY: [0, 360]`, repeat, easeInOut                |
| Pulse ring           | Indicateurs actifs                       | `scale: [1, 1.4]`, `opacity: [0.5, 0]`, repeat       |

### Timing
- Durée standard : `0.4-0.6s`
- Durée longue (sections) : `0.7-1s`
- Ease par défaut : `[0.16, 1, 0.3, 1]` (custom ease-out)
- Navbar : `[0.32, 0.72, 0, 1]`
- `viewport: { once: true, margin: '-60px' à '-80px' }` pour les whileInView

---

## 8. Iconographie

### Bibliothèque
**lucide-react** — icônes outline, taille standard `w-4 h-4` ou `w-5 h-5`.

### Icônes clés
- QR Code : `QrCode`
- Étoiles : `Star` (fill pour étoiles pleines)
- Cadeau : `Gift`
- Validation : `Check`
- Flèche CTA : `ArrowRight`
- Email : `Mail`
- Navigation : `Menu`, `X`, `ChevronDown`, `ChevronRight`

### Emojis
Utilisés abondamment pour les lots de la roue et comme décoration :
- Commerces : 🍕 ☕ 💇 🎮 🏪 🍸 💆 🎂
- Lots : ☕ 🎂 💰 🎁 🍺
- Réseau local : 🍕 ☕ 💇 🎮 🍸 💆

---

## 9. Patterns UX

### Onboarding
- **1 minute** pour créer son compte et configurer
- Entrée du nom de commerce → API Google récupère automatiquement la fiche
- Lots guidés : l'outil recommande les probabilités et types de lots
- 3 étapes : Plan → Commerce → Roue

### Anti-triche (Play)
- Cookie localStorage : 1 spin par device/commerce/semaine
- Page Visibility API : détecte le temps passé sur Google
- Score de confiance automatique

### Phone mockups (Landing)
- Un seul téléphone central qui **cycle** entre 4 écrans en boucle
- Écrans : Scan QR → Interface Google Review → Roue → Résultat
- Boutons d'étape cliquables + indicateurs de progression
- Auto-avance toutes les 3.5 secondes

### Compteur d'avis (Landing)
- Compteur "en temps réel" qui s'incrémente aléatoirement (1-3 par intervalle)
- Intervalle : 4-10 secondes (aléatoire)
- Nombre de base : 12'847
- Animation count-up au scroll + live increment

---

## 10. Langue & Tons

### Langue
**Français** (locale `fr_CH`), devise **CHF**.

### Ton
- **Direct** : pas de jargon marketing creux
- **Concret** : des exemples, pas des promesses vagues
- **Pas de faux chiffres** : aucune stat inventée (pas de "+300 avis/mois", "x5 retour client")
- **Confiant mais humble** : on sait que ça marche, on ne survend pas

### Formules à utiliser
- "Transformez chaque client en ambassadeur"
- "Prêt en 1 minute"
- "Sans carte bancaire"
- "Annulable à tout moment"

### Formules à éviter
- Stats inventées ou exagérées
- "Révolutionnaire", "game-changer", "disruptif"
- Tout anglicisme inutile (sauf termes techniques : dashboard, QR code, etc.)

---

## 11. Structure des pages

```
Landing (/)
├── Navbar (fixed, blur on scroll, auto-hide on scroll down)
├── Hero (copy + phone mockup cycling)
├── Social Proof Marquee (défilant, types de commerces)
├── How It Works (3 cartes)
├── Review Counter (compteur live)
├── Features (4 piliers : onboarding, lots guidés, emails, dashboard)
├── Demo (roue interactive)
├── Local Vision (teaser réseau commerçants)
├── Pricing (3 plans)
├── FAQ (accordion)
├── Final CTA
└── Footer

Auth (/login, /signup)
├── Split screen (dark left / white right)
├── Logo + témoignage (left)
└── Form (right)

Onboarding (/onboarding)
├── Logo centered
├── Progress indicator (3 dots)
└── Card with steps (slide animation)

Dashboard (/dashboard/*)
├── Sidebar (dark, fixed left)
├── Topbar (mobile only)
└── Main content (light, scrollable)

Play (/play/[slug])
├── Business branding
└── 5-step flow (fullscreen mobile)
```

---

## 12. Responsive

### Breakpoints (Tailwind v4 defaults)
- `sm` : 640px
- `md` : 768px
- `lg` : 1024px
- `xl` : 1280px

### Adaptations clés
- **Landing** : grilles passent de 1 col (mobile) à 2-3 cols (desktop)
- **Navbar** : hamburger menu mobile, liens desktop
- **Dashboard** : sidebar cachée en mobile, overlay drawer
- **Play** : conçu mobile-first, pas de version desktop
- **Auth** : panel gauche caché en mobile (`hidden lg:flex`)

---

## 13. Fichiers de référence

| Fichier                          | Contenu                              |
|----------------------------------|--------------------------------------|
| `src/app/globals.css`            | Tokens CSS (Tailwind @theme)         |
| `src/app/layout.tsx`             | Fonts, metadata                      |
| `src/app/page.tsx`               | Landing page (dark theme, palette C) |
| `src/components/ui/logo.tsx`     | Composant Logo                       |
| `src/components/ui/button.tsx`   | Composant Button                     |
| `src/components/ui/input.tsx`    | Composant Input                      |
| `src/components/ui/card.tsx`     | Composant Card                       |
| `src/components/ui/badge.tsx`    | Composant Badge                      |
| `src/lib/constants.ts`           | Plans, textes, templates             |
| `src/lib/utils.ts`              | Utilitaires (cn, slugify, etc.)      |
