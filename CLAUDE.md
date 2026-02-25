# woopla — spin & win

## What is this?
SaaS MVP helping restaurants/shops get more Google reviews through gamification.
Flow: Customer scans QR code → leaves Google review → spins wheel of fortune → wins a prize.
Merchant gets the customer's email for marketing.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Components)
- **Styling**: Tailwind CSS v4 with `@theme inline` tokens in `globals.css`
- **Animations**: `motion/react` (import as `import { motion } from 'motion/react'`, NOT `framer-motion`)
- **Auth + DB**: Supabase (PostgreSQL, Auth, Row Level Security, SSR client)
- **Payments**: Stripe (Checkout Sessions, Customer Portal, Webhooks, 7-day trial)
- **Fonts**: Geom (display) + DM Sans (body) via `next/font/google`
- **Icons**: lucide-react
- **Language**: French (fr_CH locale)
- **Currency**: CHF (Swiss Francs)

## Design System
- **Full documentation**: See `design-system.md` at project root
- **Logo**: "woopla", unicolor bold, no star/icon, animated 2 "oo" (rotateX slot-machine spin with stagger)
- **Landing page**: Dark theme (`#0b0f1a` bg) with "Summer Breeze" palette:
  - Coral `#F88379` (primary accent, CTAs, highlights)
  - Yellow `#FFEB3B` (secondary accent, energy)
  - Sky Blue `#82C8E5` (tertiary, trust elements)
  - Sand/Beige `#E6D8C4` (subtle warmth)
- **Dashboard**: Light theme with dark sidebar (`#0F1729`)
- **Play page** (client-facing): Mobile-only, simple, white/light
- **Color tokens** for landing page are in `src/app/page.tsx` as `const C = {...}`
- **Global CSS tokens** in `src/app/globals.css` under `@theme` (NOT `@theme inline` — variables must be available)
- **Copywriting rules**: No fake stats. Onboarding = "1 minute". Tone = direct, concret, pas de jargon.

## Key Architecture Decisions
- **Tailwind v4**: Uses `@layer base` for custom styles (NOT bare selectors — they override utility classes)
- **Stripe lazy init**: `getStripe()` in `src/lib/stripe.ts` (not top-level `new Stripe()` which crashes without env vars)
- **Supabase middleware**: Early return guard if env vars missing (`src/lib/supabase/middleware.ts`)
- **Service client**: `createServiceClient()` for server-side operations that bypass RLS (spin recording)
- **Anti-cheat**: localStorage cookie — 1 spin per device per business per week
- **Review verification**: Page Visibility API to detect time on Google, confidence scoring
- **Monthly stock**: `wheel_segments.monthly_stock` (0 = unlimited). Spin API filters out exhausted segments before picking.
- **Sector presets**: `SECTOR_PRESETS` in constants.ts — onboarding auto-detects sector from Google category
- **Dashboard activation**: `isFirstTime` (0 total spins) shows ActivationHero + blurred stats

## Project Structure
```
src/
├── app/
│   ├── page.tsx              # Landing page (dark + lime néon)
│   ├── layout.tsx            # Root layout (fonts, metadata)
│   ├── globals.css           # Tailwind v4 theme tokens
│   ├── (auth)/
│   │   ├── layout.tsx        # Split-screen auth layout
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── onboarding/page.tsx   # 3-step flow (how-it-works → sector presets + stock → QR ready)
│   ├── dashboard/
│   │   ├── layout.tsx        # Server layout (fetches user/business)
│   │   ├── page.tsx          # Overview (server component)
│   │   ├── wheel/page.tsx    # Wheel editor
│   │   ├── qrcode/page.tsx   # QR code generation
│   │   ├── clients/page.tsx  # Contacts table
│   │   ├── settings/page.tsx
│   │   ├── billing/page.tsx
│   │   └── messages/page.tsx # Placeholder "coming soon"
│   ├── play/[slug]/page.tsx  # Client-facing play flow
│   ├── api/
│   │   ├── spin/route.ts
│   │   ├── stripe/
│   │   │   ├── create-checkout/route.ts
│   │   │   ├── create-portal/route.ts
│   │   │   └── change-plan/route.ts
│   │   └── webhooks/stripe/route.ts
├── components/
│   ├── ui/                   # Primitives (Button, Input, Card, Badge, Logo)
│   ├── dashboard/            # Sidebar, Topbar, Shell, Overview, ClientsTable, BillingClient
│   ├── wheel/                # WheelCanvas, EmojiExplosion
│   └── play/                 # PlayFlow (3-step mobile flow)
├── lib/
│   ├── types.ts              # Business, WheelSegment (w/ monthly_stock), Spin, Plan, PlanType
│   ├── constants.ts          # PLANS, TEXTS, SECTOR_PRESETS, mapGoogleCategoryToSector()
│   ├── utils.ts              # cn(), pickWeightedSegment(), slugify(), etc.
│   ├── stripe.ts             # Lazy Stripe init via getStripe()
│   └── supabase/
│       ├── client.ts         # Browser client
│       ├── server.ts         # Server client + createServiceClient()
│       └── middleware.ts     # Auth middleware with env guard
└── middleware.ts             # Next.js middleware
```

## Pricing Plans
| Plan    | Price    | Spins/month |
|---------|----------|-------------|
| Starter | 19 CHF   | 50          |
| Growth  | 39 CHF   | 200         |
| Pro     | 79 CHF   | Unlimited   |

All plans include 7-day free trial. Free plan: 30 spins lifetime, 30 contacts.

## Two Distinct UIs
1. **Merchant dashboard** (`/dashboard/*`): Desktop-friendly, feature-rich, sidebar nav
2. **Client play page** (`/play/[slug]`): Mobile-only, 3-step flow, minimal UI

## Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_GROWTH=
STRIPE_PRICE_PRO=
GOOGLE_PLACES_API_KEY=
```

## Common Gotchas
- Import motion from `motion/react`, not `framer-motion`
- Never use bare CSS selectors outside `@layer base` — they override Tailwind v4 utilities
- Use `@theme` (NOT `@theme inline`) in globals.css — `@theme inline` prevents CSS variables from existing
- Stripe client must be lazy-loaded (`getStripe()`) — no top-level init
- Supabase middleware needs env var guard or build crashes
- Landing page primary accent is coral `#F88379` — button text is white on coral
- All user-facing text is in French
