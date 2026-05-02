import { NextResponse } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase-middleware';
import { verifyPinTokenEdge } from '@/lib/auth-edge';


// --- Inlined tier helpers for Edge middleware ---
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
    '/admin/pricing', '/admin/staff', '/suspended', '/profile',
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/pricing', '/api/coupons', '/api/payments', '/api/stain-analysis',
    '/api/analytics', '/api/reports', '/api/staff', '/api/tasks', '/api/user/profile'
  ],
  hardware_bundle: [
    '/', '/orders', '/customers', '/inventory', '/logistics',
    '/admin/settings', '/admin/analytics', '/operations/assembly',
    '/support', '/reports', '/admin/billing', '/admin/staff',
    '/admin/pricing', '/suspended', '/profile',
    '/api/stores', '/api/stats', '/api/system', '/api/customers', '/api/orders', '/api/inventory', '/api/logistics', '/api/analytics', '/api/pricing', '/api/coupons', '/api/payments', '/api/stain-analysis',
    '/api/reports', '/api/staff', '/api/tasks', '/api/workflow', '/api/operations', '/api/user/profile'
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

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     * - api/auth (auth endpoints handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|icons|images|manifest.json|sw.js|api/auth|api/inngest).*)',
  ],
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
  
  // Get geolocation from Vercel edge headers
  const country = request.geo?.country || 'unknown';
  const city = request.geo?.city || 'unknown';

  // --- 1. Rate Limiting (Persistent via Supabase RPC) ---
  const isLocal = request.url.includes('localhost') || request.url.includes('127.0.0.1');
  let { supabase, response } = createMiddlewareSupabase(request);
  
  let limit = isLocal ? 1000 : 100;
  if (pathname.startsWith('/api/auth/login')) {
    limit = isLocal ? 100 : 20;
  } else if (pathname.startsWith('/api/webhooks')) {
    limit = isLocal ? 1000 : 50;
  }

  // Atomic check via Database RPC
  let isAllowed = true;
  if (!isLocal) {
    const { data, error: limitError } = await supabase.rpc('check_rate_limit', { 
      client_ip: ip, 
      max_hits: limit 
    });
    if (limitError) {
      console.error('[RateLimit Error]:', limitError);
    } else {
      isAllowed = data;
    }
  }

  if (isAllowed === false) {
    return new NextResponse('Too Many Requests. Rate limit exceeded.', { 
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }

  // --- 2. Lightweight Session Check ---
  const allCookies = request.cookies.getAll();
  const hasSupabaseCookie = allCookies.some(c => c.name.startsWith('sb-'));
  const pinToken = request.cookies.get('cleanflow_pin_session')?.value;

  const isPublicRoute = [
    '/', '/features', '/how-it-works', '/pricing', '/contact', 
    '/checkout', '/register', '/policy', '/login', '/suspended',
    '/waiting', '/enterprise-upgrade'
  ].includes(pathname) || pathname.startsWith('/api/webhooks/') || pathname.startsWith('/checkout/success') || pathname === '/api/payments/checkout';

  if (isPublicRoute) {
    response.headers.set('x-user-country', country);
    response.headers.set('x-user-city', city);
    return addSecurityHeaders(response);
  }

  if (!hasSupabaseCookie && !pinToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired or unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- 3. Full Session Verification ---
  // Re-syncing the client with request (if cookies changed)
  ({ supabase, response } = createMiddlewareSupabase(request));
  response.headers.set('x-user-country', country);
  response.headers.set('x-user-city', city);
  
  let user = null;
  if (hasSupabaseCookie) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  const pinUser = pinToken ? await verifyPinTokenEdge(pinToken) : null;

  if (!user && !pinUser) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired or unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // --- 4. Per-Tenant Rate Limiting ---
  const storeId = user?.user_metadata?.store_id || pinUser?.store_id;
  if (storeId && !isLocal) {
    // Stricter limit per store to prevent one tenant from starving others
    const tenantLimit = 500; // Total concurrent requests allowed per store
    const { data: tenantAllowed, error: tenantLimitError } = await supabase.rpc('check_rate_limit', { 
      client_ip: `tenant_${storeId}`, 
      max_hits: tenantLimit 
    });
    
    if (tenantLimitError) {
      console.error('[TenantRateLimit Error]:', tenantLimitError);
    } else if (tenantAllowed === false) {
      return new NextResponse('Store rate limit exceeded. Please wait a moment.', { 
        status: 429,
        headers: { 'Retry-After': '30' }
      });
    }
  }

  // --- 5. Tier-Based Feature Gating ---
  if (user || pinUser) {
    const tier = normalizeTierMw(user?.user_metadata?.tier || pinUser?.tier);
    const appRole = user?.user_metadata?.role || pinUser?.role;
    const appId = user?.user_metadata?.app_user_id || pinUser?.id;

    const isSaasOwner = appRole === 'superadmin';

    if (!isSaasOwner && !canAccessRouteMw(tier, pathname)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Feature restricted by subscription tier' }, 
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return addSecurityHeaders(response);
}

function addSecurityHeaders(response) {
  const securityEndpoint = process.env.GLITCHTIP_SECURITY_ENDPOINT;
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.glitchtip.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://*.supabase.co https://*.glitchtip.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.glitchtip.com https://api.razorpay.com",
    "frame-src 'self' https://api.razorpay.com",
    `report-uri ${securityEndpoint || ''}`
  ].filter(Boolean).join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}
