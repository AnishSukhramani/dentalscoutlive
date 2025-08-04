import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const scheduledEmailsPath = path.join(process.cwd(), 'data', 'scheduledEmails.json');
    
    let scheduledEmails = [];
    try {
      const data = await fs.readFile(scheduledEmailsPath, 'utf8');
      scheduledEmails = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, return empty array
      scheduledEmails = [];
    }
    
    const now = new Date();
    const upcomingEmails = scheduledEmails.filter(email => {
      const scheduledTime = new Date(email.scheduledDate);
      return scheduledTime > now;
    });
    
    const overdueEmails = scheduledEmails.filter(email => {
      const scheduledTime = new Date(email.scheduledDate);
      return scheduledTime <= now;
    });
    
    return NextResponse.json({
      success: true,
      scheduledEmails: {
        total: scheduledEmails.length,
        upcoming: upcomingEmails.length,
        overdue: overdueEmails.length,
        emails: scheduledEmails
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