import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, city, cross_promo_enabled, address, google_business_category')
      .eq('user_id', user.id)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Dashboard business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
