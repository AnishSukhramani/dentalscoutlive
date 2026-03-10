import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/authApi';

export async function PATCH(request, { params }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, touchpoints, status } = body;

    const updates = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Campaign name cannot be empty' }, { status: 400 });
      }
      updates.name = name.trim();
    }
    if (touchpoints !== undefined) {
      if (!Array.isArray(touchpoints)) {
        return NextResponse.json({ error: 'touchpoints must be an array' }, { status: 400 });
      }
      updates.touchpoints = touchpoints;
    }
    if (status !== undefined) {
      if (!['active', 'paused', 'stopped'].includes(status)) {
        return NextResponse.json({ error: 'status must be active, paused, or stopped' }, { status: 400 });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Provide name and/or touchpoints to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/campaigns/[id]:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/campaigns/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
