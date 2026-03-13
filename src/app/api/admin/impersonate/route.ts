import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getAdminClient } from '@/lib/admin';

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const serviceClient = await getAdminClient();

    // Generate a magic link for the target user
    const { data: { user } } = await serviceClient.auth.admin.getUserById(userId);

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a one-time login link
    const { data, error } = await serviceClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
    });

    if (error || !data) {
      console.error('Impersonate error:', error);
      return NextResponse.json({ error: 'Failed to generate login link' }, { status: 500 });
    }

    // The link contains a token — extract and rebuild with our domain
    const properties = data.properties;
    const actionLink = properties?.action_link;

    if (!actionLink) {
      return NextResponse.json({ error: 'No action link generated' }, { status: 500 });
    }

    // Supabase generates a link on their domain — extract token params and rebuild on ours
    const url = new URL(actionLink);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type') || 'magiclink';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.woopla.ch';
    const loginUrl = `${appUrl}/auth/callback?token_hash=${token}&type=${type}&next=/dashboard`;

    return NextResponse.json({
      success: true,
      email: user.email,
      loginUrl,
    });
  } catch (error) {
    console.error('Admin impersonate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
