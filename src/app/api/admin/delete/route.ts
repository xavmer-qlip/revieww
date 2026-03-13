import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getAdminClient } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { businessId, deleteUser } = await request.json();

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const serviceClient = await getAdminClient();

    // Fetch business to get user_id
    const { data: business } = await serviceClient
      .from('businesses')
      .select('id, user_id, name')
      .eq('id', businessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Delete spins first (FK constraint)
    await serviceClient
      .from('spins')
      .delete()
      .eq('business_id', businessId);

    // Delete wheel segments
    await serviceClient
      .from('wheel_segments')
      .delete()
      .eq('business_id', businessId);

    // Delete cross-promo offers/prizes
    await serviceClient
      .from('cross_promo_offers')
      .delete()
      .eq('business_id', businessId);

    await serviceClient
      .from('cross_promo_prizes')
      .delete()
      .or(`source_business_id.eq.${businessId},partner_business_id.eq.${businessId}`);

    // Delete group offers/prizes
    await serviceClient
      .from('group_shared_offers')
      .delete()
      .eq('business_id', businessId);

    await serviceClient
      .from('group_prizes')
      .delete()
      .or(`source_business_id.eq.${businessId},prize_business_id.eq.${businessId}`);

    // Delete business
    const { error: bizError } = await serviceClient
      .from('businesses')
      .delete()
      .eq('id', businessId);

    if (bizError) {
      console.error('Admin delete business error:', bizError);
      return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }

    // Optionally delete the auth user too
    if (deleteUser) {
      // Check if user has other businesses
      const { count } = await serviceClient
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', business.user_id);

      if ((count ?? 0) === 0) {
        const { error: authError } = await serviceClient.auth.admin.deleteUser(business.user_id);
        if (authError) {
          console.error('Admin delete auth user error:', authError);
        }
      }
    }

    return NextResponse.json({ success: true, deleted: business.name });
  } catch (error) {
    console.error('Admin delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
