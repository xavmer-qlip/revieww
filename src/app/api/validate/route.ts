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

    const code = validationCode.toUpperCase();
    const serviceClient = await createServiceClient();

    // ---- Cross-promo prize (XP- prefix) ----
    if (code.startsWith('XP-')) {
      const { data: prize, error: prizeError } = await serviceClient
        .from('cross_promo_prizes')
        .select(`
          *,
          partner_business:businesses!cross_promo_prizes_partner_business_id_fkey(name),
          source_business:businesses!cross_promo_prizes_source_business_id_fkey(name)
        `)
        .eq('validation_code', code)
        .single();

      if (prizeError || !prize) {
        return NextResponse.json(
          { error: 'not_found' },
          { status: 404 }
        );
      }

      if (prize.claimed) {
        return NextResponse.json(
          { error: 'already_claimed', claimed_at: prize.claimed_at },
          { status: 409 }
        );
      }

      // Check expiry
      const expiresAt = new Date(prize.expires_at);
      if (new Date() > expiresAt) {
        return NextResponse.json(
          { error: 'expired' },
          { status: 410 }
        );
      }

      // Mark as claimed
      const { error: updateError } = await serviceClient
        .from('cross_promo_prizes')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('id', prize.id);

      if (updateError) {
        console.error('Error claiming cross-promo prize:', updateError);
        return NextResponse.json(
          { error: 'Failed to claim prize' },
          { status: 500 }
        );
      }

      const partnerBiz = prize.partner_business as unknown as { name: string } | null;
      const sourceBiz = prize.source_business as unknown as { name: string } | null;

      return NextResponse.json({
        success: true,
        prize_label: prize.prize_label,
        prize_emoji: prize.prize_emoji,
        email: null,
        businessName: partnerBiz?.name ?? 'Commerce partenaire',
        is_cross_promo: true,
        source_business_name: sourceBiz?.name ?? null,
        expires_at: prize.expires_at,
      });
    }

    // ---- Regular prize (WP- or RW- prefix) ----
    const { data: spin, error: spinError } = await serviceClient
      .from('spins')
      .select('*, businesses!inner(name, prize_validity_days)')
      .eq('validation_code', code)
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
