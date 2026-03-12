import { NextResponse } from 'next/server';
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

    const { data: segments, error } = await supabase
      .from('wheel_segments')
      .select('id, label, emoji, color, is_winning, probability, position, monthly_stock')
      .eq('business_id', business.id)
      .order('position', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
    }

    return NextResponse.json({ segments: segments ?? [] });
  } catch (error) {
    console.error('Dashboard segments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
