-- ============================================================
-- Add free plan support
-- ============================================================

-- Add 'free' to plan_type enum
ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'free' BEFORE 'starter';

-- Add 'free' to subscription_status enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'free' BEFORE 'active';

-- Add contact_limit column
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS contact_limit INTEGER NOT NULL DEFAULT 30;

-- Update default plan to free
ALTER TABLE businesses
  ALTER COLUMN plan_type SET DEFAULT 'free',
  ALTER COLUMN subscription_status SET DEFAULT 'free',
  ALTER COLUMN monthly_spin_limit SET DEFAULT 30;
