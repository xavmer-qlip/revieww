-- Allow anonymous users to read verified businesses (for play page)
CREATE POLICY "Public read verified businesses"
  ON businesses FOR SELECT
  USING (email_verified = true);

-- Allow anonymous users to read segments of verified businesses (for play page)
CREATE POLICY "Public read segments of verified businesses"
  ON wheel_segments FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE email_verified = true
    )
  );
