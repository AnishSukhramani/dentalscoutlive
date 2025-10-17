import { NextResponse } from 'next/server';
import { getFailedEmails, retryFailedEmail, clearFailedEmails } from '@/lib/emailProcessor';

export async function GET() {
  try {
    console.log('Getting failed emails...');
    
    const failedEmails = await getFailedEmails();
    
    return NextResponse.json({
      success: true,
      failedEmails,
      count: failedEmails.length
    });
    
  } catch (error) {
    console.error('Error getting failed emails:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, emailId } = body;
    
    console.log(`Processing failed email action: ${action} for email: ${emailId}`);
    
    switch (action) {
      case 'retry':
        if (!emailId) {
          return NextResponse.json(
            { success: false, error: 'Email ID is required for retry action' },
            { status: 400 }
          );
        }
        
        const retryResult = await retryFailedEmail(emailId);
        
        return NextResponse.json({
          success: true,
          message: retryResult.message,
          action: 'retry',
          emailId
        });
        
      case 'clear':
        const clearResult = await clearFailedEmails();
        
        return NextResponse.json({
          success: true,
          message: clearResult.message,
          action: 'clear'
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Supported actions: retry, clear' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error processing failed email action:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
