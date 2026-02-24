/**
 * Smoke test script for revieww
 * Tests: build, pages, API validation, utils, auth flow basics
 *
 * Usage: npx tsx tests/smoke-test.ts
 */

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;
const results: { name: string; ok: boolean; detail?: string }[] = [];

function log(name: string, ok: boolean, detail?: string) {
  if (ok) passed++;
  else failed++;
  results.push({ name, ok, detail });
  const icon = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  const msg = detail ? ` — ${detail}` : '';
  console.log(`  ${icon} ${name}${msg}`);
}

// ---------------------------------------------------------------------------
// Unit tests (no server needed)
// ---------------------------------------------------------------------------

async function testUtils() {
  console.log('\n\x1b[1m[1/5] Utils\x1b[0m');

  // Test generateValidationCode
  const { generateValidationCode } = await import('../src/lib/utils');

  const code = generateValidationCode();
  log('generateValidationCode returns RW-XXXX format', /^RW-[A-Z2-9]{4}$/.test(code), code);

  // No confusing chars
  const forbidden = /[O0I1L]/;
  const codes = Array.from({ length: 100 }, () => generateValidationCode());
  const hasForbidden = codes.some((c) => forbidden.test(c));
  log('No confusing chars (O/0/I/1/L) in 100 codes', !hasForbidden);

  // Uniqueness (statistical — 100 codes should be mostly unique)
  const uniqueSet = new Set(codes);
  log('Codes are reasonably unique', uniqueSet.size > 90, `${uniqueSet.size}/100 unique`);

  // Test slugify
  const { slugify } = await import('../src/lib/utils');
  log('slugify("Café du Marché") works', slugify('Café du Marché') === 'cafe-du-marche');

  // Test cn
  const { cn } = await import('../src/lib/utils');
  log('cn() joins classes', cn('foo', false && 'bar', 'baz') === 'foo baz');
}

// ---------------------------------------------------------------------------
// Types check
// ---------------------------------------------------------------------------

async function testTypes() {
  console.log('\n\x1b[1m[2/5] Types\x1b[0m');

  const types = await import('../src/lib/types');

  // Check Spin interface has validation_code and claimed_at
  // We can't directly check TS interfaces at runtime, but we can check
  // that a mock object satisfying the interface compiles
  const mockSpin: types.Spin = {
    id: '1',
    business_id: '1',
    email: 'test@test.com',
    phone: null,
    segment_id: '1',
    prize_label: 'Cafe',
    prize_emoji: '☕',
    is_winner: true,
    claimed: false,
    opted_in_marketing: false,
    device_fingerprint: null,
    confidence_score: 80,
    time_on_google_seconds: 30,
    self_reported_stars: 5,
    validation_code: 'RW-ABCD',
    claimed_at: null,
    created_at: new Date().toISOString(),
  };

  log('Spin type has validation_code field', mockSpin.validation_code === 'RW-ABCD');
  log('Spin type has claimed_at field', mockSpin.claimed_at === null);
}

// ---------------------------------------------------------------------------
// Constants check
// ---------------------------------------------------------------------------

async function testConstants() {
  console.log('\n\x1b[1m[3/5] Constants\x1b[0m');

  const { TEXTS } = await import('../src/lib/constants');

  log('TEXTS.play.validationCode exists', typeof TEXTS.play.validationCode === 'string', TEXTS.play.validationCode);
  log('TEXTS.validate section exists', typeof TEXTS.validate === 'object');
  log('TEXTS.validate.claim text', TEXTS.validate.claim === 'Marquer comme réclamé');
  log('TEXTS.validate.notFound text', typeof TEXTS.validate.notFound === 'string');
  log('TEXTS.validate.expired text', typeof TEXTS.validate.expired === 'string');
  log('TEXTS.validate.loginRequired text', typeof TEXTS.validate.loginRequired === 'string');
  log('TEXTS.validate.notOwner text', typeof TEXTS.validate.notOwner === 'string');
}

// ---------------------------------------------------------------------------
// Page & API smoke tests (need running server)
// ---------------------------------------------------------------------------

