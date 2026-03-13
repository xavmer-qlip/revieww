import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePin } from '@/lib/pin';
import { getOrRefreshPin } from '@/lib/pin-server';
import { getActiveBusinessForApi } from '@/lib/active-business';

/**
 * GET /api/pin — Return the current daily PIN for the authenticated user's business.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await getActiveBusinessForApi(supabase, user.id, null);

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const pin = await getOrRefreshPin(business.id);

    return NextResponse.json({
      pin,
      require_pin: business.require_pin,
      pin_updated_at: business.pin_updated_at,
    });
  } catch (error) {
    console.error('PIN GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pin — Force-regenerate a new PIN for the authenticated user's business.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await getActiveBusinessForApi(supabase, user.id, null);

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const newPin = generatePin();
    const now = new Date().toISOString();

    await supabase
      .from('businesses')
      .update({ daily_pin: newPin, pin_updated_at: now })
      .eq('id', business.id);

    return NextResponse.json({ pin: newPin, pin_updated_at: now });
  } catch (error) {
    console.error('PIN POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
