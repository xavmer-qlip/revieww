import { createServiceClient } from '@/lib/supabase/server';
import { PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS, mapGoogleCategoryToSector } from '@/lib/constants';
import { Business, WheelSegment } from '@/lib/types';
import { isInCrossPromoRegion } from '@/lib/utils';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Shared spin validation helpers
// ---------------------------------------------------------------------------

const HMAC_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';

interface ValidationResult {
  ok: true;
  business: Business;
  supabase: Awaited<ReturnType<typeof createServiceClient>>;
}

interface ValidationError {
  ok: false;
  error: string;
  status: number;
}

/**
 * Validate a business exists and has an active subscription.
 */
export async function validateBusinessForSpin(
  businessId: string
): Promise<ValidationResult | ValidationError> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!businessId || !uuidRegex.test(businessId)) {
    return { ok: false, error: 'Invalid businessId format', status: 400 };
  }

  const supabase = await createServiceClient();

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (bizError || !business) {
    return { ok: false, error: 'Business not found', status: 404 };
  }

  const typedBusiness = business as Business;

  const activeStatuses = ['active', 'trialing', 'free'];
  if (!activeStatuses.includes(typedBusiness.subscription_status)) {
    return { ok: false, error: 'subscription_inactive', status: 403 };
  }

  return { ok: true, business: typedBusiness, supabase };
}

/**
 * Check spin quotas (monthly for paid, lifetime for free).
 */
export async function checkSpinQuotas(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  business: Business
): Promise<ValidationError | null> {
  const isFree = business.plan_type === 'free';
  const now = new Date();
  const spinLimit =
    PLAN_SPIN_LIMITS[business.plan_type] ?? business.monthly_spin_limit;

  if (isFree) {
    const { count: totalSpins, error: countError } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id);

    if (countError) {
      return { ok: false, error: 'Internal server error', status: 500 };
    }
    if ((totalSpins ?? 0) >= spinLimit) {
      return { ok: false, error: 'free_limit_reached', status: 429 };
    }
  } else {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: monthlySpins, error: countError } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', startOfMonth.toISOString());

    if (countError) {
      return { ok: false, error: 'Internal server error', status: 500 };
    }
    if ((monthlySpins ?? 0) >= spinLimit) {
      return { ok: false, error: 'quota_reached', status: 429 };
    }
  }

  // Contact limit
  const contactLimit =
    PLAN_CONTACT_LIMITS[business.plan_type] ?? business.contact_limit ?? 30;

  const { count: uniqueContacts } = await supabase
    .from('spins')
    .select('email', { count: 'exact', head: true })
    .eq('business_id', business.id);

  if ((uniqueContacts ?? 0) >= contactLimit) {
    return {
      ok: false,
      error: isFree ? 'free_limit_reached' : 'contact_limit_reached',
      status: 429,
    };
  }

  return null;
}

/**
 * Fetch eligible segments (filters out exhausted monthly stock).
 */
export async function getEligibleSegments(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  businessId: string
): Promise<{ segments: WheelSegment[] } | ValidationError> {
  const { data: segments, error: segError } = await supabase
    .from('wheel_segments')
    .select('*')
    .eq('business_id', businessId)
    .order('position', { ascending: true });

  if (segError || !segments || segments.length === 0) {
    return { ok: false, error: 'No wheel segments configured', status: 404 };
  }

  const typedSegments = segments as WheelSegment[];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const eligible: WheelSegment[] = [];

  for (const seg of typedSegments) {
    if (!seg.is_winning) {
      eligible.push(seg);
      continue;
    }
    if (!seg.monthly_stock || seg.monthly_stock <= 0) {
      eligible.push(seg);
      continue;
    }
    const { count: segWins } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('segment_id', seg.id)
      .eq('is_winner', true)
      .gte('created_at', monthStart);

    if ((segWins ?? 0) < seg.monthly_stock) {
      eligible.push(seg);
    }
  }

  if (eligible.length === 0) {
    return { ok: false, error: 'all_prizes_exhausted', status: 429 };
  }

  return { segments: eligible };
}

// ---------------------------------------------------------------------------
// HMAC reservation token (stateless, no DB)
// ---------------------------------------------------------------------------

interface ReservationPayload {
  businessId: string;
  segmentId: string;
  isWinning: boolean;
  exp: number; // unix timestamp (seconds)
  isPartnerPrize?: boolean;
  partnerBusinessId?: string;
  offerId?: string;
  isGroupPrize?: boolean;
  prizeBusinessId?: string;
  groupOfferId?: string;
}

