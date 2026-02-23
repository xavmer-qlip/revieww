import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { APP_URL } from '@/lib/constants';
import { Business } from '@/lib/types';

export async function POST() {
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

    if (!typedBusiness.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please subscribe first.' },
        { status: 400 }
      );
    }

    // ---- Create Billing Portal Session ----
    const session = await getStripe().billingPortal.sessions.create({
      customer: typedBusiness.stripe_customer_id,
      return_url: `${APP_URL}/dashboard/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Create portal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
