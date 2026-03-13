export interface Business {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  google_review_link: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number;
  google_business_category: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  created_at: string;
  updated_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  plan_type: PlanType;
  monthly_spin_limit: number;
  contact_limit: number;
  trial_ends_at: string;
  flow_type: FlowType;
  require_review: boolean;
  prize_validity_days: number;
  onboarding_completed: boolean;
  email_verified: boolean;
  require_pin: boolean;
  daily_pin: string | null;
  pin_updated_at: string | null;
  city: string | null;
  cross_promo_enabled: boolean;
  group_id: string | null;
}

export interface WheelSegment {
  id: string;
  business_id: string;
  label: string;
  emoji: string;
  probability: number;
  color: string;
  position: number;
  is_winning: boolean;
  promo_code: string | null;
  monthly_stock: number;
  created_at: string;
}

export interface Spin {
  id: string;
  business_id: string;
  email: string;
  phone: string | null;
  segment_id: string | null;
  prize_label: string;
  prize_emoji: string | null;
  is_winner: boolean;
  claimed: boolean;
  opted_in_marketing: boolean;
  device_fingerprint: string | null;
  validation_code: string | null;
  claimed_at: string | null;
  confidence_score: number;
  time_on_google_seconds: number | null;
  self_reported_stars: number | null;
  created_at: string;
}

export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type FlowType = 'review_first' | 'lottery_first';

export type PlanType = 'free' | 'starter' | 'growth' | 'pro';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  currency: string;
  spinsPerMonth: number;
  spinsLabel: string;
  contactsLimit: number;
  contactsLabel: string;
  description: string;
  popular?: boolean;
  features?: string[];
}

export interface BusinessGroup {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface GroupSharedOffer {
  id: string;
  business_id: string;
  segment_id: string;
  monthly_stock: number;
  is_active: boolean;
  share_with: string;
  created_at: string;
}

export interface GroupPrize {
  id: string;
  spin_id: string;
  source_business_id: string;
  prize_business_id: string;
  offer_id: string;
  prize_label: string;
  prize_emoji: string | null;
  validation_code: string;
  expires_at: string;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

export interface CrossPromoOffer {
  id: string;
  business_id: string;
  segment_id: string;
  monthly_stock: number;
  is_active: boolean;
  created_at: string;
}

export interface CrossPromoPrize {
  id: string;
  spin_id: string;
  source_business_id: string;
  partner_business_id: string;
  offer_id: string;
  prize_label: string;
  prize_emoji: string | null;
  validation_code: string;
  expires_at: string;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}
