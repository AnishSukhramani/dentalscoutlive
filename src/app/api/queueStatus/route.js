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
    // Get email queue from Supabase
    const { data: queue, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (queueError) throw queueError;

    // Get processing stats from Supabase
    const { data: stats, error: statsError } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      throw statsError;
    }

    // Use default stats if none exist
    const processingStats = stats || {
      total_processed: 0,
      total_failed: 0,
      session_processed: 0,
      session_failed: 0,
      last_processing_time: null
    };

    // Calculate queue statistics
    const totalInQueue = queue?.length || 0;
    const currentProcessedCount = queue?.filter(entry => entry.status === 'sent' || entry.status === 'processed' || entry.status === 'scheduled').length || 0;
    const failedCount = queue?.filter(entry => entry.status === 'failed').length || 0;
    const pendingCount = queue?.filter(entry => !entry.status || entry.status === 'pending').length || 0;

    // Use the processing stats for processed count since entries are removed after processing
    const processedCount = processingStats.session_processed + currentProcessedCount;

    // Check if there are any failed entries that need attention
    const hasFailedEntries = failedCount > 0;
    const hasUnprocessedEntries = pendingCount > 0;

    return NextResponse.json({
      success: true,
      queueStatus: {
        totalInQueue,
        processedCount,
        failedCount,
        pendingCount,
        hasFailedEntries,
        hasUnprocessedEntries,
        lastUpdated: new Date().toISOString()
      },
      processingStats: {
        totalProcessed: processingStats.total_processed,
        totalFailed: processingStats.total_failed,
        sessionProcessed: processingStats.session_processed,
        sessionFailed: processingStats.session_failed,
        lastProcessingTime: processingStats.last_processing_time
      }
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 