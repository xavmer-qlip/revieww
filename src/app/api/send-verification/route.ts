import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: business, error } = await supabase
    .from('businesses')
    .select('verification_token, email_verified')
    .eq('user_id', user.id)
    .single();

  if (error || !business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
  }

  if (business.email_verified) {
    return NextResponse.json({ message: 'Email déjà vérifié' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationLink = `${appUrl}/api/verify-email?token=${business.verification_token}`;

  // TODO: Intégrer Resend ou autre service email
  // Pour l'instant on retourne le lien dans la réponse JSON
  console.log('[send-verification] Lien de vérification :', verificationLink);

  return NextResponse.json({
    message: 'Lien de vérification généré',
    link: verificationLink,
  });
}
