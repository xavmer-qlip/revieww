import { NextRequest, NextResponse } from 'next/server';
import { pickWeightedSegment, generateValidationCode } from '@/lib/utils';
import { WheelSegment } from '@/lib/types';
import { sendPrizeWonEmail } from '@/lib/emails/prize-won';
import {
  validateBusinessForSpin,
  checkSpinQuotas,
  getEligibleSegments,
} from '@/lib/spin-helpers';

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

    // ---- Validate business ----
    const bizResult = await validateBusinessForSpin(body.businessId);
    if (!bizResult.ok) {
      return NextResponse.json(
        { error: bizResult.error },
        { status: bizResult.status }
      );
    }

    const { business, supabase } = bizResult;

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

    // ---- Check quotas ----
    const quotaError = await checkSpinQuotas(supabase, business);
    if (quotaError) {
      return NextResponse.json(
        { error: quotaError.error },
        { status: quotaError.status }
      );
    }

    // ---- Get eligible segments ----
    const segResult = await getEligibleSegments(supabase, body.businessId);
    if ('ok' in segResult && !segResult.ok) {
      return NextResponse.json(
        { error: segResult.error },
        { status: segResult.status }
      );
    }

    const eligibleSegments = (segResult as { segments: WheelSegment[] }).segments;

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

    // ---- Send prize email (awaited — fire-and-forget gets killed on Vercel serverless) ----
    if (winningSegment.is_winning && process.env.RESEND_API_KEY) {
      try {
        await sendPrizeWonEmail({
          to: body.email.toLowerCase().trim(),
          businessName: business.name,
          prizeEmoji: winningSegment.emoji,
          prizeLabel: winningSegment.label,
          promoCode: winningSegment.promo_code,
          validationCode,
        });
      } catch (err) {
        console.error('Prize email error:', err);
      }
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
