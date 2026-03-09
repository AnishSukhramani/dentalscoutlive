import { NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/emailProcessor';
import { requireAuth } from '@/lib/authApi';

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    console.log('Processing email queue via API...');
    
    // Process the email queue
    await processEmailQueue();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email queue processed successfully' 
    });
    
  } catch (error) {
    console.error('Error processing email queue:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    // Return status information about the email processor
    const { getCurrentSenderEmail, EMAIL_CONFIGS } = await import('@/lib/emailProcessor');
    
    return NextResponse.json({
      success: true,
      currentSender: getCurrentSenderEmail(),
      configuredSenders: Object.keys(EMAIL_CONFIGS),
      message: 'Email processor status retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error getting email processor status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 