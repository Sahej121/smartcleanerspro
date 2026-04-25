import { createServerSupabase } from './supabase-server';
import { query } from './db/db';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_AUTH_JWT_SECRET || process.env.JWT_SECRET || 'cleanflow_default_secret_for_local_dev'
);

function normalizeTier(tier) {
  const map = {
    starter: 'software_only',
    standard: 'software_only',
    growth: 'hardware_bundle',
    pro: 'enterprise',
  };
  return map[tier] || tier || 'software_only';
}

/**
 * Hashing utilities for legacy/PIN passwords
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * JWT utilities for PIN-based sessions
 */
export async function signPinToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyPinToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}

// Alias for compatibility
export async function verifyToken(token) {
  return verifyPinToken(token);
}

/**
 * Gets the current session from either Supabase Auth or a PIN-based session.
 * Cached per-request to avoid redundant database/network calls.
 */
export const getSession = cache(async () => {
  try {
    const supabase = await createServerSupabase();

    // Fast check: getSession() first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let userId = null;
    let authUser = null;

    if (!sessionError && session?.user) {
      authUser = session.user;
      userId = authUser.id;
    } else {
      // Fallback for PIN-based sessions
      const cookieStore = await cookies();
      const pinToken = cookieStore.get('cleanflow_pin_session')?.value;
      if (pinToken) {
        return await verifyPinToken(pinToken);
      }
      return null;
    }

    // Look up the application user by auth_id (Supabase Auth UUID)
    const res = await query(
      `SELECT u.*, s.subscription_tier, s.status as store_status, s.branding_logo, s.store_name 
       FROM users u 
       LEFT JOIN stores s ON u.store_id = s.id 
       WHERE u.auth_id = $1`,
      [userId]
    );

    if (res.rows.length > 0) {
      const appUser = res.rows[0];
      return {
        id: appUser.id,
        name: appUser.name,
        email: appUser.email || authUser.email,
        role: appUser.role,
        store_id: appUser.store_id,
        tier: normalizeTier(appUser.subscription_tier),
        suspended: appUser.store_status === 'suspended',
        auth_id: userId,
        type: 'supabase',
        language: appUser.language || 'en',
        branding: {
          name: appUser.store_name || "Dry Cleaner's flow",
          logo: appUser.branding_logo || 'C'
        }
      };
    }

    return null;
  } catch (error) {
    console.error('[Auth] getSession error:', error);
    return null;
  }
});

/**
 * Requires a specific role for a route handler.
 */
export async function requireRole(request, allowedRoles) {
  const session = await getSession();
  if (!session) return { error: 'Unauthorized', status: 401 };

  // App-level superuser check
  const isSaasOwner = (session.role === 'superadmin') && session.id === 1;

  if (!isSaasOwner && !allowedRoles.includes(session.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  if (session.suspended) {
    return { error: 'Account suspended', status: 403 };
  }

  return { user: session };
}
