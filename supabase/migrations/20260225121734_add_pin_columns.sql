ALTER TABLE businesses
  ADD COLUMN require_pin boolean NOT NULL DEFAULT true,
  ADD COLUMN daily_pin text DEFAULT NULL,
  ADD COLUMN pin_updated_at timestamptz DEFAULT NULL;
