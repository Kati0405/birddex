import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createSupabaseMiddlewareClient } from './shared/lib/supabase-middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);
const LOCALE_HEADER = 'X-NEXT-INTL-LOCALE';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // `/auth/callback` is a fixed OAuth redirect target and must never be
  // locale-prefixed — skip next-intl entirely for it.
  if (pathname.startsWith('/auth')) {
    return NextResponse.next({ request });
  }

  // For an unprefixed path (e.g. a bookmarked `/birds` or the root `/`),
  // hand off to next-intl to detect/redirect to `/en/...` or `/uk/...`.
  if (!pathname.match(/^\/(en|uk)(\/|$)/)) {
    return intlMiddleware(request);
  }

  const locale = pathname.match(/^\/(en|uk)(\/|$)/)?.[1] ?? routing.defaultLocale;

  // Forward the resolved locale on the request headers (not just the
  // response) — `getLocale()` (from `next-intl/server`) reads this as a
  // fallback inside Server Actions that don't share the page render's
  // `setRequestLocale()` cache scope. next-intl's own middleware sets this
  // the same way for the initial unprefixed request handled above.
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  const requestWithLocale = { headers };

  const response = NextResponse.next({ request: requestWithLocale });
  const supabase = createSupabaseMiddlewareClient(request, response);

  // Always refresh the session so cookies stay current
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users away from auth pages
  if (pathname.match(/^\/(en|uk)\/login(\/|$)/)) {
    if (user) {
      return NextResponse.redirect(new URL(`/${locale}/birds`, request.url));
    }
    return response;
  }

  // Admin-only routes
  if (pathname.match(/^\/(en|uk)\/admin(\/|$)/) || pathname.match(/^\/(en|uk)\/birds\/[^/]+\/edit/)) {
    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // Check role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}/birds`, request.url));
    }
  }

  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
