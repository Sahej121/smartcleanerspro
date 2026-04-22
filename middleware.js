import { NextResponse } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase-middleware';
import { verifyPinTokenEdge } from '@/lib/auth-edge';

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
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/pricing', '/api/coupons', '/api/payments', '/api/stain-analysis',
    '/api/analytics', '/api/reports', '/api/staff', '/api/tasks'
  ],
  hardware_bundle: [
    '/', '/orders', '/customers', '/inventory', '/logistics',
    '/admin/settings', '/admin/analytics', '/operations/assembly',
    '/support', '/reports', '/admin/billing',
    '/admin/pricing', '/suspended',
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/analytics', '/api/pricing', '/api/coupons', '/api/payments', '/api/stain-analysis',
    '/api/reports', '/api/staff', '/api/tasks', '/api/workflow', '/api/operations'
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
    pathname === '/' ||
    pathname === '/features' ||
    pathname === '/how-it-works' ||
    pathname === '/pricing' ||
    pathname === '/contact' ||
    pathname === '/checkout' ||
    pathname === '/register' ||
    pathname.startsWith('/checkout/success') ||
    pathname === '/api/payments/checkout' ||
    pathname === '/api/payments/verify-session' ||
    pathname === '/policy'
  ) {
    // Still refresh the Supabase session for public routes (token rotation)
    const { response } = createMiddlewareSupabase(request);
    return addSecurityHeaders(response);
  }

  // Auth pages
  const isAuthPage = pathname === '/login';

  // --- Supabase Session Verification ---
  const { supabase, response } = createMiddlewareSupabase(request);
  const { data: { user } } = await supabase.auth.getUser();

  // --- PIN Session Fallback (Shadow Auth) ---
  const pinToken = request.cookies.get('cleanflow_pin_session')?.value;
  const pinUser = pinToken ? await verifyPinTokenEdge(pinToken) : null;

  if (pathname === '/' || pathname.startsWith('/login')) {
    console.log(`[MW] Path: ${pathname}, User: ${user?.id || 'none'}, PIN User: ${pinUser?.id || 'none'}`);
  }

  // No session (neither Supabase nor PIN), trying to access protected route
  if (!user && !pinUser && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Has session, trying to access auth pages
  // We remove this redirect so that even if a session persists (but is invalid for the app),
  // the user can always reach the login page to re-authenticate.
  /*
  if ((user || pinUser) && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  */

  // --- 3. Tier-Based Feature Gating ---
  // Read tier from either Supabase user_metadata or PIN JWT payload
  if ((user || pinUser) && !isAuthPage) {
    const tier = normalizeTierMw(user?.user_metadata?.tier || pinUser?.tier);
    const appRole = user?.user_metadata?.role || pinUser?.role;
    const appId = user?.user_metadata?.app_user_id || pinUser?.id;

    // SaaS owner (id=1, role=owner) bypasses all tier restrictions
    const isSaasOwner = appRole === 'owner' && appId === 1;

    if (!isSaasOwner && !canAccessRouteMw(tier, pathname)) {
      // If it's an API request, return JSON 403 instead of redirecting to an HTML page
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Feature restricted by subscription tier' }, 
          { status: 403 }
        );
      }
      // Redirect to dashboard — the gated page should not be visible at all
      console.log(`[MW] Gated Redirect: ${pathname} -> / (Tier: ${tier})`);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return addSecurityHeaders(response);
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
