import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createSupabaseMiddlewareClient } from './shared/lib/supabase-middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `/auth/callback` is a fixed OAuth redirect target and must never be
  // locale-prefixed. Every other route lives under a locale prefix — if the
  // incoming path doesn't have one yet (e.g. a bookmarked `/birds` or the
  // root `/`), hand off to next-intl to detect/redirect to `/en/...` or
  // `/uk/...` first.
  if (!pathname.startsWith('/auth') && !pathname.match(/^\/(en|uk)(\/|$)/)) {
    return intlMiddleware(request);
  }

  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);

  // Always refresh the session so cookies stay current
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users away from auth pages
  if (pathname.match(/^\/(en|uk)\/login(\/|$)/)) {
    if (user) {
      return NextResponse.redirect(new URL('/en/birds', request.url));
    }
    return response;
  }

  // Admin-only routes
  if (pathname.match(/^\/(en|uk)\/admin(\/|$)/) || pathname.match(/^\/(en|uk)\/birds\/[^/]+\/edit/)) {
    if (!user) {
      return NextResponse.redirect(new URL('/en/login', request.url));
    }

    // Check role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/en/birds', request.url));
    }
  }

  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
