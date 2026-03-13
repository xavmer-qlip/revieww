import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Skip auth checks if Supabase is not configured
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Fallback: if Supabase sends confirmation to /?code=xxx instead of /auth/callback,
  // redirect to the callback route preserving all query params
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  // Public routes that don't need auth
  const publicRoutes = ['/', '/login', '/signup', '/play'];
  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith('/play/') ||
    pathname.startsWith('/validate/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/');

  // Redirect unauthenticated users from protected routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/onboarding')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    const redirect = request.nextUrl.searchParams.get('redirect');
    url.pathname = redirect || '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
