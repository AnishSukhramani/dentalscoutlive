import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Require auth for API routes. Returns user or 401 NextResponse.
 * Usage: const auth = await requireAuth(request); if (auth instanceof NextResponse) return auth;
 * @param {Request} request
 * @returns {Promise<{ id: string; email: string; name: string | null } | NextResponse>}
 */
export async function requireAuth(request) {
  const token = getTokenFromRequest(request);
  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from('auth_users')
    .select('id, email, name')
    .eq('id', payload.userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return user;
}

/**
 * Require auth OR valid CRON_SECRET. For routes called by cron (e.g. syncReplies).
 * Returns { cron: true } or { user } or 401 NextResponse.
 * @param {Request} request
 * @returns {Promise<{ cron: true } | { user: { id: string; email: string; name: string | null } } | NextResponse>}
 */
export async function requireAuthOrCron(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get('x-cron-secret') || bearer;

  if (cronSecret && headerSecret === cronSecret) {
    return { cron: true };
  }

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  return { user: auth };
}
