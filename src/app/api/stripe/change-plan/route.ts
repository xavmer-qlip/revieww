import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { STRIPE_PRICE_IDS, PLAN_SPIN_LIMITS } from '@/lib/constants';
import { Business, PlanType } from '@/lib/types';
import { getActiveBusinessForApi } from '@/lib/active-business';

interface ChangePlanBody {
  planType: PlanType;
}

const VALID_PLAN_TYPES: PlanType[] = ['starter', 'growth', 'pro'];

export async function POST(request: NextRequest) {
  try {
    // ---- Authenticate user ----
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ---- Parse and validate body ----
    const body: ChangePlanBody = await request.json();

    if (!body.planType || !VALID_PLAN_TYPES.includes(body.planType)) {
      return NextResponse.json(
        { error: 'Invalid planType. Must be one of: starter, growth, pro' },
        { status: 400 }
      );
    }

    const priceId = STRIPE_PRICE_IDS[body.planType];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for this plan' },
        { status: 500 }
      );
    }

    // ---- Fetch business record ----
    const business = await getActiveBusinessForApi(supabase, user.id, request.cookies.get('woopla_active_business')?.value);

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const typedBusiness = business;

    if (!typedBusiness.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // ---- Retrieve current subscription ----
    const subscription = await getStripe().subscriptions.retrieve(
      typedBusiness.stripe_subscription_id
    );

    if (!subscription.items.data.length) {
      return NextResponse.json(
        { error: 'Subscription has no items' },
        { status: 500 }
      );
    }

    // ---- Update subscription with new price ----
    await getStripe().subscriptions.update(typedBusiness.stripe_subscription_id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // ---- Update business in Supabase ----
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        plan_type: body.planType,
        monthly_spin_limit: PLAN_SPIN_LIMITS[body.planType],
      })
      .eq('id', typedBusiness.id);

    if (updateError) {
      console.error('Failed to update business plan:', updateError);
      return NextResponse.json(
        { error: 'Subscription updated but failed to sync plan locally' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
