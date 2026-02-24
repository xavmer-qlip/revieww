import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { spinId, claimed } = await request.json();

    if (!spinId || typeof claimed !== 'boolean') {
      return NextResponse.json(
        { error: 'spinId and claimed (boolean) are required' },
        { status: 400 }
      );
    }

    // Auth check — only logged-in merchants can toggle
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'auth_required' }, { status: 401 });
    }

    // Verify ownership: spin must belong to a business owned by this user
    const serviceClient = await createServiceClient();
    const { data: spin, error: spinError } = await serviceClient
      .from('spins')
      .select('id, businesses(user_id)')
      .eq('id', spinId)
      .single();

    if (spinError || !spin) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const businesses = spin.businesses as { user_id: string }[] | null;
    if (!businesses?.[0] || businesses[0].user_id !== user.id) {
      return NextResponse.json({ error: 'not_owner' }, { status: 403 });
    }

    // Update via service client (bypass RLS)
    const { error: updateError } = await serviceClient
      .from('spins')
      .update({
        claimed,
        claimed_at: claimed ? new Date().toISOString() : null,
      })
      .eq('id', spinId);

    if (updateError) {
      console.error('Error toggling claim:', updateError);
      return NextResponse.json({ error: 'update_failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Toggle claim API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
