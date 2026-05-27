import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from './lib/supabase-middleware';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);

  // Always refresh the session so cookies stay current
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') || pathname.match(/^\/birds\/[^/]+\/edit/)) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
