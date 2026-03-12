-- Fix: add ON DELETE CASCADE to cross_promo_prizes FK on source/partner business

ALTER TABLE cross_promo_prizes
  DROP CONSTRAINT IF EXISTS cross_promo_prizes_source_business_id_fkey,
  DROP CONSTRAINT IF EXISTS cross_promo_prizes_partner_business_id_fkey,
  DROP CONSTRAINT IF EXISTS cross_promo_prizes_offer_id_fkey;

ALTER TABLE cross_promo_prizes
  ADD CONSTRAINT cross_promo_prizes_source_business_id_fkey
    FOREIGN KEY (source_business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  ADD CONSTRAINT cross_promo_prizes_partner_business_id_fkey
    FOREIGN KEY (partner_business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  ADD CONSTRAINT cross_promo_prizes_offer_id_fkey
    FOREIGN KEY (offer_id) REFERENCES cross_promo_offers(id) ON DELETE CASCADE;
