import { NextResponse } from 'next/server';
const { getEmailQueue, getProcessingStats } = require('@/lib/kvStorage');

export async function GET() {
  try {
    // Read the email queue and processing stats from KV
    const queueData = await getEmailQueue();
    const processingStats = await getProcessingStats();

    // Calculate queue statistics
    const totalInQueue = queueData.queue.length;
    const currentProcessedCount = queueData.queue.filter(entry => entry.status === 'sent' || entry.status === 'processed' || entry.status === 'scheduled').length;
    const failedCount = queueData.queue.filter(entry => entry.status === 'failed').length;
    const pendingCount = queueData.queue.filter(entry => !entry.status || entry.status === 'pending').length;

    // Use the processing stats for processed count since entries are removed after processing
    const processedCount = processingStats.sessionProcessed + currentProcessedCount;

    // Check if there are any failed entries that need attention
    const hasFailedEntries = failedCount > 0;
    const hasUnprocessedEntries = pendingCount > 0;

    return NextResponse.json({
      success: true,
      queueStatus: {
        totalInQueue,
        processedCount,
        failedCount,
        pendingCount,
        hasFailedEntries,
        hasUnprocessedEntries,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting queue status:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 