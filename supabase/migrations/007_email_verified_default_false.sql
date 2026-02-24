-- Resend is now integrated: new businesses start unverified
ALTER TABLE businesses ALTER COLUMN email_verified SET DEFAULT false;
