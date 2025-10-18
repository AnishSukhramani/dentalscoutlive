import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, subject, body: templateBody } = body;
    
    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        name,
        subject,
        body: templateBody,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating template:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PUT /api/templates/[id]:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
} 