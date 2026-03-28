import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public assets, API auth routes, and PWA files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/suspended'
  ) {
    return NextResponse.next();
  }

  // Auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // Get session cookie
  const token = request.cookies.get('cleanflow_session')?.value;
  const payload = token ? await verifyToken(token) : null;

  // No session, trying to access protected route
  if (!payload && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Has session, trying to access auth pages
  if (payload && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
