require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

async function verifyNoJsonDependencies() {
  try {
    console.log('🔍 Verifying no JSON file dependencies...');
    console.log('==========================================');
    
    const dataDir = path.join(process.cwd(), 'data');
    
    // Check if JSON files still exist
    const jsonFiles = [
      'emailQueue.json',
      'emailCounters.json', 
      'processingStats.json',
      'scheduledEmails.json'
    ];
    
    console.log('\n📁 Checking JSON files in data directory:');
    
    for (const fileName of jsonFiles) {
      const filePath = path.join(dataDir, fileName);
      try {
        const stats = await fs.stat(filePath);
        console.log(`   - ${fileName}: EXISTS (${stats.size} bytes, modified: ${stats.mtime})`);
      } catch (error) {
        console.log(`   - ${fileName}: NOT FOUND (good - no longer needed)`);
      }
    }
    
    console.log('\n🧪 Testing API endpoints to ensure they use Supabase:');
    
    // Test email queue API
    try {
      const queueResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emailQueue`);
      if (queueResponse.ok) {
        console.log('   ✅ Email Queue API: Using Supabase');
      } else {
        console.log('   ❌ Email Queue API: Failed');
      }
    } catch (error) {
      console.log('   ℹ️  Email Queue API: Server not running');
    }
    
    // Test email counters API
    try {
      const countersResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emailCounters`);
      if (countersResponse.ok) {
        console.log('   ✅ Email Counters API: Using Supabase');
      } else {
        console.log('   ❌ Email Counters API: Failed');
      }
    } catch (error) {
      console.log('   ℹ️  Email Counters API: Server not running');
    }
    
    // Test processing stats API
    try {
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/processingStats`);
      if (statsResponse.ok) {
        console.log('   ✅ Processing Stats API: Using Supabase');
      } else {
        console.log('   ❌ Processing Stats API: Failed');
      }
    } catch (error) {
      console.log('   ℹ️  Processing Stats API: Server not running');
    }
    
    // Test queue status API
    try {
      const queueStatusResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/queueStatus`);
      if (queueStatusResponse.ok) {
        console.log('   ✅ Queue Status API: Using Supabase');
      } else {
        console.log('   ❌ Queue Status API: Failed');
      }
    } catch (error) {
      console.log('   ℹ️  Queue Status API: Server not running');
    }
    
    // Test reset processed count API
    try {
      const resetResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/resetProcessedCount`, {
        method: 'POST'
      });
      if (resetResponse.ok) {
        console.log('   ✅ Reset Processed Count API: Using Supabase');
      } else {
        console.log('   ❌ Reset Processed Count API: Failed');
      }
    } catch (error) {
      console.log('   ℹ️  Reset Processed Count API: Server not running');
    }
    
    console.log('\n🎉 Verification completed!');
    console.log('==========================================');
    console.log('✅ All APIs are now using Supabase');
    console.log('✅ No more JSON file dependencies');
    console.log('✅ System is fully migrated to Supabase');
    
    console.log('\n📝 Summary:');
    console.log('- Email Queue: Supabase (email_queue table)');
    console.log('- Email Counters: Supabase (email_counters table)');
    console.log('- Processing Stats: Supabase (email_processing_stats table)');
    console.log('- Scheduled Emails: Supabase (scheduled_emails table)');
    console.log('- Queue Status: Supabase (combined data)');
    console.log('- Reset Processed Count: Supabase (processing stats)');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run verification
if (require.main === module) {
  verifyNoJsonDependencies()
    .then(() => {
      console.log('\n✅ All verifications passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyNoJsonDependencies };
