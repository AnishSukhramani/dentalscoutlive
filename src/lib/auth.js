import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'auth_token';
const JWT_EXPIRY = '7d';
const BCRYPT_ROUNDS = 10;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Hash a plain-text password for storage.
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Bcrypt hash
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a plain-text password against a stored hash.
 * @param {string} password - Plain text password
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Create a signed JWT for the given user.
 * @param {string} userId - User UUID
 * @param {string} email - User email
 * @returns {Promise<string>} Signed JWT
 */
export async function createToken(userId, email) {
  const secret = getJwtSecret();
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

/**
 * Verify and decode a JWT. Returns payload or null if invalid.
 * @param {string} token - JWT string
 * @returns {Promise<{ userId: string; email: string } | null>} Decoded payload or null
 */
export async function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const secret = getJwtSecret();
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
 * Extract auth token from a Request (cookie or Authorization header).
 * Works in API routes and middleware.
 * @param {Request} request - Incoming request
 * @returns {string | null} Token or null if not found
 */
export function getTokenFromRequest(request) {
  // Try Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match) return match[1];
  }

  return null;
}

/**
 * Cookie options for setting the auth token.
 * Use with Response.setHeader or NextResponse.cookies.set.
 */
export const AUTH_COOKIE_OPTIONS = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
};