/**
 * Create a signed HMAC token encoding the reservation.
 */
export function createReservationToken(payload: ReservationPayload): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const signature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verify and decode an HMAC reservation token.
 * Returns the payload or null if invalid/expired.
 */
export function verifyReservationToken(token: string): ReservationPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(encoded)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const payload: ReservationPayload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString()
    );

    // Check expiration
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSeconds) return null;

    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cross-promo helpers
// ---------------------------------------------------------------------------

export interface PartnerSegment {
  offer_id: string;
  segment_id: string;
  label: string;
  emoji: string;
  color: string;
  partner_business_id: string;
  partner_name: string;
  partner_logo_url: string | null;
  partner_address: string | null;
}

/**
 * Fetch eligible partner segments for cross-promo.
 * Returns segments from other businesses in the same city, different sector, with available stock.
 */
export async function getEligiblePartnerSegments(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  business: Business
): Promise<PartnerSegment[]> {
  if (!business.cross_promo_enabled || !business.city) return [];

  // Region check: only Geneva canton for now
  if (!isInCrossPromoRegion(business.address)) return [];

  const businessSector = mapGoogleCategoryToSector(business.google_business_category);

  // Fetch all active cross-promo offers from businesses in the same city
  const { data: offers, error } = await supabase
    .from('cross_promo_offers')
    .select(`
      id,
      segment_id,
      monthly_stock,
      business_id,
      businesses!inner (
        id,
        name,
        logo_url,
        address,
        city,
        cross_promo_enabled,
        google_business_category
      ),
      wheel_segments!inner (
        label,
        emoji,
        color
      )
    `)
    .eq('is_active', true)
    .neq('business_id', business.id);

  if (error || !offers || offers.length === 0) return [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const eligible: PartnerSegment[] = [];

  for (const offer of offers) {
    const partnerBiz = offer.businesses as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      address: string | null;
      city: string | null;
      cross_promo_enabled: boolean;
      google_business_category: string | null;
    };
    const seg = offer.wheel_segments as unknown as {
      label: string;
      emoji: string;
      color: string;
    };

    // Must be same city, enabled, different sector, in allowed region
    if (!partnerBiz.cross_promo_enabled) continue;
    if (partnerBiz.city !== business.city) continue;
    if (!isInCrossPromoRegion(partnerBiz.address)) continue;
    const partnerSector = mapGoogleCategoryToSector(partnerBiz.google_business_category);
    if (partnerSector === businessSector) continue;

    // Check monthly stock usage
    const { count: usedThisMonth } = await supabase
      .from('cross_promo_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', offer.id)
      .gte('created_at', monthStart);

    if ((usedThisMonth ?? 0) >= offer.monthly_stock) continue;

    eligible.push({
      offer_id: offer.id,
      segment_id: offer.segment_id,
      label: seg.label,
      emoji: seg.emoji,
      color: seg.color,
      partner_business_id: partnerBiz.id,
      partner_name: partnerBiz.name,
      partner_logo_url: partnerBiz.logo_url,
      partner_address: partnerBiz.address,
    });
  }

  return eligible;
}

/**
 * Merge up to 2 partner segments into the pool with fixed low probability (3% each).
 * Adjusts existing segment probabilities proportionally.
 */
export interface MergedSegment extends WheelSegment {
  is_partner?: boolean;
  is_group_prize?: boolean;
  partner_name?: string;
  partner_logo_url?: string | null;
  partner_address?: string | null;
  offer_id?: string;
  partner_business_id?: string;
  group_offer_id?: string;
  prize_business_id?: string;
}

export function mergePartnerSegments(
  segments: WheelSegment[],
  partnerSegments: PartnerSegment[]
): { merged: MergedSegment[]; selectedPartners: PartnerSegment[] } {
  if (partnerSegments.length === 0) {
    return { merged: segments.map((s) => ({ ...s })), selectedPartners: [] };
  }

  // Pick up to 2 random partner segments
  const shuffled = [...partnerSegments].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 2);

  const partnerProbEach = 3; // 3% per partner segment
  const totalPartnerProb = selected.length * partnerProbEach;

  // Scale down existing probabilities
  const totalOriginal = segments.reduce((sum, s) => sum + s.probability, 0);
  const scaleFactor = (totalOriginal - totalPartnerProb) / totalOriginal;

  const merged: MergedSegment[] = segments.map((s) => ({
    ...s,
    probability: Math.max(1, Math.round(s.probability * scaleFactor)),
  }));

  // Add partner segments as virtual wheel segments
  for (const ps of selected) {
    merged.push({
      id: `partner-${ps.offer_id}`,
      business_id: ps.partner_business_id,
      label: ps.label,
      emoji: ps.emoji,
      probability: partnerProbEach,
      color: ps.color,
      position: merged.length,
      is_winning: true,
      promo_code: null,
      monthly_stock: 0,
      created_at: '',
      is_partner: true,
      partner_name: ps.partner_name,
      partner_logo_url: ps.partner_logo_url,
      partner_address: ps.partner_address,
      offer_id: ps.offer_id,
      partner_business_id: ps.partner_business_id,
    });
  }

  return { merged, selectedPartners: selected };
}

