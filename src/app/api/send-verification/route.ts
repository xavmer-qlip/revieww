import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendVerificationEmail } from '@/lib/emails/verify-email';

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
    .select('name, verification_token, email_verified')
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

  try {
    await sendVerificationEmail({
      to: user.email!,
      businessName: business.name,
      verificationLink,
    });
  } catch (err) {
    console.error('[send-verification] Erreur envoi email:', err);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: 'Email de vérification envoyé' });
}
