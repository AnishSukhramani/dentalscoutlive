import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data: queue, error } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ queue: queue || [] });
  } catch (error) {
    console.error('Error reading email queue:', error);
    return NextResponse.json({ error: 'Failed to read email queue' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('EmailQueue API received request:', body);
    
    // Check if this is a bulk operation
    if (body.entries && Array.isArray(body.entries)) {
      console.log('Processing bulk entries:', body.entries.length);
      
      // Validate all entries first
      for (const entry of body.entries) {
        if (!entry.recipientEmail || !entry.templateId || !entry.senderEmail || !entry.sendMode) {
          console.error('Missing required fields in bulk entry:', entry);
          return NextResponse.json({ error: 'Missing required fields in bulk entry' }, { status: 400 });
        }
      }
      
      // Insert bulk entries into Supabase
      const { data, error } = await supabase
        .from('email_queue')
        .insert(body.entries.map(entry => ({
          id: entry.id || Date.now().toString(),
          recipient_email: entry.recipientEmail,
          recipient_name: entry.recipientName || 'N/A',
          template_id: entry.templateId,
          sender_email: entry.senderEmail,
          sender_name: entry.senderName || 'N/A',
          sender_password: entry.senderPassword || 'N/A',
          send_mode: entry.sendMode,
          scheduled_date: entry.scheduledDate || null,
          email_count: entry.emailCount || 0,
          entry_data: entry.entryData || {},
          status: 'pending'
        })));

      if (error) throw error;
      
      return NextResponse.json({ 
        success: true, 
        message: `Added ${body.entries.length} entries to email queue`,
        entries: data 
      });
    } else {
      console.log('Processing single entry');
      
      // Validate single entry
      if (!body.recipientEmail || !body.templateId || !body.senderEmail || !body.sendMode) {
        console.error('Missing required fields in single entry:', body);
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      // Insert single entry into Supabase
      const { data, error } = await supabase
        .from('email_queue')
        .insert([{
          id: Date.now().toString(),
          recipient_email: body.recipientEmail,
          recipient_name: body.recipientName || 'N/A',
          template_id: body.templateId,
          sender_email: body.senderEmail,
          sender_name: body.senderName || 'N/A',
          sender_password: body.senderPassword || 'N/A',
          send_mode: body.sendMode,
          scheduled_date: body.scheduledDate || null,
          email_count: body.emailCount || 0,
          entry_data: body.entryData || {},
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error in emailQueue API:', error);
    return NextResponse.json({ error: 'Failed to create email queue entry' }, { status: 500 });
  }
} 