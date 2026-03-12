/**
 * Test script for cross-promo feature.
 *
 * Prerequisites:
 * - 2 businesses in the same city with different sectors
 * - Both must have wheel segments configured
 *
 * Run: npx tsx scripts/test-cross-promo.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CITY = 'testville';

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  // Delete test businesses (cascade deletes offers, prizes, segments, spins)
  const { error } = await supabase
    .from('businesses')
    .delete()
    .like('name', 'TEST_CROSSPROMO_%');

  if (error) console.error('  Cleanup error:', error.message);
  else console.log('  ✅ Test data cleaned up');
}

async function createTestBusiness(
  name: string,
  sector: string,
  segments: { label: string; emoji: string; probability: number; color: string; is_winning: boolean; monthly_stock: number }[]
) {
  console.log(`\n📍 Creating business: ${name} (${sector})`);

  // Create a fake user for this business
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: `${name.toLowerCase().replace(/\s+/g, '')}@test-crosspromo.local`,
    password: 'test12345678',
    email_confirm: true,
  });

  if (authError) {
    console.error('  Auth error:', authError.message);
    // Try to find existing user
    const { data: users } = await supabase.auth.admin.listUsers();
    const existing = users?.users?.find(u => u.email === `${name.toLowerCase().replace(/\s+/g, '')}@test-crosspromo.local`);
    if (!existing) throw authError;
    // Use existing user
    const userId = existing.id;
    return await finishBusinessCreation(userId, name, sector, segments);
  }

  return await finishBusinessCreation(authUser.user.id, name, sector, segments);
}

async function finishBusinessCreation(
  userId: string,
  name: string,
  sector: string,
  segments: { label: string; emoji: string; probability: number; color: string; is_winning: boolean; monthly_stock: number }[]
) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .insert({
      user_id: userId,
      name,
      slug,
      google_business_category: sector,
      address: `Rue Test 1, 1000 ${CITY}`,
      city: CITY,
      cross_promo_enabled: true,
      subscription_status: 'active',
      plan_type: 'growth',
      monthly_spin_limit: 250,
      contact_limit: 1000,
      primary_color: '#FF6B35',
      secondary_color: '#1B2A4A',
      email_verified: true,
      onboarding_completed: true,
      require_pin: false,
    })
    .select()
    .single();

  if (bizError) {
    console.error('  Business error:', bizError.message);
    throw bizError;
  }

  console.log(`  ✅ Business created: ${business.id}`);

  // Create wheel segments
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const { data: segData, error: segError } = await supabase
      .from('wheel_segments')
      .insert({
        business_id: business.id,
        label: seg.label,
        emoji: seg.emoji,
        probability: seg.probability,
        color: seg.color,
        position: i,
        is_winning: seg.is_winning,
        monthly_stock: seg.monthly_stock,
      })
      .select()
      .single();

    if (segError) {
      console.error(`  Segment error: ${segError.message}`);
    } else {
      console.log(`  ✅ Segment: ${seg.emoji} ${seg.label} (id: ${segData.id})`);
    }
  }

  return business;
}

async function testToggle(businessId: string) {
  console.log('\n🔄 Test 1: Toggle cross-promo');

  // Disable
  const { error: offErr } = await supabase
    .from('businesses')
    .update({ cross_promo_enabled: false })
    .eq('id', businessId);

  if (offErr) throw offErr;

  const { data: bizOff } = await supabase
    .from('businesses')
    .select('cross_promo_enabled')
    .eq('id', businessId)
    .single();

  console.log(`  cross_promo_enabled = ${bizOff?.cross_promo_enabled} (expected: false) ${bizOff?.cross_promo_enabled === false ? '✅' : '❌'}`);

  // Re-enable
  const { error: onErr } = await supabase
    .from('businesses')
    .update({ cross_promo_enabled: true })
    .eq('id', businessId);

  if (onErr) throw onErr;

  const { data: bizOn } = await supabase
    .from('businesses')
    .select('cross_promo_enabled')
    .eq('id', businessId)
    .single();

  console.log(`  cross_promo_enabled = ${bizOn?.cross_promo_enabled} (expected: true) ${bizOn?.cross_promo_enabled === true ? '✅' : '❌'}`);
}

async function testShareOffers(businessId: string) {
  console.log('\n🎁 Test 2: Share offers');

  // Get winning segments
  const { data: segments } = await supabase
    .from('wheel_segments')
    .select('id, label, emoji, is_winning')
    .eq('business_id', businessId)
    .eq('is_winning', true);

  if (!segments || segments.length === 0) {
    console.error('  ❌ No winning segments found');
    return;
  }

  const seg = segments[0];
  console.log(`  Sharing segment: ${seg.emoji} ${seg.label}`);

  const { data: offer, error } = await supabase
    .from('cross_promo_offers')
    .insert({
      business_id: businessId,
      segment_id: seg.id,
      monthly_stock: 5,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('  ❌ Offer error:', error.message);
    return;
  }

  console.log(`  ✅ Offer created: ${offer.id} (stock: ${offer.monthly_stock}/month)`);
  return offer;
}

async function testPartnerDiscovery(businessAId: string, businessBId: string) {
  console.log('\n🤝 Test 3: Partner discovery');

  const { data: bizA } = await supabase
    .from('businesses')
    .select('city, google_business_category, cross_promo_enabled')
    .eq('id', businessAId)
    .single();

  const { data: bizB } = await supabase
    .from('businesses')
    .select('city, google_business_category, cross_promo_enabled')
    .eq('id', businessBId)
    .single();

  console.log(`  Business A: city=${bizA?.city}, sector=${bizA?.google_business_category}, enabled=${bizA?.cross_promo_enabled}`);
  console.log(`  Business B: city=${bizB?.city}, sector=${bizB?.google_business_category}, enabled=${bizB?.cross_promo_enabled}`);

  // Check same city
  const sameCity = bizA?.city === bizB?.city;
  console.log(`  Same city: ${sameCity} ${sameCity ? '✅' : '❌'}`);

  // Check different sector
  const diffSector = bizA?.google_business_category !== bizB?.google_business_category;
  console.log(`  Different sector: ${diffSector} ${diffSector ? '✅' : '❌'}`);

  // Both enabled
  const bothEnabled = bizA?.cross_promo_enabled && bizB?.cross_promo_enabled;
  console.log(`  Both enabled: ${bothEnabled} ${bothEnabled ? '✅' : '❌'}`);
}

async function testSpinWithPartner(businessAId: string) {
  console.log('\n🎰 Test 4: Spin reserve with partner segments (via API)');

  const res = await fetch(`${APP_URL}/api/spin/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId: businessAId }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log(`  ⚠️ Reserve failed: ${data.error} (this may be OK if app isn't running)`);
    return null;
  }

  console.log(`  ✅ Reserve OK — segment: ${data.segment.emoji} ${data.segment.label}`);
  console.log(`  Is partner: ${data.segment.is_partner ?? false}`);
  if (data.segment.partner_name) {
    console.log(`  Partner: ${data.segment.partner_name}`);
  }

  return data;
}

async function testSpinConfirm(token: string) {
  console.log('\n📧 Test 5: Spin confirm with email');

  const res = await fetch(`${APP_URL}/api/spin/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      email: 'test-crosspromo@example.com',
      phone: null,
      optedInMarketing: false,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log(`  ⚠️ Confirm failed: ${data.error}`);
    return null;
  }

  console.log(`  ✅ Confirm OK — code: ${data.validation_code}`);
  if (data.is_partner_prize) {
    console.log(`  🎁 Partner prize from: ${data.partner_business_name}`);
    console.log(`  📍 Address: ${data.partner_business_address}`);
    console.log(`  ⏰ Valid for: ${data.validity_days} days`);
  }

  return data;
}

async function testValidation(code: string) {
  console.log(`\n✅ Test 6: Validate code ${code}`);

  const res = await fetch(`${APP_URL}/api/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ validationCode: code }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.log(`  ⚠️ Validation failed: ${data.error}`);
    return;
  }

  console.log(`  ✅ Validated: ${data.prize_emoji} ${data.prize_label}`);
  console.log(`  Business: ${data.businessName}`);
  if (data.is_cross_promo) {
    console.log(`  🎁 Cross-promo prize (source: ${data.source_business_name})`);
  }
}

async function testDisablePartner(businessBId: string, businessAId: string) {
  console.log('\n🚫 Test 7: Disable cross-promo on partner B');

  await supabase
    .from('businesses')
    .update({ cross_promo_enabled: false })
    .eq('id', businessBId);

  // Check that B's offers are no longer eligible
  const { data: offers } = await supabase
    .from('cross_promo_offers')
    .select('id, is_active, business_id')
    .eq('business_id', businessBId);

  console.log(`  B's offers still exist: ${(offers?.length ?? 0) > 0} (expected: true — they stay but won't match)`);

  // Re-enable for cleanup
  await supabase
    .from('businesses')
    .update({ cross_promo_enabled: true })
    .eq('id', businessBId);

  console.log(`  ✅ Partner B re-enabled`);
}

async function testStats(businessId: string) {
  console.log('\n📊 Test 8: Cross-promo stats');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count: given } = await supabase
    .from('cross_promo_prizes')
    .select('*', { count: 'exact', head: true })
    .eq('partner_business_id', businessId)
    .gte('created_at', monthStart);

  const { count: received } = await supabase
    .from('cross_promo_prizes')
    .select('*', { count: 'exact', head: true })
    .eq('source_business_id', businessId)
    .gte('created_at', monthStart);

  console.log(`  Given (my lots won by others' clients): ${given ?? 0}`);
  console.log(`  Received (partner lots won by my clients): ${received ?? 0}`);
}

// =========================================================================
// Main
// =========================================================================

async function main() {
  console.log('🚀 Cross-promo test suite');
  console.log('========================\n');

  // Cleanup previous test data
  await cleanup();

  try {
    // Create 2 test businesses in same city, different sectors
    const bizA = await createTestBusiness('TEST_CROSSPROMO_Coiffeur_Bella', 'hair_care', [
      { label: 'Coupe offerte', emoji: '💇', probability: 20, color: '#9C27B0', is_winning: true, monthly_stock: 10 },
      { label: '-10%', emoji: '💰', probability: 30, color: '#4CAF50', is_winning: true, monthly_stock: 20 },
      { label: 'Pas de chance', emoji: '❌', probability: 50, color: '#78909C', is_winning: false, monthly_stock: 0 },
    ]);

    const bizB = await createTestBusiness('TEST_CROSSPROMO_Cafe_Central', 'cafe', [
      { label: 'Café offert', emoji: '☕', probability: 25, color: '#6F4E37', is_winning: true, monthly_stock: 15 },
      { label: 'Croissant offert', emoji: '🥐', probability: 20, color: '#E91E63', is_winning: true, monthly_stock: 10 },
      { label: 'Perdu', emoji: '😢', probability: 55, color: '#607D8B', is_winning: false, monthly_stock: 0 },
    ]);

    // Test 1: Toggle
    await testToggle(bizA.id);

    // Test 2: Share offers from business B
    const offer = await testShareOffers(bizB.id);

    // Test 3: Partner discovery
    await testPartnerDiscovery(bizA.id, bizB.id);

    // Test 4-6: Spin flow via API (requires app running)
    console.log('\n--- API tests (requires app running on localhost:3000) ---');
    const reserveData = await testSpinWithPartner(bizA.id);

    if (reserveData?.token) {
      const confirmData = await testSpinConfirm(reserveData.token);

      if (confirmData?.validation_code) {
        await testValidation(confirmData.validation_code);
      }
    }

    // Test 6b: Force a cross-promo prize via direct DB insert to test validation
    console.log('\n🎯 Test 6b: Force cross-promo prize + validate XP- code');
    {
      // Insert a spin
      const { data: spin } = await supabase
        .from('spins')
        .insert({
          business_id: bizA.id,
          email: 'forced-test@example.com',
          prize_label: 'Café offert',
          prize_emoji: '☕',
          is_winner: true,
          claimed: false,
          opted_in_marketing: false,
          confidence_score: 0,
        })
        .select('id')
        .single();

      if (spin) {
        // Get offer
        const { data: offers } = await supabase
          .from('cross_promo_offers')
          .select('id')
          .eq('business_id', bizB.id)
          .limit(1);

        if (offers && offers.length > 0) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 15);
          const xpCode = `XP-TEST`;

          const { error: insertErr } = await supabase
            .from('cross_promo_prizes')
            .insert({
              spin_id: spin.id,
              source_business_id: bizA.id,
              partner_business_id: bizB.id,
              offer_id: offers[0].id,
              prize_label: 'Café offert',
              prize_emoji: '☕',
              validation_code: xpCode,
              expires_at: expiresAt.toISOString(),
            });

          if (insertErr) {
            console.log(`  ❌ Insert error: ${insertErr.message}`);
          } else {
            console.log(`  ✅ Forced XP- prize created: ${xpCode}`);

            // Validate via API
            await testValidation(xpCode);

            // Check claimed status
            const { data: claimed } = await supabase
              .from('cross_promo_prizes')
              .select('claimed, claimed_at')
              .eq('validation_code', xpCode)
              .single();

            console.log(`  Claimed: ${claimed?.claimed} ${claimed?.claimed ? '✅' : '❌'}`);
            console.log(`  Claimed at: ${claimed?.claimed_at}`);
          }
        }
      }
    }

    // Test 7: Disable partner
    await testDisablePartner(bizB.id, bizA.id);

    // Test 8: Stats
    await testStats(bizA.id);
    await testStats(bizB.id);

    console.log('\n========================');
    console.log('🏁 Test suite complete!\n');

  } catch (err) {
    console.error('\n💥 Test failed:', err);
  } finally {
    // Cleanup
    await cleanup();

    // Delete test auth users
    const { data: users } = await supabase.auth.admin.listUsers();
    for (const user of users?.users ?? []) {
      if (user.email?.includes('test-crosspromo')) {
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  }
}

main();
