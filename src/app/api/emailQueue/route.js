import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const EMAIL_QUEUE_FILE_PATH = path.join(process.cwd(), 'data', 'emailQueue.json');

const readEmailQueue = () => {
  try {
    const data = fs.readFileSync(EMAIL_QUEUE_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { queue: [] };
  }
};

const writeEmailQueue = (emailQueue) => {
  try {
    // Ensure the data directory exists
    const dataDir = path.dirname(EMAIL_QUEUE_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(EMAIL_QUEUE_FILE_PATH, JSON.stringify(emailQueue, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing email queue:', error);
    return false;
  }
};

export async function GET() {
  try {
    const emailQueueData = readEmailQueue();
    return NextResponse.json(emailQueueData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read email queue' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      recipientEmail, 
      recipientName, 
      templateId, 
      senderEmail, 
      sendMode, 
      scheduledDate,
      emailCount 
    } = body;
    
    if (!recipientEmail || !templateId || !senderEmail || !sendMode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const emailQueueData = readEmailQueue();
    const newQueueEntry = {
      id: Date.now().toString(),
      recipientEmail,
      recipientName: recipientName || 'N/A',
      templateId,
      senderEmail,
      sendMode,
      scheduledDate: scheduledDate || null,
      emailCount: emailCount || 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    emailQueueData.queue.push(newQueueEntry);
    
    if (writeEmailQueue(emailQueueData)) {
      return NextResponse.json(newQueueEntry);
    } else {
      return NextResponse.json({ error: 'Failed to save email queue entry' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create email queue entry' }, { status: 500 });
  }
} 