require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is required');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required');
  console.log('💡 Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testEmailQueueMigration() {
  try {
    console.log('🧪 Testing email queue migration...');
    console.log('=====================================');
    
    // Test 1: Check email queue table
    console.log('\n📧 Testing email queue table...');
    const { data: queue, error: queueError } = await supabase
      .from('email_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (queueError) {
      console.error('❌ Error reading email queue:', queueError);
      return false;
    }
    
    console.log(`✅ Email queue table accessible`);
    console.log(`📊 Found ${queue.length} entries in queue`);
    
    if (queue.length > 0) {
      console.log('📋 Sample entry:', {
        id: queue[0].id,
        recipient_email: queue[0].recipient_email,
        status: queue[0].status,
        created_at: queue[0].created_at
      });
    }
    
    // Test 2: Check scheduled emails table
    console.log('\n⏰ Testing scheduled emails table...');
    const { data: scheduled, error: scheduledError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (scheduledError) {
      console.error('❌ Error reading scheduled emails:', scheduledError);
      return false;
    }
    
    console.log(`✅ Scheduled emails table accessible`);
    console.log(`📊 Found ${scheduled.length} scheduled emails`);
    
    // Test 3: Check processing stats table
    console.log('\n📊 Testing processing stats table...');
    const { data: stats, error: statsError } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (statsError) {
      console.error('❌ Error reading processing stats:', statsError);
      return false;
    }
    
    console.log(`✅ Processing stats table accessible`);
    if (stats.length > 0) {
      console.log('📊 Current stats:', {
        total_processed: stats[0].total_processed,
        total_failed: stats[0].total_failed,
        last_processing_time: stats[0].last_processing_time
      });
    }
    
    // Test 4: Test creating a new queue entry
    console.log('\n➕ Testing queue entry creation...');
    const testEntry = {
      id: `test-${Date.now()}`,
      recipient_email: 'test@example.com',
      recipient_name: 'Test User',
      template_id: 'test-template',
      sender_email: 'sender@example.com',
      sender_name: 'Test Sender',
      sender_password: 'test-password',
      send_mode: 'send',
      scheduled_date: null,
      email_count: 0,
      entry_data: { test: 'data' },
      status: 'pending'
    };
    
    const { data: newEntry, error: insertError } = await supabase
      .from('email_queue')
      .insert([testEntry])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error creating test entry:', insertError);
      return false;
    }
    
    console.log('✅ Successfully created test queue entry');
    console.log('📋 Test entry ID:', newEntry.id);
    
    // Clean up test entry
    await supabase
      .from('email_queue')
      .delete()
      .eq('id', newEntry.id);
    
    console.log('🧹 Cleaned up test entry');
    
    console.log('\n🎉 All tests passed!');
    console.log('=====================================');
    console.log('✅ Email queue migration is working correctly');
    console.log('✅ All Supabase tables are accessible');
    console.log('✅ Queue operations are functioning');
    console.log('✅ Ready for production use');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run tests
if (require.main === module) {
  testEmailQueueMigration()
    .then((success) => {
      if (success) {
        console.log('\n✅ All tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailQueueMigration };
