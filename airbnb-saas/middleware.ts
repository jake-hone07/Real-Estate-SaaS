// /middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Protect only these routes (add more if needed)
  const protectedPaths = new Set<string>([
    '/billing',
    '/my-listings',
    // '/generate', // ← uncomment if you want this protected too
    // '/app', '/app/billing', '/app/my-listings', // ← only if you use /app/* pages
  ]);

  const isProtected = [...protectedPaths].some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (!isProtected) return NextResponse.next();

  // Allow through if Supabase cookies exist OR our auth-ok cookie was set
  const hasSupabaseCookie =
    req.cookies.has('sb-access-token') ||
    req.cookies.has('sb-refresh-token') ||
    req.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

  const hasOurCookie = req.cookies.get('auth-ok')?.value === '1';

  if (hasSupabaseCookie || hasOurCookie) return NextResponse.next();

  // Otherwise, redirect to login with return path
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', pathname + (search || ''));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/billing',
    '/billing/:path*',
    '/my-listings',
    '/my-listings/:path*',
    // '/generate', '/generate/:path*', // ← if protected
    // '/app/:path*',                  // ← only if you actually use /app/* pages
  ],
};
