import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'magiclink' | 'email' | undefined;
  const next = searchParams.get('next') ?? '/onboarding';

  const supabase = await createClient();

  // Handle OAuth code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Handle magic link / OTP token verification (used by admin impersonate)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // If all methods fail, redirect to login with an error hint
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_failed', origin)
  );
}
