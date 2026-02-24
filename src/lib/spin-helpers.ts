import { createServiceClient } from '@/lib/supabase/server';
import { PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS } from '@/lib/constants';
import { Business, WheelSegment } from '@/lib/types';
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
