import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

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

export async function requireRole(request, allowedRoles = []) {
  const token = request.cookies.get('cleanflow_session')?.value;
  if (!token) return { error: 'Unauthorized', status: 401 };
  
  const payload = await verifyToken(token);
  if (!payload) return { error: 'Invalid Token', status: 401 };
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    return { error: 'Forbidden: Insufficient permissions', status: 403 };
  }
  
  return { user: payload };
}
