import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  hashPassword,
  createToken,
  AUTH_COOKIE_OPTIONS,
} from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

function validatePassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= MIN_PASSWORD_LENGTH
  );
}

/** Constant-time comparison to prevent timing attacks */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAllowedEmailDomain(email) {
  const allowedDomains = process.env.SIGNUP_ALLOWED_DOMAINS;
  if (!allowedDomains || typeof allowedDomains !== 'string') return false;
  const domains = allowedDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  const emailLower = email.trim().toLowerCase();
  return domains.some((domain) => emailLower.endsWith(`@${domain}`));
}

function isSignupTokenValid(providedToken) {
  const expectedToken = process.env.SIGNUP_ACCESS_TOKEN;
  if (!expectedToken || typeof providedToken !== 'string') return false;
  return secureCompare(providedToken.trim(), expectedToken);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, signupToken } = body;

    const emailTrimmed = email?.trim?.();
    if (!validateEmail(emailTrimmed)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!isAllowedEmailDomain(emailTrimmed)) {
      return NextResponse.json(
        { error: 'Only company email addresses can create an account' },
        { status: 403 }
      );
    }

    if (!isSignupTokenValid(signupToken)) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 403 }
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', emailTrimmed.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error } = await supabase
      .from('auth_users')
      .insert([
        {
          email: emailTrimmed.toLowerCase(),
          password_hash: passwordHash,
          name: typeof name === 'string' ? name.trim() || null : null,
        },
      ])
      .select('id, email, name')
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    const token = await createToken(user.id, user.email);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
    });

    response.cookies.set(AUTH_COOKIE_OPTIONS.name, token, {
      httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
      secure: AUTH_COOKIE_OPTIONS.secure,
      sameSite: AUTH_COOKIE_OPTIONS.sameSite,
      path: AUTH_COOKIE_OPTIONS.path,
      maxAge: AUTH_COOKIE_OPTIONS.maxAge,
    });

    return response;
  } catch (err) {
    console.error('Error in signup:', err);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
