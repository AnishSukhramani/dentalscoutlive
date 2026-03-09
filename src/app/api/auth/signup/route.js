import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    const emailTrimmed = email?.trim?.();
    if (!validateEmail(emailTrimmed)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
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
