-- Set all existing businesses as verified (no email service configured yet)
UPDATE businesses SET email_verified = true WHERE email_verified = false;

-- Change default to true until email sending is integrated
ALTER TABLE businesses ALTER COLUMN email_verified SET DEFAULT true;
