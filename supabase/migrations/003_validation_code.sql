-- Add validation code and claimed_at to spins table
ALTER TABLE spins
  ADD COLUMN validation_code TEXT UNIQUE,
  ADD COLUMN claimed_at TIMESTAMPTZ;

-- Partial index on non-null validation codes for fast lookups
CREATE INDEX idx_spins_validation_code ON spins (validation_code)
  WHERE validation_code IS NOT NULL;
