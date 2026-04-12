import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Simple in-memory rate limiting map
// Note: In production with multiple server instances, use Redis.
const rateLimitMap = new Map();

// --- Inlined tier helpers for Edge middleware (cannot import tier-config.js) ---
const TIER_LEGACY_MAP = {
  starter: 'software_only',
  standard: 'software_only',
  growth: 'hardware_bundle',
  pro: 'enterprise',
};

const TIER_ROUTES = {
  software_only: [
    '/', '/orders', '/customers', '/inventory', '/logistics',
    '/admin/settings', '/support', '/reports', '/admin/billing',
    '/admin/pricing', '/suspended',
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/pricing', '/api/coupons', '/api/payments'
  ],
  hardware_bundle: [
    '/', '/orders', '/customers', '/inventory', '/logistics',
    '/admin/settings', '/admin/analytics', '/operations/assembly',
    '/operations/machines', '/support', '/reports', '/admin/billing',
    '/admin/pricing', '/suspended',
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/analytics', '/api/pricing', '/api/coupons', '/api/payments'
  ],
  enterprise: ['*'],
};

function normalizeTierMw(tier) {
  return TIER_LEGACY_MAP[tier] || tier || 'software_only';
}

function canAccessRouteMw(tier, route) {
  const allowed = TIER_ROUTES[tier];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.some(prefix => {
    if (prefix === '/') return route === '/';
    return route === prefix || route.startsWith(prefix + '/');
  });
}

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
    pathname.startsWith('/api/webhooks/') ||
    pathname.startsWith('/icons/') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/suspended' ||
    pathname === '/pricing'
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

  // --- 3. Tier-Based Feature Gating ---
  // Block access to routes the user's subscription tier doesn't include.
  // The tier is embedded in the JWT payload at login time.
  if (payload && !isAuthPage) {
    const tier = normalizeTierMw(payload.tier);

    // SaaS owner (id=1, role=owner) bypasses all tier restrictions
    const isSaasOwner = payload.role === 'owner' && payload.id === 1;

    if (!isSaasOwner && !canAccessRouteMw(tier, pathname)) {
      // If it's an API request, return JSON 403 instead of redirecting to an HTML page
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Feature restricted by subscription tier' }, 
          { status: 403 }
        );
      }
      // Redirect to dashboard — the gated page should not be visible at all
      return NextResponse.redirect(new URL('/', request.url));
    }
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
