import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { pickWeightedSegment, generateValidationCode } from '@/lib/utils';
import { PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS } from '@/lib/constants';
import { Business, WheelSegment } from '@/lib/types';
import { sendPrizeWonEmail } from '@/lib/emails/prize-won';

interface SpinRequestBody {
  businessId: string;
  email: string;
  phone: string | null;
  optedInMarketing: boolean;
  confidenceScore: number;
  timeOnGoogleSeconds: number | null;
  selfReportedStars: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: SpinRequestBody = await request.json();

    // ---- Validate required fields ----
    if (!body.businessId || typeof body.businessId !== 'string') {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        { error: 'email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ---- Validate businessId is a UUID ----
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.businessId)) {
      return NextResponse.json(
        { error: 'Invalid businessId format' },
        { status: 400 }
      );
    }

    // ---- Service client for server operations ----
    const supabase = await createServiceClient();

    // ---- Fetch business ----
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', body.businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const typedBusiness = business as Business;

    // ---- Check subscription status ----
    const activeStatuses = ['active', 'trialing', 'free'];
    if (!activeStatuses.includes(typedBusiness.subscription_status)) {
      return NextResponse.json(
        { error: 'subscription_inactive' },
        { status: 403 }
      );
    }

    // ---- Server-side anti-cheat: 1 spin per email per business per 7 days ----
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentSpinCount } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', body.businessId)
      .eq('email', body.email.toLowerCase().trim())
      .gte('created_at', sevenDaysAgo.toISOString());

    if ((recentSpinCount ?? 0) > 0) {
      return NextResponse.json(
        { error: 'already_played' },
        { status: 429 }
      );
    }

    // ---- Check spin limit ----
    const isFree = typedBusiness.plan_type === 'free';
    const now = new Date();

    const spinLimit =
      PLAN_SPIN_LIMITS[typedBusiness.plan_type] ??
      typedBusiness.monthly_spin_limit;

    if (isFree) {
      // Free plan: total lifetime spins (not monthly)
      const { count: totalSpins, error: countError } = await supabase
        .from('spins')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', body.businessId);

      if (countError) {
        console.error('Error counting spins:', countError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      if ((totalSpins ?? 0) >= spinLimit) {
        return NextResponse.json({ error: 'free_limit_reached' }, { status: 429 });
      }
    } else {
      // Paid plans: monthly spin count
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count: monthlySpins, error: countError } = await supabase
        .from('spins')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', body.businessId)
        .gte('created_at', startOfMonth.toISOString());

      if (countError) {
        console.error('Error counting spins:', countError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      if ((monthlySpins ?? 0) >= spinLimit) {
        return NextResponse.json({ error: 'quota_reached' }, { status: 429 });
      }
    }

    // ---- Check contact limit ----
    const contactLimit =
      PLAN_CONTACT_LIMITS[typedBusiness.plan_type] ??
      typedBusiness.contact_limit ?? 30;

    const { count: uniqueContacts } = await supabase
      .from('spins')
      .select('email', { count: 'exact', head: true })
      .eq('business_id', body.businessId);

    if ((uniqueContacts ?? 0) >= contactLimit) {
      return NextResponse.json(
        { error: isFree ? 'free_limit_reached' : 'contact_limit_reached' },
        { status: 429 }
      );
    }

    // ---- Fetch segments ----
    const { data: segments, error: segError } = await supabase
      .from('wheel_segments')
      .select('*')
      .eq('business_id', body.businessId)
      .order('position', { ascending: true });

    if (segError || !segments || segments.length === 0) {
      return NextResponse.json(
        { error: 'No wheel segments configured' },
        { status: 404 }
      );
    }

    const typedSegments = segments as WheelSegment[];

    // ---- Filter out segments with exhausted monthly stock ----
    const startOfMonth = isFree ? '' : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const eligibleSegments: WheelSegment[] = [];

    for (const seg of typedSegments) {
      // Losing segments are always eligible
      if (!seg.is_winning) {
        eligibleSegments.push(seg);
        continue;
      }
      // Winning segments with monthly_stock = 0 are unlimited
      if (!seg.monthly_stock || seg.monthly_stock <= 0) {
        eligibleSegments.push(seg);
        continue;
      }
      // Count wins for this segment this month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count: segWins } = await supabase
        .from('spins')
        .select('*', { count: 'exact', head: true })
        .eq('segment_id', seg.id)
        .eq('is_winner', true)
        .gte('created_at', monthStart);

      if ((segWins ?? 0) < seg.monthly_stock) {
        eligibleSegments.push(seg);
      }
    }

    if (eligibleSegments.length === 0) {
      return NextResponse.json(
        { error: 'all_prizes_exhausted' },
        { status: 429 }
      );
    }

    // ---- Pick winning segment (server-side, weighted random) ----
    const winningSegmentId = pickWeightedSegment(
      eligibleSegments.map((s) => ({ id: s.id, probability: s.probability }))
    );

    const winningSegment = eligibleSegments.find((s) => s.id === winningSegmentId);

    if (!winningSegment) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // ---- Generate validation code for winners (with retry on collision) ----
    let validationCode: string | null = null;
    if (winningSegment.is_winning) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateValidationCode();
        const { count } = await supabase
          .from('spins')
          .select('*', { count: 'exact', head: true })
          .eq('validation_code', candidate);
        if ((count ?? 0) === 0) {
          validationCode = candidate;
          break;
        }
      }
      if (!validationCode) {
        return NextResponse.json(
          { error: 'Failed to generate unique code' },
          { status: 500 }
        );
      }
    }

    // ---- Insert spin record ----
    const { error: insertError } = await supabase.from('spins').insert({
      business_id: body.businessId,
      email: body.email.toLowerCase().trim(),
      phone: body.phone || null,
      segment_id: winningSegment.id,
      prize_label: winningSegment.label,
      prize_emoji: winningSegment.emoji,
      is_winner: winningSegment.is_winning,
      claimed: false,
      opted_in_marketing: body.optedInMarketing ?? false,
      confidence_score: body.confidenceScore ?? 0,
      time_on_google_seconds: body.timeOnGoogleSeconds ?? null,
      self_reported_stars: body.selfReportedStars ?? null,
      validation_code: validationCode,
    });

    if (insertError) {
      console.error('Error inserting spin:', insertError);
      return NextResponse.json(
        { error: 'Failed to record spin' },
        { status: 500 }
      );
    }

    // ---- Send prize email (fire-and-forget) ----
    if (winningSegment.is_winning && process.env.RESEND_API_KEY) {
      sendPrizeWonEmail({
        to: body.email.toLowerCase().trim(),
        businessName: typedBusiness.name,
        prizeEmoji: winningSegment.emoji,
        prizeLabel: winningSegment.label,
        promoCode: winningSegment.promo_code,
        validationCode,
      }).catch((err) => console.error('Prize email error:', err));
    }

    // ---- Return result ----
    return NextResponse.json({
      success: true,
      segment: {
        id: winningSegment.id,
        label: winningSegment.label,
        emoji: winningSegment.emoji,
        is_winning: winningSegment.is_winning,
        promo_code: winningSegment.promo_code,
      },
      validation_code: validationCode,
    });
  } catch (error) {
    console.error('Spin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
