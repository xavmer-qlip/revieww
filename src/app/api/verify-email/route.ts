import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = await createServiceClient();

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('verification_token', token)
    .single();

  if (error || !business) {
    const url = new URL('/login', request.url);
    url.searchParams.set('error', 'Lien de vérification invalide ou expiré.');
    return NextResponse.redirect(url);
  }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({ email_verified: true })
    .eq('id', business.id);

  if (updateError) {
    console.error('[verify-email] Update error:', updateError);
    const url = new URL('/login', request.url);
    url.searchParams.set('error', 'Erreur lors de la vérification. Réessayez.');
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL('/dashboard?verified=true', request.url));
}
