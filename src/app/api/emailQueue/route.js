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
    console.log('EmailQueue API received request:', body);
    
    // Check if this is a bulk operation
    if (body.entries && Array.isArray(body.entries)) {
      console.log('Processing bulk entries:', body.entries.length);
      // Handle bulk entries
      const emailQueueData = readEmailQueue();
      const newEntries = [];
      
      for (const entry of body.entries) {
        const { 
          recipientEmail, 
          recipientName, 
          templateId, 
          senderEmail, 
          senderName,
          senderPassword,
          sendMode, 
          scheduledDate,
          emailCount,
          entryData
        } = entry;
        
        if (!recipientEmail || !templateId || !senderEmail || !sendMode) {
          console.error('Missing required fields in bulk entry:', entry);
          return NextResponse.json({ error: 'Missing required fields in bulk entry' }, { status: 400 });
        }
        
        const newQueueEntry = {
          id: entry.id || Date.now().toString(),
          recipientEmail,
          recipientName: recipientName || 'N/A',
          templateId,
          senderEmail,
          senderName: senderName || 'N/A',
          senderPassword: senderPassword || 'N/A',
          sendMode,
          scheduledDate: scheduledDate || null,
          emailCount: emailCount || 0,
          entryData: entryData || {},
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        emailQueueData.queue.push(newQueueEntry);
        newEntries.push(newQueueEntry);
      }
      
      console.log('Writing bulk entries to queue:', newEntries.length);
      if (writeEmailQueue(emailQueueData)) {
        console.log('Successfully wrote bulk entries to queue');
        return NextResponse.json({ 
          success: true, 
          message: `Added ${newEntries.length} entries to email queue`,
          entries: newEntries 
        });
      } else {
        console.error('Failed to write bulk entries to queue');
        return NextResponse.json({ error: 'Failed to save bulk email queue entries' }, { status: 500 });
      }
    } else {
      console.log('Processing single entry');
      // Handle single entry (existing logic)
      const { 
        recipientEmail, 
        recipientName, 
        templateId, 
        senderEmail, 
        senderName,
        senderPassword,
        sendMode, 
        scheduledDate,
        emailCount,
        entryData
      } = body;
      
      if (!recipientEmail || !templateId || !senderEmail || !sendMode) {
        console.error('Missing required fields in single entry:', body);
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
      
      const emailQueueData = readEmailQueue();
      const newQueueEntry = {
        id: Date.now().toString(),
        recipientEmail,
        recipientName: recipientName || 'N/A',
        templateId,
        senderEmail,
        senderName: senderName || 'N/A',
        senderPassword: senderPassword || 'N/A',
        sendMode,
        scheduledDate: scheduledDate || null,
        emailCount: emailCount || 0,
        entryData: entryData || {},
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      emailQueueData.queue.push(newQueueEntry);
      
      if (writeEmailQueue(emailQueueData)) {
        console.log('Successfully wrote single entry to queue');
        return NextResponse.json(newQueueEntry);
      } else {
        console.error('Failed to write single entry to queue');
        return NextResponse.json({ error: 'Failed to save email queue entry' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in emailQueue API:', error);
    return NextResponse.json({ error: 'Failed to create email queue entry' }, { status: 500 });
  }
}