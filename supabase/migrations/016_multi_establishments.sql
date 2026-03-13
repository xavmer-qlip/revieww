-- ============================================================================
-- Migration 016: Multi-établissements (Chaînes / Groupes)
-- ============================================================================

-- 1. business_groups table
CREATE TABLE business_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bg_owner ON business_groups(owner_user_id);

ALTER TABLE business_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages groups" ON business_groups FOR ALL
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- 2. Add group_id column to businesses
ALTER TABLE businesses ADD COLUMN group_id UUID REFERENCES business_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_businesses_group ON businesses(group_id);

-- 3. group_shared_offers table
CREATE TABLE group_shared_offers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  segment_id    UUID NOT NULL REFERENCES wheel_segments(id) ON DELETE CASCADE,
  monthly_stock INTEGER NOT NULL DEFAULT 10,
  is_active     BOOLEAN DEFAULT TRUE,
  share_with    TEXT NOT NULL DEFAULT 'all',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(segment_id)
);

CREATE INDEX idx_gso_business ON group_shared_offers(business_id);

ALTER TABLE group_shared_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages group offers" ON group_shared_offers FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Group members read offers" ON group_shared_offers FOR SELECT
  USING (is_active AND business_id IN (
    SELECT id FROM businesses WHERE group_id IN (
      SELECT group_id FROM businesses WHERE user_id = auth.uid() AND group_id IS NOT NULL
    )
  ));

-- 4. group_prizes table
CREATE TABLE group_prizes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spin_id               UUID NOT NULL REFERENCES spins(id) ON DELETE CASCADE,
  source_business_id    UUID NOT NULL REFERENCES businesses(id),
  prize_business_id     UUID NOT NULL REFERENCES businesses(id),
  offer_id              UUID NOT NULL REFERENCES group_shared_offers(id),
  prize_label           TEXT NOT NULL,
  prize_emoji           TEXT,
  validation_code       TEXT NOT NULL UNIQUE,
  expires_at            TIMESTAMPTZ NOT NULL,
  claimed               BOOLEAN DEFAULT FALSE,
  claimed_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gp_prize_biz ON group_prizes(prize_business_id);
CREATE INDEX idx_gp_source_biz ON group_prizes(source_business_id);
CREATE INDEX idx_gp_validation ON group_prizes(validation_code);
CREATE INDEX idx_gp_offer_month ON group_prizes(offer_id, created_at);

ALTER TABLE group_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Related owners read group prizes" ON group_prizes FOR SELECT
  USING (
    source_business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    OR prize_business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- Service role needs full access for spin confirm
CREATE POLICY "Service inserts group prizes" ON group_prizes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service updates group prizes" ON group_prizes FOR UPDATE
  USING (true)
  WITH CHECK (true);
