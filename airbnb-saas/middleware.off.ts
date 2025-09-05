// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require a signed-in user
const PROTECTED = [/^\/dashboard(\/|$)/, /^\/generate(\/|$)/, /^\/billing(\/|$)/];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip static files and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/api') // keep APIs callable (your API handlers already do auth)
  ) {
    return NextResponse.next();
  }

  // Only guard the protected app routes
  const isProtected = PROTECTED.some((rx) => rx.test(pathname));
  if (!isProtected) return NextResponse.next();

  // Supabase sets auth cookies we can check in middleware
  const hasSession =
    req.cookies.has('sb-access-token') ||
    req.cookies.has('sb:token') || // fallback name in some setups
    req.cookies.has('supabase-auth-token'); // belt-and-suspenders for older helpers

  if (hasSession) return NextResponse.next();

  // No session → send to /login and preserve intended destination
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  if (pathname !== '/login') {
    const redirectTo = pathname + (search || '');
    loginUrl.searchParams.set('redirect', redirectTo);
  }
  return NextResponse.redirect(loginUrl);
}

// Limit middleware to these routes (keeps the rest fast)
export const config = {
  matcher: ['/dashboard/:path*', '/generate/:path*', '/billing/:path*'],
};
