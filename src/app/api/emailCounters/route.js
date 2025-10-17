import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EMAIL_COUNTERS_FILE_PATH = path.join(process.cwd(), 'data', 'emailCounters.json');

const readEmailCounters = () => {
  try {
    const data = fs.readFileSync(EMAIL_COUNTERS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email counters file:', error);
    return { emailCounters: [] };
  }
};

const writeEmailCounters = (emailCounters) => {
  try {
    fs.writeFileSync(EMAIL_COUNTERS_FILE_PATH, JSON.stringify(emailCounters, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing email counters file:', error);
    return false;
  }
};

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
    const data = readEmailCounters();
    const now = new Date();
    
    // Process each counter to check for resets and block status
    const processedCounters = data.emailCounters.map(counter => {
      let processedCounter = { ...counter };
      
      // Check if we need to reset
      if (shouldResetCounter(counter.lastResetAt)) {
        processedCounter = resetCounter(counter);
      }
      
      // Check block status
      processedCounter = checkBlockStatus(processedCounter);
      
      return processedCounter;
    });
    
    // Save any changes back to file
    if (JSON.stringify(processedCounters) !== JSON.stringify(data.emailCounters)) {
      writeEmailCounters({ emailCounters: processedCounters });
    }
    
    return NextResponse.json({ emailCounters: processedCounters });
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
    
    const data = readEmailCounters();
    const counterIndex = data.emailCounters.findIndex(c => c.emailId === emailId);
    
    if (counterIndex === -1) {
      return NextResponse.json({ error: 'Email ID not found' }, { status: 404 });
    }
    
    const updatedCounter = updateCounter(data.emailCounters[counterIndex], isDirectSend);
    
    if (updatedCounter.error) {
      return NextResponse.json({ error: updatedCounter.error }, { status: 400 });
    }
    
    data.emailCounters[counterIndex] = updatedCounter;
    
    if (writeEmailCounters(data)) {
      return NextResponse.json({ 
        success: true, 
        counter: updatedCounter 
      });
    } else {
      return NextResponse.json({ error: 'Failed to update counter' }, { status: 500 });
    }
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
    
    const data = readEmailCounters();
    const counterIndex = data.emailCounters.findIndex(c => c.emailId === emailId);
    
    if (counterIndex === -1) {
      return NextResponse.json({ error: 'Email ID not found' }, { status: 404 });
    }
    
    data.emailCounters[counterIndex].dailyLimit = parseInt(dailyLimit);
    
    if (writeEmailCounters(data)) {
      return NextResponse.json({ 
        success: true, 
        counter: data.emailCounters[counterIndex] 
      });
    } else {
      return NextResponse.json({ error: 'Failed to update daily limit' }, { status: 500 });
    }
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
    
    const data = readEmailCounters();
    const counterIndex = data.emailCounters.findIndex(c => c.emailId === parseInt(emailId));
    
    if (counterIndex === -1) {
      return NextResponse.json({ error: 'Email ID not found' }, { status: 404 });
    }
    
    const resetCounter = {
      ...data.emailCounters[counterIndex],
      emailsSentToday: 0,
      lastResetAt: new Date().toISOString(),
      isBlocked: false,
      blockedUntil: null
    };
    
    data.emailCounters[counterIndex] = resetCounter;
    
    if (writeEmailCounters(data)) {
      return NextResponse.json({ 
        success: true, 
        counter: resetCounter 
      });
    } else {
      return NextResponse.json({ error: 'Failed to reset counter' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error resetting email counter:', error);
    return NextResponse.json({ error: 'Failed to reset email counter' }, { status: 500 });
  }
}