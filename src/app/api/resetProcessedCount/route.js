import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST() {
  try {
    const statsFilePath = path.join(process.cwd(), 'data', 'processingStats.json');
    
    // Read current stats
    let stats = {
      totalProcessed: 0,
      totalFailed: 0,
      lastProcessingTime: null,
      sessionProcessed: 0,
      sessionFailed: 0
    };
    
    try {
      const statsContent = await fs.readFile(statsFilePath, 'utf8');
      stats = JSON.parse(statsContent);
    } catch (error) {
      // If file doesn't exist, use default
      console.log('Processing stats file not found, creating new one');
    }
    
    // Reset only the session processed count
    stats.sessionProcessed = 0;
    stats.lastProcessingTime = new Date().toISOString();
    
    // Write back to file
    await fs.writeFile(statsFilePath, JSON.stringify(stats, null, 2));
    
    console.log('Reset session processed count to 0');
    
    return NextResponse.json({
      success: true,
      message: 'Processed count reset successfully'
    });

  } catch (error) {
    console.error('Error resetting processed count:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 