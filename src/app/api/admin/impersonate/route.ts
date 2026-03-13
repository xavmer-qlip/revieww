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

    // The link contains a token — extract the hashed_token and redirect through auth/callback
    const properties = data.properties;
    const actionLink = properties?.action_link;

    if (!actionLink) {
      return NextResponse.json({ error: 'No action link generated' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      email: user.email,
      loginUrl: actionLink,
    });
  } catch (error) {
    console.error('Admin impersonate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
