import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}
const key = new TextEncoder().encode(secretKey);

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Server-side helper to get the current user session from cookies.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('cleanflow_session')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireRole(request, allowedRoles = []) {
  const payload = await getSession();
  if (!payload) return { error: 'Unauthorized', status: 401 };
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    return { error: 'Forbidden: Insufficient permissions', status: 403 };
  }
  
  return { user: payload };
}
