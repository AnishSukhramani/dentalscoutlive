import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, touchpoints, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    return NextResponse.json({ campaigns: data || [] });
  } catch (error) {
    console.error('Error in GET /api/campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    const campaignName = name.trim();

    const { data: inserted, error: insertError } = await supabase
      .from('campaigns')
      .insert([{ name: campaignName, touchpoints: [] }])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating campaign:', insertError);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    const campaignId = inserted.id;
    const firstTouchTemplateId = crypto.randomUUID();
    const firstTouchTagId = `camp:${campaignId}:tp1`;

    const firstTouchpoint = {
      touch_key: 'tp1',
      template_id: firstTouchTemplateId,
      touch_tag_id: firstTouchTagId
    };

    const { data: updated, error: updateError } = await supabase
      .from('campaigns')
      .update({ touchpoints: [firstTouchpoint] })
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      console.error('Error setting first touchpoint:', updateError);
      return NextResponse.json({ error: 'Campaign created but first touchpoint failed' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in POST /api/campaigns:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
