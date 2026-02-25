import { NextRequest, NextResponse } from 'next/server';
import { pickWeightedSegment } from '@/lib/utils';
import { WheelSegment } from '@/lib/types';
import {
  validateBusinessForSpin,
  checkSpinQuotas,
  getEligibleSegments,
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

    // Pick weighted segment
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

    // Create HMAC token (10 min expiry)
    const token = createReservationToken({
      businessId,
      segmentId: winningSegment.id,
      isWinning: winningSegment.is_winning,
      exp: Math.floor(Date.now() / 1000) + 600,
    });

    return NextResponse.json({
      success: true,
      token,
      segment: {
        id: winningSegment.id,
        label: winningSegment.label,
        emoji: winningSegment.emoji,
        is_winning: winningSegment.is_winning,
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
