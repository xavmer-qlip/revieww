import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveBusinessForApi } from '@/lib/active-business';

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

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Lots given: this business provided prizes won by clients at other establishments
    const { count: given } = await supabase
      .from('group_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('prize_business_id', business.id)
      .neq('source_business_id', business.id)
      .gte('created_at', monthStart);

    // Lots received: clients at this business won prizes from other establishments
    const { count: received } = await supabase
      .from('group_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('source_business_id', business.id)
      .neq('prize_business_id', business.id)
      .gte('created_at', monthStart);

    // Lots claimed
    const { count: claimed } = await supabase
      .from('group_prizes')
      .select('*', { count: 'exact', head: true })
      .eq('prize_business_id', business.id)
      .eq('claimed', true)
      .gte('created_at', monthStart);

    return NextResponse.json({
      given: given ?? 0,
      received: received ?? 0,
      claimed: claimed ?? 0,
    });
  } catch (error) {
    console.error('Group stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