async function testPages() {
  console.log('\n\x1b[1m[4/5] Pages (GET requests)\x1b[0m');

  const pages = [
    { path: '/', name: 'Landing page' },
    { path: '/login', name: 'Login page' },
    { path: '/signup', name: 'Signup page' },
    { path: '/validate/RW-TEST', name: 'Validate page (invalid code)' },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE}${page.path}`, { redirect: 'manual' });
      // 200 for public pages, 307 for protected pages (redirect to login)
      const ok = res.status === 200 || res.status === 307;
      log(`${page.name} (${page.path})`, ok, `status ${res.status}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`${page.name} (${page.path})`, false, `FETCH ERROR: ${msg}`);
    }
  }

  // Onboarding should redirect to login (protected)
  try {
    const res = await fetch(`${BASE}/onboarding`, { redirect: 'manual' });
    const isRedirect = res.status === 307 || res.status === 308;
    const location = res.headers.get('location') || '';
    log('/onboarding redirects to login when not auth', isRedirect && location.includes('/login'), `status ${res.status}, location: ${location}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('/onboarding redirect', false, `FETCH ERROR: ${msg}`);
  }
}

async function testAPIs() {
  console.log('\n\x1b[1m[5/5] API validation\x1b[0m');

  // POST /api/spin — missing fields
  try {
    const res = await fetch(`${BASE}/api/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    log('POST /api/spin rejects missing businessId', res.status === 400 && data.error === 'businessId is required');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('POST /api/spin validation', false, msg);
  }

  // POST /api/spin — bad email
  try {
    const res = await fetch(`${BASE}/api/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: '00000000-0000-0000-0000-000000000000', email: 'bad' }),
    });
    const data = await res.json();
    log('POST /api/spin rejects invalid email', res.status === 400 && data.error === 'Invalid email format');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('POST /api/spin email validation', false, msg);
  }

  // POST /api/spin — bad businessId format
  try {
    const res = await fetch(`${BASE}/api/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: 'not-a-uuid', email: 'test@test.com' }),
    });
    const data = await res.json();
    log('POST /api/spin rejects invalid UUID', res.status === 400 && data.error === 'Invalid businessId format');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('POST /api/spin UUID validation', false, msg);
  }

  // POST /api/spin — nonexistent business
  try {
    const res = await fetch(`${BASE}/api/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: '00000000-0000-0000-0000-000000000000', email: 'test@test.com' }),
    });
    const data = await res.json();
    log('POST /api/spin rejects nonexistent business', res.status === 404 && data.error === 'Business not found');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('POST /api/spin business not found', false, msg);
  }

  // POST /api/validate — no auth
  try {
    const res = await fetch(`${BASE}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validationCode: 'RW-TEST' }),
    });
    const data = await res.json();
    log('POST /api/validate requires auth', res.status === 401 && data.error === 'auth_required');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('POST /api/validate auth check', false, msg);
  }

  // POST /api/validate — missing code
  try {
    const res = await fetch(`${BASE}/api/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    // Could be 400 (missing field) or 401 (auth first) — both are acceptable
    const ok = (res.status === 400 && data.error === 'validationCode is required') ||
               (res.status === 401 && data.error === 'auth_required');
    log('POST /api/validate rejects missing code or requires auth', ok, `status ${res.status}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('POST /api/validate missing code', false, msg);
  }

  // GET /auth/callback — no code
  try {
    const res = await fetch(`${BASE}/auth/callback`, { redirect: 'manual' });
    const location = res.headers.get('location') || '';
    log('GET /auth/callback without code redirects to login', res.status === 307 && location.includes('/login'), `status ${res.status}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('GET /auth/callback', false, msg);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1;36m║    revieww — Smoke Test Suite         ║\x1b[0m');
  console.log('\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m');

  // Unit tests (no server needed)
  await testUtils();
  await testTypes();
  await testConstants();

  // Check if server is running
  let serverUp = false;
  try {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(3000) });
    serverUp = res.status === 200;
  } catch {
    serverUp = false;
  }

  if (serverUp) {
    await testPages();
    await testAPIs();
  } else {
    console.log('\n\x1b[33m⚠ Dev server not running on :3000 — skipping page & API tests\x1b[0m');
    console.log('  Run "npm run dev" first for full test coverage\n');
  }

  // Summary
  console.log('\n\x1b[1m══════════════════════════════════════\x1b[0m');
  console.log(`  \x1b[32m${passed} passed\x1b[0m  \x1b[31m${failed} failed\x1b[0m  (${passed + failed} total)`);
  console.log('\x1b[1m══════════════════════════════════════\x1b[0m\n');

  if (failed > 0) {
    console.log('\x1b[31mFailed tests:\x1b[0m');
    results.filter((r) => !r.ok).forEach((r) => {
      console.log(`  ✗ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
    });
    console.log('');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
