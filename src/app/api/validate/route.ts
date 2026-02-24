import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { validationCode } = await request.json();

    if (!validationCode || typeof validationCode !== 'string') {
      return NextResponse.json(
        { error: 'validationCode is required' },
        { status: 400 }
      );
    }

    // ---- Auth check ----
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'auth_required' },
        { status: 401 }
      );
    }

    // ---- Fetch spin by validation code ----
    const { data: spin, error: spinError } = await supabase
      .from('spins')
      .select('*, businesses!inner(user_id, name)')
      .eq('validation_code', validationCode.toUpperCase())
      .single();

    if (spinError || !spin) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      );
    }

    // ---- Ownership check ----
    const business = spin.businesses as { user_id: string; name: string };
    if (business.user_id !== user.id) {
      return NextResponse.json(
        { error: 'not_owner' },
        { status: 403 }
      );
    }

    // ---- Already claimed check ----
    if (spin.claimed) {
      return NextResponse.json(
        { error: 'already_claimed', claimed_at: spin.claimed_at },
        { status: 409 }
      );
    }

    // ---- Expiry check (7 days) ----
    const createdAt = new Date(spin.created_at);
    const now = new Date();
    const daysSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 7) {
      return NextResponse.json(
        { error: 'expired' },
        { status: 410 }
      );
    }

    // ---- Mark as claimed (service client to bypass RLS) ----
    const serviceClient = await createServiceClient();
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Validate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
