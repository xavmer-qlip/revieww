-- ============================================================
-- revieww — Initial schema
-- Tables: businesses, wheel_segments, spins
-- ============================================================

-- Custom types
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'expired'
);

CREATE TYPE plan_type AS ENUM (
  'starter', 'growth', 'pro'
);

-- ============================================================
-- businesses
-- ============================================================
CREATE TABLE businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  google_review_link    TEXT,
  google_place_id       TEXT,
  google_rating         NUMERIC(2, 1),
  google_review_count   INTEGER NOT NULL DEFAULT 0,
  google_business_category TEXT,
  logo_url      TEXT,
  primary_color TEXT NOT NULL DEFAULT '#FF6B35',
  secondary_color TEXT NOT NULL DEFAULT '#1B2A4A',
  address       TEXT,
  phone         TEXT,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  subscription_status   subscription_status NOT NULL DEFAULT 'trialing',
  plan_type     plan_type NOT NULL DEFAULT 'starter',
  monthly_spin_limit    INTEGER NOT NULL DEFAULT 50,
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
-- Index for slug lookups (play page)
CREATE INDEX idx_businesses_slug ON businesses(slug);
-- Index for Stripe subscription lookups (webhooks)
CREATE INDEX idx_businesses_stripe_sub ON businesses(stripe_subscription_id);

-- ============================================================
-- wheel_segments
-- ============================================================
CREATE TABLE wheel_segments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  emoji         TEXT NOT NULL DEFAULT '',
  probability   INTEGER NOT NULL DEFAULT 0,
  color         TEXT NOT NULL DEFAULT '#78909C',
  position      INTEGER NOT NULL DEFAULT 0,
  is_winning    BOOLEAN NOT NULL DEFAULT true,
  promo_code    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wheel_segments_business ON wheel_segments(business_id);

-- ============================================================
-- spins
-- ============================================================
CREATE TABLE spins (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id           UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  phone                 TEXT,
  segment_id            UUID REFERENCES wheel_segments(id) ON DELETE SET NULL,
  prize_label           TEXT NOT NULL,
  prize_emoji           TEXT,
  is_winner             BOOLEAN NOT NULL DEFAULT false,
  claimed               BOOLEAN NOT NULL DEFAULT false,
  opted_in_marketing    BOOLEAN NOT NULL DEFAULT false,
  device_fingerprint    TEXT,
  confidence_score      NUMERIC(5, 2) NOT NULL DEFAULT 0,
  time_on_google_seconds INTEGER,
  self_reported_stars   INTEGER CHECK (self_reported_stars BETWEEN 1 AND 5),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spins_business ON spins(business_id);
CREATE INDEX idx_spins_business_created ON spins(business_id, created_at DESC);
CREATE INDEX idx_spins_email_business ON spins(email, business_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;

-- businesses: owner can CRUD their own
CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);

-- wheel_segments: owner of the business can CRUD
CREATE POLICY "Users can view own segments"
  ON wheel_segments FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own segments"
  ON wheel_segments FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own segments"
  ON wheel_segments FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own segments"
  ON wheel_segments FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- spins: anon can read business data for play page (via service role)
-- Owner can read spins for their business
CREATE POLICY "Users can view own spins"
  ON spins FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Note: spin INSERT is done via service role (createServiceClient) to bypass RLS,
-- because anonymous players (not logged in) trigger spins via the API.
-- The spin API route validates inputs server-side before inserting.
