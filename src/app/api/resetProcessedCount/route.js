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

export async function POST() {
  try {
    // Get current processing stats from Supabase
    const { data: currentStats, error: fetchError } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    if (currentStats) {
      // Reset only the session processed count
      const { data: updatedStats, error: updateError } = await supabase
        .from('email_processing_stats')
        .update({
          session_processed: 0,
          last_processing_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentStats.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      console.log('Reset session processed count to 0');
      
      return NextResponse.json({
        success: true,
        message: 'Processed count reset successfully',
        processingStats: {
          totalProcessed: updatedStats.total_processed,
          totalFailed: updatedStats.total_failed,
          sessionProcessed: updatedStats.session_processed,
          sessionFailed: updatedStats.session_failed,
          lastProcessingTime: updatedStats.last_processing_time
        }
      });
    } else {
      // No stats exist, create new entry with reset values
      const { data: newStats, error: createError } = await supabase
        .from('email_processing_stats')
        .insert([{
          total_processed: 0,
          total_failed: 0,
          session_processed: 0,
          session_failed: 0,
          last_processing_time: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      
      console.log('Created new processing stats entry with reset values');
      
      return NextResponse.json({
        success: true,
        message: 'Processed count reset successfully',
        processingStats: {
          totalProcessed: newStats.total_processed,
          totalFailed: newStats.total_failed,
          sessionProcessed: newStats.session_processed,
          sessionFailed: newStats.session_failed,
          lastProcessingTime: newStats.last_processing_time
        }
      });
    }

  } catch (error) {
    console.error('Error resetting processed count:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 