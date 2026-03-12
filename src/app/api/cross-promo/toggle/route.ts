import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeCity, isInCrossPromoRegion } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enabled, city } = await request.json();

    // Fetch business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, address, city')
      .eq('user_id', user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Region check: only Geneva canton for now
    if (enabled && !isInCrossPromoRegion(business.address)) {
      return NextResponse.json(
        {
          error: 'region_not_available',
          message: 'Le réseau local est actuellement disponible uniquement dans le canton de Genève. D\'autres cantons ouvriront prochainement !',
        },
        { status: 403 }
      );
    }

    // Determine city value
    let normalizedCity = business.city;
    if (enabled && !normalizedCity) {
      if (city) {
        // User provided city manually
        normalizedCity = city
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      } else {
        // Try to extract from address
        normalizedCity = normalizeCity(business.address);
      }

      if (!normalizedCity) {
        return NextResponse.json(
          { error: 'city_required', message: 'Veuillez indiquer votre ville' },
          { status: 400 }
        );
      }
    }

    // Update business
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        cross_promo_enabled: enabled,
        ...(normalizedCity ? { city: normalizedCity } : {}),
      })
      .eq('id', business.id);

    if (updateError) {
      console.error('Toggle cross-promo error:', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cross_promo_enabled: enabled,
      city: normalizedCity,
    });
  } catch (error) {
    console.error('Cross-promo toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
