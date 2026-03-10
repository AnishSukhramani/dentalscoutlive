import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/authApi';

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');

    let query = supabase.from('email_templates').select('*').order('created_at', { ascending: false });
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error in GET /api/templates:', error);
    return NextResponse.json({ error: 'Failed to read templates' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const { name, subject, body: templateBody, campaign_id, template_id } = body;
    
    const isFromTouchpoint = campaign_id && template_id;
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    // Allow empty subject/body when creating from touchpoint (campaign-centric flow)
    const safeSubject = typeof subject === 'string' ? subject : '';
    const safeBody = typeof templateBody === 'string' ? templateBody : '';
    if (!isFromTouchpoint && !safeBody.trim()) {
      return NextResponse.json({ error: 'Template body is required' }, { status: 400 });
    }
    
    const newTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      subject: safeSubject,
      body: safeBody,
      campaign_id: campaign_id || null,
      template_id: template_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('email_templates')
      .insert([newTemplate])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/templates:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/templates:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
} 