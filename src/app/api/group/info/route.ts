import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user's group
    const { data: group } = await supabase
      .from('business_groups')
      .select('*')
      .eq('owner_user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!group) {
      return NextResponse.json({ group: null, members: [] });
    }

    // Fetch all businesses in this group
    const { data: members } = await supabase
      .from('businesses')
      .select('id, name, logo_url, address, plan_type, slug, monthly_spin_limit')
      .eq('group_id', group.id)
      .order('created_at', { ascending: true });

    // Fetch per-member: spins, winning segments (with details), shared offers
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const membersWithData = await Promise.all(
      (members ?? []).map(async (m) => {
        const [spinsResult, segmentsResult, offersResult] = await Promise.all([
          supabase
            .from('spins')
            .select('*', { count: 'exact', head: true })
            .eq('business_id', m.id)
            .gte('created_at', monthStart),
          supabase
            .from('wheel_segments')
            .select('id, label, emoji, color, monthly_stock')
            .eq('business_id', m.id)
            .eq('is_winning', true)
            .order('position', { ascending: true }),
          supabase
            .from('group_shared_offers')
            .select('id, segment_id, monthly_stock, is_active')
            .eq('business_id', m.id),
        ]);

        return {
          ...m,
          spins_this_month: spinsResult.count ?? 0,
          winning_segment_count: segmentsResult.data?.length ?? 0,
          shared_offer_count: offersResult.data?.filter((o) => o.is_active).length ?? 0,
          segments: segmentsResult.data ?? [],
          shared_offers: offersResult.data ?? [],
        };
      })
    );

    return NextResponse.json({ group, members: membersWithData });
  } catch (error) {
    console.error('Group info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