// ---------------------------------------------------------------------------
// Multi-establishment (group) helpers
// ---------------------------------------------------------------------------

export interface GroupSegment {
  offer_id: string;
  segment_id: string;
  label: string;
  emoji: string;
  color: string;
  prize_business_id: string;
  prize_business_name: string;
  prize_business_logo_url: string | null;
  prize_business_address: string | null;
}

/**
 * Fetch eligible group segments from other businesses in the same group.
 */
export async function getEligibleGroupSegments(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  business: Business
): Promise<GroupSegment[]> {
  if (!business.group_id) return [];

  // Fetch active group shared offers from other businesses in the same group
  const { data: offers, error } = await supabase
    .from('group_shared_offers')
    .select(`
      id,
      segment_id,
      monthly_stock,
      business_id,
      share_with,
      businesses!inner (
        id,
        name,
        logo_url,
        address
      ),
      wheel_segments!inner (
        label,
        emoji,
        color
      )
    `)
    .eq('is_active', true)
    .neq('business_id', business.id);

  if (error || !offers || offers.length === 0) return [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const eligible: GroupSegment[] = [];

  for (const offer of offers) {
    const prizeBiz = offer.businesses as unknown as {
      id: string;
      name: string;
      logo_url: string | null;
      address: string | null;
    };
    const seg = offer.wheel_segments as unknown as {
      label: string;
      emoji: string;
      color: string;
    };

    // Check share_with: 'all' or comma-separated business IDs
    if (offer.share_with !== 'all') {
      const allowedIds = offer.share_with.split(',').map((s: string) => s.trim());
      if (!allowedIds.includes(business.id)) continue;
    }

    // Check monthly stock usage
    const { count: usedThisMonth } = await supabase
      .from('group_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('offer_id', offer.id)
      .gte('created_at', monthStart);

    if ((usedThisMonth ?? 0) >= offer.monthly_stock) continue;

    eligible.push({
      offer_id: offer.id,
      segment_id: offer.segment_id,
      label: seg.label,
      emoji: seg.emoji,
      color: seg.color,
      prize_business_id: prizeBiz.id,
      prize_business_name: prizeBiz.name,
      prize_business_logo_url: prizeBiz.logo_url,
      prize_business_address: prizeBiz.address,
    });
  }

  return eligible;
}

/**
 * Merge up to 3 group segments into the pool with 10% probability each.
 * Adjusts existing segment probabilities proportionally.
 */
export function mergeGroupSegments(
  segments: MergedSegment[],
  groupSegments: GroupSegment[]
): { merged: MergedSegment[]; selectedGroup: GroupSegment[] } {
  if (groupSegments.length === 0) {
    return { merged: [...segments], selectedGroup: [] };
  }

  // Pick up to 3 random group segments
  const shuffled = [...groupSegments].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const groupProbEach = 10; // 10% per group segment
  const totalGroupProb = selected.length * groupProbEach;

  // Scale down existing probabilities
  const totalOriginal = segments.reduce((sum, s) => sum + s.probability, 0);
  const scaleFactor = (totalOriginal - totalGroupProb) / totalOriginal;

  const merged: MergedSegment[] = segments.map((s) => ({
    ...s,
    probability: Math.max(1, Math.round(s.probability * scaleFactor)),
  }));

  // Add group segments as virtual wheel segments
  for (const gs of selected) {
    merged.push({
      id: `group-${gs.offer_id}`,
      business_id: gs.prize_business_id,
      label: gs.label,
      emoji: gs.emoji,
      probability: groupProbEach,
      color: gs.color,
      position: merged.length,
      is_winning: true,
      promo_code: null,
      monthly_stock: 0,
      created_at: '',
      is_group_prize: true,
      partner_name: gs.prize_business_name,
      partner_logo_url: gs.prize_business_logo_url,
      partner_address: gs.prize_business_address,
      group_offer_id: gs.offer_id,
      prize_business_id: gs.prize_business_id,
    });
  }

  return { merged, selectedGroup: selected };
}
