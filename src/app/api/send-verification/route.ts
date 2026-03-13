import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendVerificationEmail } from '@/lib/emails/verify-email';
import { getActiveBusinessForApi } from '@/lib/active-business';

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const business = await getActiveBusinessForApi(supabase, user.id, null);

  if (!business) {
    return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
  }

  if (business.email_verified) {
    return NextResponse.json({ message: 'Email déjà vérifié' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const verificationLink = `${appUrl}/api/verify-email?token=${(business as any).verification_token}`;

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
