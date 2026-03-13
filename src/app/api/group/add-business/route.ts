import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import { mapGoogleCategoryToSector, SECTOR_PRESETS, PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      google_place_id,
      google_rating,
      google_review_count,
      google_category,
      google_review_link,
      address,
      phone,
      website,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Le nom du commerce est requis' }, { status: 400 });
    }

    // Check google_place_id uniqueness
    if (google_place_id) {
      const { data: existing } = await supabase
        .from('businesses')
        .select('id, user_id, name')
        .eq('google_place_id', google_place_id)
        .limit(1);

      if (existing && existing.length > 0) {
        const existingBiz = existing[0];
        if (existingBiz.user_id === user.id) {
          return NextResponse.json(
            { error: 'exists_same_user', message: 'Vous avez déjà ajouté cet établissement à votre compte.' },
            { status: 409 }
          );
        } else {
          return NextResponse.json(
            { error: 'exists_other_user', message: 'Ce commerce est déjà inscrit sur woopla par un autre compte. Contactez-nous si vous êtes le propriétaire.' },
            { status: 409 }
          );
        }
      }
    }

    // Check if user has a group (required for multi-establishment)
    const { data: userBusinesses } = await supabase
      .from('businesses')
      .select('id, group_id')
      .eq('user_id', user.id);

    const groupId = userBusinesses?.find(b => b.group_id)?.group_id || null;

    // Create the new business
    const spinLimit = PLAN_SPIN_LIMITS.free;
    const contactLimit = PLAN_CONTACT_LIMITS.free;

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name: name.trim(),
        slug: slugify(name.trim()) + '-' + Date.now().toString(36),
        google_review_link: google_review_link || null,
        google_place_id: google_place_id || null,
        google_rating: google_rating ?? null,
        google_review_count: google_review_count ?? 0,
        google_business_category: google_category || null,
        address: address || null,
        phone: phone || null,
        website_url: website || null,
        plan_type: 'free',
        monthly_spin_limit: spinLimit,
        contact_limit: contactLimit,
        subscription_status: 'free',
        trial_ends_at: new Date().toISOString(),
        primary_color: '#FF6B35',
        secondary_color: '#1B2A4A',
        onboarding_completed: true,
        email_verified: true,
        flow_type: 'lottery_first',
        require_review: false,
        require_pin: false,
        group_id: groupId,
      })
      .select()
      .single();

    if (bizError || !business) {
      console.error('Business creation error:', bizError);
      return NextResponse.json({ error: 'Erreur lors de la création du commerce' }, { status: 500 });
    }

    // Create default wheel segments based on detected sector
    const sector = mapGoogleCategoryToSector(google_category || null);
    const sectorPresets = SECTOR_PRESETS[sector];
    const enabledPresets = sectorPresets.map((p) => ({
      ...p,
      stock: p.suggestedStock,
    }));

    const winners = enabledPresets.filter((p) => p.isWinning);
    const losers = enabledPresets.filter((p) => !p.isWinning);
    const loserProb = losers.length > 0 ? Math.floor(30 / losers.length) : 0;
    const winnerProb = winners.length > 0 ? Math.floor(70 / winners.length) : 0;
    const totalCalc = loserProb * losers.length + winnerProb * winners.length;
    const remainder = 100 - totalCalc;

    const segmentsToInsert = enabledPresets.map((preset, position) => ({
      business_id: business.id,
      label: preset.label,
      emoji: preset.emoji,
      color: preset.color,
      is_winning: preset.isWinning,
      probability: (preset.isWinning ? winnerProb : loserProb) + (position === 0 ? remainder : 0),
      position,
      monthly_stock: preset.isWinning ? preset.stock : 0,
    }));

    await supabase.from('wheel_segments').insert(segmentsToInsert);

    return NextResponse.json({ success: true, business: { id: business.id, name: business.name } });
  } catch (error) {
    console.error('Add business error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
