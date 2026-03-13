import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getAdminClient } from '@/lib/admin';
import { PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { businessId, planType, expiresAt } = await request.json();

    if (!businessId || typeof businessId !== 'string') {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const validPlans = ['free', 'starter', 'growth', 'pro'];
    if (!planType || !validPlans.includes(planType)) {
      return NextResponse.json({ error: 'Invalid planType' }, { status: 400 });
    }

    const serviceClient = await getAdminClient();

    const updateData: Record<string, unknown> = {
      plan_type: planType,
      subscription_status: planType === 'free' ? 'free' : 'active',
      monthly_spin_limit: PLAN_SPIN_LIMITS[planType] ?? 30,
      contact_limit: PLAN_CONTACT_LIMITS[planType] ?? 30,
    };

    // If an expiration date is provided, set trial_ends_at
    if (expiresAt) {
      updateData.trial_ends_at = expiresAt;
    }

    const { error } = await serviceClient
      .from('businesses')
      .update(updateData)
      .eq('id', businessId);

    if (error) {
      console.error('Admin plan update error:', error);
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, planType, businessId });
  } catch (error) {
    console.error('Admin plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
