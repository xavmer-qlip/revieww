import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getAdminClient } from '@/lib/admin';

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceClient = await getAdminClient();
    const search = request.nextUrl.searchParams.get('search') || '';
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    // Fetch businesses with spin counts
    let query = serviceClient
      .from('businesses')
      .select('*, spins(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: businesses, count, error } = await query;

    if (error) {
      console.error('Admin users fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Fetch auth user emails for each business
    const enriched = await Promise.all(
      (businesses ?? []).map(async (biz) => {
        const { data: { user } } = await serviceClient.auth.admin.getUserById(biz.user_id);
        const spinsArr = biz.spins as unknown as { count: number }[];
        return {
          id: biz.id,
          user_id: biz.user_id,
          name: biz.name,
          slug: biz.slug,
          email: user?.email ?? null,
          plan_type: biz.plan_type,
          subscription_status: biz.subscription_status,
          monthly_spin_limit: biz.monthly_spin_limit,
          trial_ends_at: biz.trial_ends_at,
          created_at: biz.created_at,
          logo_url: biz.logo_url,
          address: biz.address,
          google_place_id: biz.google_place_id,
          group_id: biz.group_id,
          total_spins: spinsArr?.[0]?.count ?? 0,
          onboarding_completed: biz.onboarding_completed,
          email_verified: biz.email_verified,
          blocked: biz.subscription_status === 'expired',
        };
      })
    );

    return NextResponse.json({
      businesses: enriched,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
