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
    // Get scheduled emails from Supabase
    const { data: scheduledEmails, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    
    const now = new Date();
    const upcomingEmails = scheduledEmails?.filter(email => {
      const scheduledTime = new Date(email.scheduled_date);
      return scheduledTime > now;
    }) || [];
    
    const overdueEmails = scheduledEmails?.filter(email => {
      const scheduledTime = new Date(email.scheduled_date);
      return scheduledTime <= now;
    }) || [];
    
    // Transform data to match expected format
    const transformedEmails = scheduledEmails?.map(email => ({
      id: email.id,
      emailData: email.email_data,
      scheduledDate: email.scheduled_date,
      status: email.status,
      createdAt: email.created_at
    })) || [];
    
    return NextResponse.json({
      success: true,
      scheduledEmails: {
        total: scheduledEmails?.length || 0,
        upcoming: upcomingEmails.length,
        overdue: overdueEmails.length,
        emails: transformedEmails
      }
    });
    
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduled emails' },
      { status: 500 }
    );
  }
} 