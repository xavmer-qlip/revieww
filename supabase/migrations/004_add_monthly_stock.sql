-- Add monthly stock per segment (0 = unlimited)
ALTER TABLE wheel_segments ADD COLUMN monthly_stock INTEGER NOT NULL DEFAULT 0;

-- Index for counting segment wins per month
CREATE INDEX idx_spins_segment_month ON spins(segment_id, created_at DESC);
