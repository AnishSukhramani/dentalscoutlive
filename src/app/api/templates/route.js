import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

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
  try {
    const body = await request.json();
    const { name, subject, body: templateBody } = body;
    
    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const newTemplate = {
      id: Date.now().toString(),
      name,
      subject,
      body: templateBody,
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