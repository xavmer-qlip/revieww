ALTER TABLE businesses
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN verification_token UUID NOT NULL DEFAULT gen_random_uuid();
