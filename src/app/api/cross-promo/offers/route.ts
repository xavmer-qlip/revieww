import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { data: offers, error } = await supabase
      .from('cross_promo_offers')
      .select(`
        id,
        segment_id,
        monthly_stock,
        is_active,
        created_at,
        wheel_segments (
          id,
          label,
          emoji,
          color
        )
      `)
      .eq('business_id', business.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
    }

    return NextResponse.json({ offers: offers ?? [] });
  } catch (error) {
    console.error('Cross-promo offers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { segment_id, monthly_stock = 5 } = await request.json();

    if (!segment_id) {
      return NextResponse.json({ error: 'segment_id is required' }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
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

    // Upsert offer (segment_id is UNIQUE)
    const { data: offer, error } = await supabase
      .from('cross_promo_offers')
      .upsert(
        {
          business_id: business.id,
          segment_id,
          monthly_stock: Math.max(1, Math.min(50, monthly_stock)),
          is_active: true,
        },
        { onConflict: 'segment_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Cross-promo offer upsert error:', error);
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
    }

    return NextResponse.json({ offer });
  } catch (error) {
    console.error('Cross-promo offers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { segment_id } = await request.json();

    if (!segment_id) {
      return NextResponse.json({ error: 'segment_id is required' }, { status: 400 });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('cross_promo_offers')
      .delete()
      .eq('segment_id', segment_id)
      .eq('business_id', business.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cross-promo offers DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
