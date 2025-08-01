import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const queueFilePath = path.join(process.cwd(), 'data', 'emailQueue.json');
    const statsFilePath = path.join(process.cwd(), 'data', 'processingStats.json');
    
    // Read the email queue file
    let queueData = { queue: [] };
    try {
      const queueContent = await fs.readFile(queueFilePath, 'utf8');
      queueData = JSON.parse(queueContent);
    } catch (error) {
      // If file doesn't exist or is empty, use default
      console.log('Queue file not found or empty, using default');
    }

    // Read the processing statistics file
    let processingStats = {
      totalProcessed: 0,
      totalFailed: 0,
      lastProcessingTime: null,
      sessionProcessed: 0,
      sessionFailed: 0
    };
    try {
      const statsContent = await fs.readFile(statsFilePath, 'utf8');
      processingStats = JSON.parse(statsContent);
    } catch (error) {
      // If file doesn't exist, use default
      console.log('Processing stats file not found, using default');
    }

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