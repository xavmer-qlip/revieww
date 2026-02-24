-- Add flow_type enum and column to businesses
CREATE TYPE flow_type AS ENUM ('review_first', 'lottery_first');
ALTER TABLE businesses ADD COLUMN flow_type flow_type NOT NULL DEFAULT 'lottery_first';

-- Existing businesses keep current behavior
UPDATE businesses SET flow_type = 'review_first';
