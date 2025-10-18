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

// Check if we need to reset the daily counter (24 hours have passed)
const shouldResetCounter = (lastResetAt) => {
  if (!lastResetAt) return true;
  
  const lastReset = new Date(lastResetAt);
  const now = new Date();
  const timeDiff = now - lastReset;
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff >= 24;
};

// Reset counter and update last reset time
const resetCounter = (counter) => {
  return {
    ...counter,
    emailsSentToday: 0,
    lastResetAt: new Date().toISOString(),
    isBlocked: false,
    blockedUntil: null
  };
};

// Check if email ID is blocked
const checkBlockStatus = (counter) => {
  if (!counter.blockedUntil) return counter;
  
  const blockedUntil = new Date(counter.blockedUntil);
  const now = new Date();
  
  if (now >= blockedUntil) {
    // Block has expired
    return {
      ...counter,
      isBlocked: false,
      blockedUntil: null
    };
  }
  
  return counter;
};

// Update counter when email is sent
const updateCounter = (counter, isDirectSend = true) => {
  let updatedCounter = { ...counter };
  
  // Check if we need to reset the counter
  if (shouldResetCounter(counter.lastResetAt)) {
    updatedCounter = resetCounter(counter);
  }
  
  // Check if block has expired
  updatedCounter = checkBlockStatus(updatedCounter);
  
  // If it's a direct send and the email is blocked, don't increment
  if (isDirectSend && updatedCounter.isBlocked) {
    return { ...updatedCounter, error: 'Email ID is blocked for direct sends' };
  }
  
  // Increment the counter for direct sends
  if (isDirectSend) {
    updatedCounter.emailsSentToday += 1;
    
    // Check if we've hit the daily limit
    if (updatedCounter.emailsSentToday >= updatedCounter.dailyLimit) {
      const blockedUntil = new Date();
      blockedUntil.setHours(blockedUntil.getHours() + 24);
      
      updatedCounter.isBlocked = true;
      updatedCounter.blockedUntil = blockedUntil.toISOString();
    }
  }
  
  return updatedCounter;
};

export async function GET() {
  try {
    // Get all email counters from Supabase
    const { data: counters, error } = await supabase
      .from('email_counters')
      .select('*')
      .order('email_id', { ascending: true });

    if (error) throw error;
    
    // Transform Supabase data to match the expected format
    const emailCounters = counters.map(counter => ({
      emailId: counter.email_id,
      email: `user${counter.email_id}@example.com`, // We'll get the actual email from user.json
      emailsSentToday: counter.direct_send_count + counter.scheduled_send_count,
      dailyLimit: 100, // Default limit, can be made configurable
      lastResetAt: counter.updated_at,
      blockedUntil: null,
      isBlocked: false
    }));
    
    return NextResponse.json({ emailCounters });
  } catch (error) {
    console.error('Error fetching email counters:', error);
    return NextResponse.json({ error: 'Failed to fetch email counters' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { emailId, isDirectSend = true } = await request.json();
    
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }
    
    // Get current counter from Supabase
    const { data: currentCounter, error: fetchError } = await supabase
      .from('email_counters')
      .select('*')
      .eq('email_id', emailId)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Email ID not found' }, { status: 404 });
      }
      throw fetchError;
    }
    
    // Update the appropriate counter
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (isDirectSend) {
      updateData.direct_send_count = (currentCounter.direct_send_count || 0) + 1;
    } else {
      updateData.scheduled_send_count = (currentCounter.scheduled_send_count || 0) + 1;
    }
    
    updateData.total_count = (updateData.direct_send_count || currentCounter.direct_send_count || 0) + 
                           (updateData.scheduled_send_count || currentCounter.scheduled_send_count || 0);
    
    // Update in Supabase
    const { data: updatedCounter, error: updateError } = await supabase
      .from('email_counters')
      .update(updateData)
      .eq('email_id', emailId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return NextResponse.json({ 
      success: true, 
      counter: {
        emailId: updatedCounter.email_id,
        directSendCount: updatedCounter.direct_send_count,
        scheduledSendCount: updatedCounter.scheduled_send_count,
        totalCount: updatedCounter.total_count,
        updatedAt: updatedCounter.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating email counter:', error);
    return NextResponse.json({ error: 'Failed to update email counter' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { emailId, dailyLimit } = await request.json();
    
    if (!emailId || dailyLimit === undefined) {
      return NextResponse.json({ error: 'Email ID and daily limit are required' }, { status: 400 });
    }
    
    // For now, we'll just return success since the Supabase schema doesn't have daily limit
    // This can be extended later if needed
    return NextResponse.json({ 
      success: true, 
      message: 'Daily limit update not implemented in Supabase version yet' 
    });
  } catch (error) {
    console.error('Error updating daily limit:', error);
    return NextResponse.json({ error: 'Failed to update daily limit' }, { status: 500 });
  }
}

// Reset a specific email ID counter (for testing/override)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');
    
    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }
    
    // Reset counters in Supabase
    const { data: resetCounter, error } = await supabase
      .from('email_counters')
      .update({
        direct_send_count: 0,
        scheduled_send_count: 0,
        total_count: 0,
        updated_at: new Date().toISOString()
      })
      .eq('email_id', parseInt(emailId))
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Email ID not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      counter: {
        emailId: resetCounter.email_id,
        directSendCount: resetCounter.direct_send_count,
        scheduledSendCount: resetCounter.scheduled_send_count,
        totalCount: resetCounter.total_count,
        updatedAt: resetCounter.updated_at
      }
    });
  } catch (error) {
    console.error('Error resetting email counter:', error);
    return NextResponse.json({ error: 'Failed to reset email counter' }, { status: 500 });
  }
}
