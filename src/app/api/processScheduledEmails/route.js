import { NextResponse } from 'next/server';
import { processScheduledEmails } from '../../../lib/emailProcessor.js';

export async function POST() {
  try {
    console.log('Processing scheduled emails...');
    
    // Import and call the processScheduledEmails function
    const { processScheduledEmails } = await import('../../../lib/emailProcessor.js');
    await processScheduledEmails();
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled emails processed successfully'
    });
    
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process scheduled emails' },
      { status: 500 }
    );
  }
} 