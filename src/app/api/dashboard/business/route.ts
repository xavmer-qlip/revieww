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

    const business = await getActiveBusinessForApi(supabase, user.id, null);

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Dashboard business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
