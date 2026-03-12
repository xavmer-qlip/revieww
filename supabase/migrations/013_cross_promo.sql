-- Cross-promo: network feature between merchants in the same city
-- ----------------------------------------------------------------

-- 1a. New columns on businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cross_promo_enabled BOOLEAN DEFAULT FALSE;

-- 1b. Cross-promo offers table
CREATE TABLE IF NOT EXISTS cross_promo_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES wheel_segments(id) ON DELETE CASCADE,
  monthly_stock INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(segment_id)
);
CREATE INDEX IF NOT EXISTS idx_cpo_business ON cross_promo_offers(business_id);

-- 1c. Cross-promo prizes table
CREATE TABLE IF NOT EXISTS cross_promo_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spin_id UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,
  source_business_id UUID NOT NULL REFERENCES businesses(id),
  partner_business_id UUID NOT NULL REFERENCES businesses(id),
  offer_id UUID NOT NULL REFERENCES cross_promo_offers(id),
  prize_label TEXT NOT NULL,
  prize_emoji TEXT,
  validation_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cpp_partner ON cross_promo_prizes(partner_business_id);
CREATE INDEX IF NOT EXISTS idx_cpp_source ON cross_promo_prizes(source_business_id);
CREATE INDEX IF NOT EXISTS idx_cpp_validation ON cross_promo_prizes(validation_code);
CREATE INDEX IF NOT EXISTS idx_cpp_offer_month ON cross_promo_prizes(offer_id, created_at);

-- 1d. RLS policies

-- cross_promo_offers
ALTER TABLE cross_promo_offers ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own offers
CREATE POLICY "Owner can manage own offers"
  ON cross_promo_offers
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Partners can read active offers from same city, different sector
CREATE POLICY "Partners can read eligible offers"
  ON cross_promo_offers
  FOR SELECT
  USING (
    is_active = true
    AND business_id IN (
      SELECT b.id FROM businesses b
      WHERE b.cross_promo_enabled = true
        AND b.city IS NOT NULL
        AND b.city IN (
          SELECT city FROM businesses WHERE user_id = auth.uid() AND cross_promo_enabled = true
        )
    )
  );

-- cross_promo_prizes
ALTER TABLE cross_promo_prizes ENABLE ROW LEVEL SECURITY;

-- Source or partner business owner can read prizes
CREATE POLICY "Business owners can read related prizes"
  ON cross_promo_prizes
  FOR SELECT
  USING (
    source_business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    OR partner_business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Service role handles INSERT/UPDATE (via API)
