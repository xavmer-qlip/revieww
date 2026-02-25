import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateValidationCode } from '@/lib/utils';
import {
  validateBusinessForSpin,
  checkSpinQuotas,
  verifyReservationToken,
} from '@/lib/spin-helpers';
import { sendPrizeWonEmail } from '@/lib/emails/prize-won';
import { WheelSegment } from '@/lib/types';

interface ConfirmRequestBody {
  token: string;
  email: string;
  phone: string | null;
  optedInMarketing: boolean;
  confidenceScore?: number;
  timeOnGoogleSeconds?: number | null;
  selfReportedStars?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmRequestBody = await request.json();

    // Validate required fields
    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }
    if (!body.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Verify HMAC token
    const payload = verifyReservationToken(body.token);
    if (!payload) {
      return NextResponse.json(
        { error: 'token_expired', message: 'Le délai a expiré. Veuillez recommencer.' },
        { status: 401 }
      );
    }

    // Re-validate business
    const bizResult = await validateBusinessForSpin(payload.businessId);
    if (!bizResult.ok) {
      return NextResponse.json(
        { error: bizResult.error },
        { status: bizResult.status }
      );
    }

    const { business, supabase } = bizResult;

    // Re-check quotas
    const quotaError = await checkSpinQuotas(supabase, business);
    if (quotaError) {
      return NextResponse.json(
        { error: quotaError.error },
        { status: quotaError.status }
      );
    }

    // Anti-cheat: 1 spin per email per business per 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentSpinCount } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', payload.businessId)
      .eq('email', body.email.toLowerCase().trim())
      .gte('created_at', sevenDaysAgo.toISOString());

    if ((recentSpinCount ?? 0) > 0) {
      return NextResponse.json({ error: 'already_played' }, { status: 429 });
    }

    // Fetch the reserved segment to get full data
    const { data: segment } = await supabase
      .from('wheel_segments')
      .select('*')
      .eq('id', payload.segmentId)
      .single();

    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    const typedSegment = segment as WheelSegment;

    // Generate validation code for winners
    let validationCode: string | null = null;
    if (payload.isWinning) {
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

    // Insert spin record
    const { error: insertError } = await supabase.from('spins').insert({
      business_id: payload.businessId,
      email: body.email.toLowerCase().trim(),
      phone: body.phone || null,
      segment_id: payload.segmentId,
      prize_label: typedSegment.label,
      prize_emoji: typedSegment.emoji,
      is_winner: payload.isWinning,
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

    // Send prize email (awaited — fire-and-forget gets killed on Vercel serverless)
    if (payload.isWinning && process.env.RESEND_API_KEY) {
      try {
        await sendPrizeWonEmail({
          to: body.email.toLowerCase().trim(),
          businessName: business.name,
          prizeEmoji: typedSegment.emoji,
          prizeLabel: typedSegment.label,
          promoCode: typedSegment.promo_code,
          validationCode,
          instagramUrl: business.instagram_url,
          facebookUrl: business.facebook_url,
          tiktokUrl: business.tiktok_url,
          websiteUrl: business.website_url,
        });
      } catch (err) {
        console.error('Prize email error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      segment: {
        id: typedSegment.id,
        label: typedSegment.label,
        emoji: typedSegment.emoji,
        is_winning: payload.isWinning,
        promo_code: typedSegment.promo_code,
      },
      validation_code: validationCode,
    });
  } catch (error) {
    console.error('Spin confirm API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
