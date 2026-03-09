/**
 * Edge-safe auth utilities for middleware.
 * Only uses jose (no bcrypt) - safe for Edge Runtime.
 */
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'auth_token';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

/**
 * Verify JWT. Returns payload or null. Edge-safe.
 */
export async function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const secret = getJwtSecret();
    if (!secret) return null;
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub;
    const email = payload.email;
    if (!userId || !email) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

/**
 * Extract auth token from request (cookie or Authorization header). Edge-safe.
 */
export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
}
