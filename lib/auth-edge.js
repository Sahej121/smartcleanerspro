import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.SUPABASE_AUTH_JWT_SECRET || 'cleanflow_default_secret_for_local_dev'
);

/**
 * Verifies a custom JWT for PIN-based sessions. Edge-compatible.
 */
export async function verifyPinTokenEdge(token) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}
