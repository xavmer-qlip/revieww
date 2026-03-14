import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveBusinessForApi } from '@/lib/active-business';
import { isGroupEligible } from '@/lib/constants';

/**
 * Resolve which business to operate on.
 * If `business_id` is provided in the body, verify the user owns it.
 * Otherwise fall back to the active business cookie.
 */
async function resolveBusinessForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  requestedBusinessId?: string,
  cookieValue?: string
) {
  if (requestedBusinessId) {
    const { data: biz } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', requestedBusinessId)
      .eq('user_id', userId)
      .single();
    return biz ?? null;
  }
  return getActiveBusinessForApi(supabase, userId, cookieValue);
}

// GET: list group shared offers for active business
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await getActiveBusinessForApi(supabase, user.id);
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { data: offers } = await supabase
      .from('group_shared_offers')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ offers: offers ?? [] });
  } catch (error) {
    console.error('Group offers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: create or update a group shared offer
export async function POST(request: NextRequest) {
  try {
    const { segment_id, monthly_stock, share_with, business_id } = await request.json();

    if (!segment_id) {
      return NextResponse.json({ error: 'segment_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await resolveBusinessForUser(
      supabase,
      user.id,
      business_id,
      request.cookies.get('woopla_active_business')?.value
    );
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!business.group_id) {
      return NextResponse.json({ error: 'Business is not in a group' }, { status: 400 });
    }

    if (!isGroupEligible(business.plan_type)) {
      return NextResponse.json({ error: 'Plan Growth ou Pro requis pour partager des lots' }, { status: 403 });
    }

    // Verify segment belongs to this business
    const { data: segment } = await supabase
      .from('wheel_segments')
      .select('id, business_id')
      .eq('id', segment_id)
      .single();

    if (!segment || segment.business_id !== business.id) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    // Upsert offer
    const { data: offer, error } = await supabase
      .from('group_shared_offers')
      .upsert(
        {
          business_id: business.id,
          segment_id,
          monthly_stock: monthly_stock ?? 10,
          is_active: true,
          share_with: share_with ?? 'all',
        },
        { onConflict: 'segment_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Group offer upsert error:', error);
      return NextResponse.json({ error: 'Failed to save offer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    console.error('Group offers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: remove a group shared offer
export async function DELETE(request: NextRequest) {
  try {
    const { segment_id, business_id } = await request.json();

    if (!segment_id) {
      return NextResponse.json({ error: 'segment_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await resolveBusinessForUser(
      supabase,
      user.id,
      business_id,
      request.cookies.get('woopla_active_business')?.value
    );
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('group_shared_offers')
      .delete()
      .eq('segment_id', segment_id)
      .eq('business_id', business.id);

    if (error) {
      console.error('Group offer delete error:', error);
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Group offers DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
