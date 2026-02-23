import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { pickWeightedSegment } from '@/lib/utils';
import { PLAN_SPIN_LIMITS } from '@/lib/constants';
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
    const activeStatuses = ['active', 'trialing'];
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

    // ---- Check monthly spin count vs limit ----
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthISO = startOfMonth.toISOString();

    const { count: monthlySpins, error: countError } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', body.businessId)
      .gte('created_at', startOfMonthISO);

    if (countError) {
      console.error('Error counting spins:', countError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const spinLimit =
      PLAN_SPIN_LIMITS[typedBusiness.plan_type] ??
      typedBusiness.monthly_spin_limit;

    if ((monthlySpins ?? 0) >= spinLimit) {
      return NextResponse.json(
        { error: 'quota_reached' },
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

    // ---- Pick winning segment (server-side, weighted random) ----
    const winningSegmentId = pickWeightedSegment(
      typedSegments.map((s) => ({ id: s.id, probability: s.probability }))
    );

    const winningSegment = typedSegments.find((s) => s.id === winningSegmentId);

    if (!winningSegment) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
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
    });
  } catch (error) {
    console.error('Spin API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
