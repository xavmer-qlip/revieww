import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { STRIPE_PRICE_IDS, APP_URL } from '@/lib/constants';
import { Business, PlanType } from '@/lib/types';

interface CreateCheckoutBody {
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
    const body: CreateCheckoutBody = await request.json();

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
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const typedBusiness = business as Business;

    // ---- Get or create Stripe customer ----
    let stripeCustomerId = typedBusiness.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: {
          supabaseUserId: user.id,
          businessId: typedBusiness.id,
        },
      });

      stripeCustomerId = customer.id;

      // Persist the new customer ID
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', typedBusiness.id);

      if (updateError) {
        console.error('Failed to save stripe_customer_id:', updateError);
        return NextResponse.json(
          { error: 'Failed to save customer information' },
          { status: 500 }
        );
      }
    }

    // ---- Create Checkout Session ----
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          businessId: typedBusiness.id,
          planType: body.planType,
        },
      },
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/dashboard/billing`,
      metadata: {
        businessId: typedBusiness.id,
        planType: body.planType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
