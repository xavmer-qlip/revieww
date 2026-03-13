import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapGoogleCategoryToSector, SECTOR_LABELS } from '@/lib/constants';
import { isInCrossPromoRegion } from '@/lib/utils';
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

    if (!business.cross_promo_enabled || !business.city || !isInCrossPromoRegion(business.address)) {
      return NextResponse.json({ partners: [], city: business.city });
    }

    const mySector = mapGoogleCategoryToSector(business.google_business_category);

    // Fetch businesses in same city with cross-promo enabled
    const { data: candidates, error } = await supabase
      .from('businesses')
      .select('id, name, logo_url, google_business_category, address')
      .eq('city', business.city)
      .eq('cross_promo_enabled', true)
      .neq('id', business.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
    }

    // Filter by different sector, allowed region, and count shared offers
    const partners = [];
    for (const candidate of candidates ?? []) {
      if (!isInCrossPromoRegion(candidate.address)) continue;
      const candidateSector = mapGoogleCategoryToSector(candidate.google_business_category);
      if (candidateSector === mySector) continue;

      const { count: offerCount } = await supabase
        .from('cross_promo_offers')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', candidate.id)
        .eq('is_active', true);

      partners.push({
        id: candidate.id,
        name: candidate.name,
        logo_url: candidate.logo_url,
        sector: SECTOR_LABELS[candidateSector] || candidateSector,
        address: candidate.address,
        shared_offers: offerCount ?? 0,
      });
    }

    return NextResponse.json({ partners, city: business.city });
  } catch (error) {
    console.error('Cross-promo partners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
