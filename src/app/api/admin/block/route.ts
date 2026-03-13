import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getAdminClient } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { businessId, blocked } = await request.json();

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const serviceClient = await getAdminClient();

    // Block = set subscription_status to 'expired' (prevents spin access)
    // Unblock = restore to 'active'
    const newStatus = blocked ? 'expired' : 'active';

    const { error } = await serviceClient
      .from('businesses')
      .update({ subscription_status: newStatus })
      .eq('id', businessId);

    if (error) {
      console.error('Admin block error:', error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, blocked, businessId });
  } catch (error) {
    console.error('Admin block error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
