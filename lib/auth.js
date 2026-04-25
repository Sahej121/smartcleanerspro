import * as jose from 'jose';
import { createServerSupabase } from '@/lib/supabase-server';
import { query } from '@/lib/db/db';
import { normalizeTier } from '@/lib/tier-config';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_AUTH_JWT_SECRET || 'cleanflow_default_secret_for_local_dev'
);

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a custom JWT for PIN-based sessions.
 */
export async function signPinToken(payload) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/**
 * Verifies a custom JWT for PIN-based sessions.
 */
export async function verifyPinToken(token) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Server-side helper to get the current user session from Supabase Auth,
 * enriched with application-level data (role, store_id, tier).
 */
export async function getSession() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      // Look up the application user by auth_id (Supabase Auth UUID)
      const res = await query(
        `SELECT u.*, s.subscription_tier, s.status as store_status, s.branding_logo, s.store_name 
         FROM users u 
         LEFT JOIN stores s ON u.store_id = s.id 
         WHERE u.auth_id = $1`,
        [user.id]
      );

      if (res.rows.length > 0) {
        const appUser = res.rows[0];
        return {
          id: appUser.id,
          name: appUser.name,
          email: appUser.email,
          role: appUser.role,
          store_id: appUser.store_id,
          tier: normalizeTier(appUser.subscription_tier),
          suspended: appUser.store_status === 'suspended',
          auth_id: user.id,
          type: 'supabase',
          // New preferences
          language: appUser.language || 'en',
          branding: {
            name: appUser.store_name || "Dry Cleaner's flow",
            logo: appUser.branding_logo || 'C'
          }
        };
      }
    }

    // Fallback: Check for custom PIN session
    const cookieStore = await cookies();
    const pinToken = cookieStore.get('cleanflow_pin_session')?.value;

    if (pinToken) {
      const payload = await verifyPinToken(pinToken);
      if (payload) {
        // For PIN sessions, we still want to check suspension status and fetch preferences
        const res = await query(
          `SELECT u.language, s.status, s.branding_logo, s.store_name 
           FROM users u 
           LEFT JOIN stores s ON u.store_id = s.id 
           WHERE u.id = $1`,
          [payload.id]
        );

        let extra = {};
        if (res.rows.length > 0) {
          const row = res.rows[0];
          extra = {
            suspended: row.status === 'suspended',
            language: row.language || 'en',
            branding: {
              name: row.store_name || "Dry Cleaner's flow",
              logo: row.branding_logo || 'C'
            }
          };
        }

        return {
          ...payload,
          ...extra,
          type: 'pin'
        };
      }
    }

    return null;
  } catch (err) {
    console.error('[Auth] getSession error:', err);
    return null;
  }
}

/**
 * Verify that the current user has one of the allowed roles.
 * Used by API route handlers for authorization.
 */
export async function requireRole(request, allowedRoles = []) {
  const payload = await getSession();
  if (!payload) return { error: 'Unauthorized', status: 401 };

  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    return { error: 'Forbidden: Insufficient permissions', status: 403 };
  }

  return { user: payload };
}

/**
 * Lightweight token verification for middleware (Edge-compatible).
 * This is a best-effort check; full validation happens via getSession().
 * The middleware uses its own Supabase client — see supabase-middleware.js.
 */
export const createToken = signPinToken;
export async function verifyToken() {
  const session = await getSession();
  return session;
}
