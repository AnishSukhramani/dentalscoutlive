import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/authEdge';

const AUTH_PAGES = ['/login', '/signup'];
const STATIC_PATHS = ['/_next', '/favicon', '/favicon.ico', '/static', '/images', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.webp'];

function isStaticAsset(pathname) {
  return STATIC_PATHS.some((p) => p.startsWith('.') ? pathname.endsWith(p) : pathname.startsWith(p) || pathname === p);
}

function isAuthPage(pathname) {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Static assets: always allow through, never redirect (fixes background images)
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Auth pages (login/signup): redirect to / if already logged in
  if (isAuthPage(pathname)) {
    const token = getTokenFromRequest(request);
    const payload = await verifyToken(token);

    if (payload) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  // Protected pages: require auth
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes are protected separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     */
    '/((?!api|_next/static|_next/image).*)',
  ],
};
