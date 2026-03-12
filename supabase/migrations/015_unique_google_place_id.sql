-- Prevent duplicate Google My Business registrations.
-- A given google_place_id can only be linked to one business.
-- NULL values are allowed (not all businesses have a Google listing).

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_google_place_id
  ON businesses (google_place_id)
  WHERE google_place_id IS NOT NULL;
