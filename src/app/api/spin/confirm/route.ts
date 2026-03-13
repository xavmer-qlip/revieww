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

    const isPartnerPrize = payload.isPartnerPrize === true;
    const isGroupPrize = payload.isGroupPrize === true;

    // Fetch prize label/emoji based on type
    let prizeLabel: string;
    let prizeEmoji: string | null;
    let promoCode: string | null = null;

    if (isPartnerPrize && payload.offerId) {
      // Cross-promo prize: fetch segment from the partner's offer
      const { data: offer } = await supabase
        .from('cross_promo_offers')
        .select(`
          id,
          wheel_segments!inner (label, emoji)
        `)
        .eq('id', payload.offerId)
        .single();

      if (!offer) {
        return NextResponse.json({ error: 'Partner offer not found' }, { status: 404 });
      }

      const seg = offer.wheel_segments as unknown as { label: string; emoji: string };
      prizeLabel = seg.label;
      prizeEmoji = seg.emoji;
    } else if (isGroupPrize && payload.groupOfferId) {
      // Group prize: fetch segment from group_shared_offers
      const { data: offer } = await supabase
        .from('group_shared_offers')
        .select(`
          id,
          wheel_segments!inner (label, emoji)
        `)
        .eq('id', payload.groupOfferId)
        .single();

      if (!offer) {
        return NextResponse.json({ error: 'Group offer not found' }, { status: 404 });
      }

      const seg = offer.wheel_segments as unknown as { label: string; emoji: string };
      prizeLabel = seg.label;
      prizeEmoji = seg.emoji;
    } else {
      // Regular prize: fetch from wheel_segments
      const { data: segment } = await supabase
        .from('wheel_segments')
        .select('*')
        .eq('id', payload.segmentId)
        .single();

      if (!segment) {
        return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
      }

      const typedSegment = segment as WheelSegment;
      prizeLabel = typedSegment.label;
      prizeEmoji = typedSegment.emoji;
      promoCode = typedSegment.promo_code;
    }

    // Generate validation code (always WP- prefix)
    let validationCode: string | null = null;
    if (payload.isWinning) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateValidationCode('WP');
        // Check collision in spins, cross_promo_prizes, and group_prizes
        const { count: spinCount } = await supabase
          .from('spins')
          .select('*', { count: 'exact', head: true })
          .eq('validation_code', candidate);
        const { count: xpCount } = await supabase
          .from('cross_promo_prizes')
          .select('*', { count: 'exact', head: true })
          .eq('validation_code', candidate);
        const { count: gpCount } = await supabase
          .from('group_prizes')
          .select('*', { count: 'exact', head: true })
          .eq('validation_code', candidate);
        if ((spinCount ?? 0) === 0 && (xpCount ?? 0) === 0 && (gpCount ?? 0) === 0) {
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
    const { data: insertedSpin, error: insertError } = await supabase
      .from('spins')
      .insert({
        business_id: payload.businessId,
        email: body.email.toLowerCase().trim(),
        phone: body.phone || null,
        segment_id: (isPartnerPrize || isGroupPrize) ? null : payload.segmentId,
        prize_label: prizeLabel,
        prize_emoji: prizeEmoji,
        is_winner: payload.isWinning,
        claimed: false,
        opted_in_marketing: body.optedInMarketing ?? false,
        confidence_score: body.confidenceScore ?? 0,
        time_on_google_seconds: body.timeOnGoogleSeconds ?? null,
        self_reported_stars: body.selfReportedStars ?? null,
        validation_code: (isPartnerPrize || isGroupPrize) ? null : validationCode,
      })
      .select('id')
      .single();

    if (insertError || !insertedSpin) {
      console.error('Error inserting spin:', insertError);
      return NextResponse.json(
        { error: 'Failed to record spin' },
        { status: 500 }
      );
    }

    // If partner prize, insert into cross_promo_prizes
    let partnerBusinessName: string | null = null;
    let partnerBusinessAddress: string | null = null;
    if (isPartnerPrize && payload.partnerBusinessId && payload.offerId && validationCode) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      const { error: xpInsertError } = await supabase
        .from('cross_promo_prizes')
        .insert({
          spin_id: insertedSpin.id,
          source_business_id: payload.businessId,
          partner_business_id: payload.partnerBusinessId,
          offer_id: payload.offerId,
          prize_label: prizeLabel,
          prize_emoji: prizeEmoji,
          validation_code: validationCode,
          expires_at: expiresAt.toISOString(),
        });

      if (xpInsertError) {
        console.error('Error inserting cross-promo prize:', xpInsertError);
      }

      // Fetch partner business info for response
      const { data: partnerBiz } = await supabase
        .from('businesses')
        .select('name, address')
        .eq('id', payload.partnerBusinessId)
        .single();

      if (partnerBiz) {
        partnerBusinessName = partnerBiz.name;
        partnerBusinessAddress = partnerBiz.address;
      }
    }

    // If group prize, insert into group_prizes
    let groupBusinessName: string | null = null;
    let groupBusinessAddress: string | null = null;
    let groupValidityDays: number | null = null;
    if (isGroupPrize && payload.prizeBusinessId && payload.groupOfferId && validationCode) {
      // Fetch prize business for validity days
      const { data: prizeBiz } = await supabase
        .from('businesses')
        .select('name, address, prize_validity_days')
        .eq('id', payload.prizeBusinessId)
        .single();

      const validityDays = prizeBiz?.prize_validity_days ?? 7;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      const { error: gpInsertError } = await supabase
        .from('group_prizes')
        .insert({
          spin_id: insertedSpin.id,
          source_business_id: payload.businessId,
          prize_business_id: payload.prizeBusinessId,
          offer_id: payload.groupOfferId,
          prize_label: prizeLabel,
          prize_emoji: prizeEmoji,
          validation_code: validationCode,
          expires_at: expiresAt.toISOString(),
        });

      if (gpInsertError) {
        console.error('Error inserting group prize:', gpInsertError);
      }

      if (prizeBiz) {
        groupBusinessName = prizeBiz.name;
        groupBusinessAddress = prizeBiz.address;
        groupValidityDays = validityDays;
      }
    }

    // Send prize email
    if (payload.isWinning && process.env.RESEND_API_KEY) {
      try {
        const emailBusinessName = isGroupPrize && groupBusinessName
          ? groupBusinessName
          : isPartnerPrize && partnerBusinessName
            ? partnerBusinessName
            : business.name;

        await sendPrizeWonEmail({
          to: body.email.toLowerCase().trim(),
          businessName: emailBusinessName,
          prizeEmoji: prizeEmoji,
          prizeLabel: prizeLabel,
          promoCode: promoCode,
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
        id: payload.segmentId,
        label: prizeLabel,
        emoji: prizeEmoji,
        is_winning: payload.isWinning,
        promo_code: promoCode,
      },
      validation_code: validationCode,
      ...(isPartnerPrize ? {
        is_partner_prize: true,
        partner_business_name: partnerBusinessName,
        partner_business_address: partnerBusinessAddress,
        cross_promo_validation_code: validationCode,
        validity_days: 15,
      } : {}),
      ...(isGroupPrize ? {
        is_group_prize: true,
        partner_business_name: groupBusinessName,
        partner_business_address: groupBusinessAddress,
        validity_days: groupValidityDays,
      } : {}),
    });
  } catch (error) {
    console.error('Spin confirm API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
