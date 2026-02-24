import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PLAY_HOSTNAMES = ['play.revieww.ch', 'play.localhost'];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] ?? '';

  // Subdomain routing: play.revieww.ch/{slug} → /play/{slug}
  if (PLAY_HOSTNAMES.includes(hostname)) {
    const pathname = request.nextUrl.pathname;

    // Let API routes pass through without rewriting
    if (pathname.startsWith('/api/')) {
      return await updateSession(request);
    }

    // Rewrite root to /play (will 404 without slug, but that's expected)
    // Rewrite /{slug} to /play/{slug}
    if (pathname === '/' || !pathname.startsWith('/play')) {
      const slug = pathname === '/' ? '' : pathname;
      const url = request.nextUrl.clone();
      url.pathname = `/play${slug}`;
      return NextResponse.rewrite(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
