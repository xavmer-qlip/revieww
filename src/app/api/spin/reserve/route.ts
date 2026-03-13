import { NextRequest, NextResponse } from 'next/server';
import { pickWeightedSegment } from '@/lib/utils';
import { WheelSegment } from '@/lib/types';
import {
  validateBusinessForSpin,
  checkSpinQuotas,
  getEligibleSegments,
  getEligiblePartnerSegments,
  mergePartnerSegments,
  getEligibleGroupSegments,
  mergeGroupSegments,
  createReservationToken,
} from '@/lib/spin-helpers';

export async function POST(request: NextRequest) {
  try {
    const { businessId, pin } = await request.json();

    // Validate business
    const bizResult = await validateBusinessForSpin(businessId);
    if (!bizResult.ok) {
      return NextResponse.json(
        { error: bizResult.error },
        { status: bizResult.status }
      );
    }

    const { business, supabase } = bizResult;

    // PIN validation
    if (business.require_pin) {
      if (!pin) {
        return NextResponse.json(
          { error: 'pin_required' },
          { status: 403 }
        );
      }
      if (pin !== business.daily_pin) {
        return NextResponse.json(
          { error: 'invalid_pin' },
          { status: 403 }
        );
      }
    }

    // Check quotas
    const quotaError = await checkSpinQuotas(supabase, business);
    if (quotaError) {
      return NextResponse.json(
        { error: quotaError.error },
        { status: quotaError.status }
      );
    }

    // Get eligible segments
    const segResult = await getEligibleSegments(supabase, businessId);
    if ('ok' in segResult && !segResult.ok) {
      return NextResponse.json(
        { error: segResult.error },
        { status: segResult.status }
      );
    }

    const eligibleSegments = (segResult as { segments: WheelSegment[] }).segments;

    // Cross-promo: fetch and merge partner segments
    const partnerSegments = await getEligiblePartnerSegments(supabase, business);
    const { merged, selectedPartners } = mergePartnerSegments(eligibleSegments, partnerSegments);

    // Multi-establishment: fetch and merge group segments
    const groupSegments = await getEligibleGroupSegments(supabase, business);
    const { merged: finalMerged, selectedGroup } = mergeGroupSegments(merged, groupSegments);

    // Pick weighted segment from merged pool
    const winningSegmentId = pickWeightedSegment(
      finalMerged.map((s) => ({ id: s.id, probability: s.probability }))
    );

    const winningSegment = finalMerged.find((s) => s.id === winningSegmentId);
    if (!winningSegment) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Determine if it's a partner prize or group prize
    const isPartner = 'is_partner' in winningSegment && winningSegment.is_partner === true;
    const isGroupPrize = 'is_group_prize' in winningSegment && winningSegment.is_group_prize === true;

    const partnerInfo = isPartner ? winningSegment as typeof winningSegment & {
      partner_business_id: string;
      partner_name: string;
      partner_logo_url: string | null;
      partner_address: string | null;
      offer_id: string;
    } : null;

    const groupInfo = isGroupPrize ? winningSegment as typeof winningSegment & {
      prize_business_id: string;
      partner_name: string;
      partner_logo_url: string | null;
      partner_address: string | null;
      group_offer_id: string;
    } : null;

    // Create HMAC token (10 min expiry)
    const token = createReservationToken({
      businessId,
      segmentId: winningSegment.id,
      isWinning: winningSegment.is_winning,
      exp: Math.floor(Date.now() / 1000) + 600,
      ...(isPartner && partnerInfo ? {
        isPartnerPrize: true,
        partnerBusinessId: partnerInfo.partner_business_id,
        offerId: partnerInfo.offer_id,
      } : {}),
      ...(isGroupPrize && groupInfo ? {
        isGroupPrize: true,
        prizeBusinessId: groupInfo.prize_business_id,
        groupOfferId: groupInfo.group_offer_id,
      } : {}),
    });

    return NextResponse.json({
      success: true,
      token,
      segment: {
        id: winningSegment.id,
        label: winningSegment.label,
        emoji: winningSegment.emoji,
        is_winning: winningSegment.is_winning,
        ...(isPartner && partnerInfo ? {
          is_partner: true,
          partner_name: partnerInfo.partner_name,
          partner_logo_url: partnerInfo.partner_logo_url,
          partner_address: partnerInfo.partner_address,
        } : {}),
        ...(isGroupPrize && groupInfo ? {
          is_group_prize: true,
          partner_name: groupInfo.partner_name,
          partner_logo_url: groupInfo.partner_logo_url,
          partner_address: groupInfo.partner_address,
        } : {}),
      },
    });
  } catch (error) {
    console.error('Spin reserve API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
