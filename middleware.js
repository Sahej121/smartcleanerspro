import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Simple in-memory rate limiting map
// Note: In production with multiple server instances, use Redis.
const rateLimitMap = new Map();

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

  // --- 1. Rate Limiting (Increased for Local Dev/Tests) ---
  const now = Date.now();
  const windowMs = 60 * 1000;
  const isLocal = request.url.includes('localhost') || request.url.includes('127.0.0.1');
  const limit = isLocal ? 1000 : 100; // Allow 1000 requests/min for local dev/tests

  const userRequests = rateLimitMap.get(ip) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
  
  if (recentRequests.length >= limit) {
    console.warn(`[RATE LIMIT] Exceeded for IP: ${ip} on path: ${pathname}`);
    return new NextResponse('Too Many Requests. Rate limit exceeded.', { 
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);

  // Cleanup map periodically (simple heuristic)
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.length === 0 || now - value[value.length - 1] > windowMs) {
        rateLimitMap.delete(key);
      }
    }
  }

  // --- 2. Route Protection ---
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
    return addSecurityHeaders(NextResponse.next());
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

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
