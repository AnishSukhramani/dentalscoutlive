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
    // Get processing stats from Supabase
    const { data: stats, error } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Use default stats if none exist
    const processingStats = stats || {
      total_processed: 0,
      total_failed: 0,
      session_processed: 0,
      session_failed: 0,
      last_processing_time: null
    };

    return NextResponse.json({
      success: true,
      processingStats: {
        totalProcessed: processingStats.total_processed,
        totalFailed: processingStats.total_failed,
        sessionProcessed: processingStats.session_processed,
        sessionFailed: processingStats.session_failed,
        lastProcessingTime: processingStats.last_processing_time,
        createdAt: processingStats.created_at,
        updatedAt: processingStats.updated_at
      }
    });

  } catch (error) {
    console.error('Error fetching processing stats:', error);
    return NextResponse.json({ error: 'Failed to fetch processing stats' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { totalProcessed, totalFailed, sessionProcessed, sessionFailed } = await request.json();
    
    // Get current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let stats;
    if (fetchError && fetchError.code === 'PGRST116') {
      // No stats exist, create new record
      stats = {
        total_processed: 0,
        total_failed: 0,
        session_processed: 0,
        session_failed: 0
      };
    } else if (fetchError) {
      throw fetchError;
    } else {
      stats = currentStats;
    }
    
    // Update stats
    const updatedStats = {
      total_processed: (stats.total_processed || 0) + (totalProcessed || 0),
      total_failed: (stats.total_failed || 0) + (totalFailed || 0),
      session_processed: (stats.session_processed || 0) + (sessionProcessed || 0),
      session_failed: (stats.session_failed || 0) + (sessionFailed || 0),
      last_processing_time: new Date().toISOString()
    };
    
    let result;
    if (stats.id) {
      // Update existing record
      const { data, error } = await supabase
        .from('email_processing_stats')
        .update(updatedStats)
        .eq('id', stats.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('email_processing_stats')
        .insert([updatedStats])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return NextResponse.json({
      success: true,
      processingStats: {
        totalProcessed: result.total_processed,
        totalFailed: result.total_failed,
        sessionProcessed: result.session_processed,
        sessionFailed: result.session_failed,
        lastProcessingTime: result.last_processing_time,
        updatedAt: result.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating processing stats:', error);
    return NextResponse.json({ error: 'Failed to update processing stats' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { totalProcessed, totalFailed, sessionProcessed, sessionFailed, lastProcessingTime } = await request.json();
    
    // Get current stats
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
      // Update existing record
      const { data, error } = await supabase
        .from('email_processing_stats')
        .update({
          total_processed: totalProcessed !== undefined ? totalProcessed : currentStats.total_processed,
          total_failed: totalFailed !== undefined ? totalFailed : currentStats.total_failed,
          session_processed: sessionProcessed !== undefined ? sessionProcessed : currentStats.session_processed,
          session_failed: sessionFailed !== undefined ? sessionFailed : currentStats.session_failed,
          last_processing_time: lastProcessingTime || currentStats.last_processing_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentStats.id)
        .select()
        .single();
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        processingStats: {
          totalProcessed: data.total_processed,
          totalFailed: data.total_failed,
          sessionProcessed: data.session_processed,
          sessionFailed: data.session_failed,
          lastProcessingTime: data.last_processing_time,
          updatedAt: data.updated_at
        }
      });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('email_processing_stats')
        .insert([{
          total_processed: totalProcessed || 0,
          total_failed: totalFailed || 0,
          session_processed: sessionProcessed || 0,
          session_failed: sessionFailed || 0,
          last_processing_time: lastProcessingTime || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        processingStats: {
          totalProcessed: data.total_processed,
          totalFailed: data.total_failed,
          sessionProcessed: data.session_processed,
          sessionFailed: data.session_failed,
          lastProcessingTime: data.last_processing_time,
          createdAt: data.created_at
        }
      });
    }

  } catch (error) {
    console.error('Error updating processing stats:', error);
    return NextResponse.json({ error: 'Failed to update processing stats' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Reset all processing stats
    const { data, error } = await supabase
      .from('email_processing_stats')
      .update({
        total_processed: 0,
        total_failed: 0,
        session_processed: 0,
        session_failed: 0,
        last_processing_time: null,
        updated_at: new Date().toISOString()
      })
      .order('created_at', { ascending: false })
      .limit(1)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      message: 'Processing stats reset successfully',
      processingStats: {
        totalProcessed: data.total_processed,
        totalFailed: data.total_failed,
        sessionProcessed: data.session_processed,
        sessionFailed: data.session_failed,
        lastProcessingTime: data.last_processing_time
      }
    });

  } catch (error) {
    console.error('Error resetting processing stats:', error);
    return NextResponse.json({ error: 'Failed to reset processing stats' }, { status: 500 });
  }
}
