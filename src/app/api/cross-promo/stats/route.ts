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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Lots given: my prizes won by clients from other businesses
    const { count: given } = await supabase
      .from('cross_promo_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('partner_business_id', business.id)
      .gte('created_at', monthStart);

    // Lots received: partner prizes won by my clients
    const { count: received } = await supabase
      .from('cross_promo_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('source_business_id', business.id)
      .gte('created_at', monthStart);

    // Claimed (my lots that were redeemed)
    const { count: claimed } = await supabase
      .from('cross_promo_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('partner_business_id', business.id)
      .eq('claimed', true)
      .gte('created_at', monthStart);

    return NextResponse.json({
      given: given ?? 0,
      received: received ?? 0,
      claimed: claimed ?? 0,
    });
  } catch (error) {
    console.error('Cross-promo stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
