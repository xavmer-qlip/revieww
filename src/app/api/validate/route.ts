import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { validationCode } = await request.json();

    if (!validationCode || typeof validationCode !== 'string') {
      return NextResponse.json(
        { error: 'validationCode is required' },
        { status: 400 }
      );
    }

    // ---- Fetch spin by validation code (service client — bypass RLS) ----
    const serviceClient = await createServiceClient();
    const { data: spin, error: spinError } = await serviceClient
      .from('spins')
      .select('*, businesses!inner(name, prize_validity_days)')
      .eq('validation_code', validationCode.toUpperCase())
      .single();

    if (spinError || !spin) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      );
    }

    // ---- Already claimed check ----
    if (spin.claimed) {
      return NextResponse.json(
        { error: 'already_claimed', claimed_at: spin.claimed_at },
        { status: 409 }
      );
    }

    // ---- Expiry check ----
    const business = spin.businesses as { name: string; prize_validity_days: number };
    const validityDays = business.prize_validity_days ?? 7;
    const createdAt = new Date(spin.created_at);
    const now = new Date();
    const daysSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > validityDays) {
      return NextResponse.json(
        { error: 'expired' },
        { status: 410 }
      );
    }

    // ---- Mark as claimed ----
    const { error: updateError } = await serviceClient
      .from('spins')
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq('id', spin.id);

    if (updateError) {
      console.error('Error claiming spin:', updateError);
      return NextResponse.json(
        { error: 'Failed to claim prize' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prize_label: spin.prize_label,
      prize_emoji: spin.prize_emoji,
      email: spin.email,
      businessName: business.name,
    });
  } catch (error) {
    console.error('Validate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
