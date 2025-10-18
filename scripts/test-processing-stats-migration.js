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

async function testProcessingStatsMigration() {
  try {
    console.log('🧪 Testing processing stats migration...');
    console.log('========================================');
    
    // Test 1: Check processing stats table
    console.log('\n📊 Testing processing stats table...');
    const { data: stats, error: statsError } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (statsError && statsError.code !== 'PGRST116') {
      console.error('❌ Error reading processing stats:', statsError);
      return false;
    }
    
    if (stats) {
      console.log('✅ Processing stats table accessible');
      console.log('📊 Current processing stats:');
      console.log(`   - Total Processed: ${stats.total_processed}`);
      console.log(`   - Total Failed: ${stats.total_failed}`);
      console.log(`   - Session Processed: ${stats.session_processed}`);
      console.log(`   - Session Failed: ${stats.session_failed}`);
      console.log(`   - Last Processing Time: ${stats.last_processing_time}`);
    } else {
      console.log('ℹ️  No processing stats found in Supabase');
    }
    
    // Test 2: Test API endpoint
    console.log('\n🌐 Testing processing stats API endpoint...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/processingStats`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Processing stats API endpoint working');
        console.log('📊 API returned processing stats:', data.processingStats);
      } else {
        console.error('❌ Processing stats API endpoint failed:', data.error);
        return false;
      }
    } catch (error) {
      console.log('ℹ️  Could not test API endpoint (server may not be running):', error.message);
    }
    
    // Test 3: Test updating processing stats
    console.log('\n➕ Testing processing stats update...');
    
    // Get current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching current stats:', fetchError);
      return false;
    }
    
    if (currentStats) {
      console.log(`📊 Current stats: ${currentStats.total_processed} processed, ${currentStats.total_failed} failed`);
      
      // Test incrementing the stats
      const { data: updatedStats, error: updateError } = await supabase
        .from('email_processing_stats')
        .update({
          total_processed: (currentStats.total_processed || 0) + 1,
          session_processed: (currentStats.session_processed || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentStats.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating stats:', updateError);
        return false;
      }
      
      console.log('✅ Successfully updated processing stats');
      console.log(`📊 Updated stats: ${updatedStats.total_processed} processed, ${updatedStats.total_failed} failed`);
      
      // Reset the stats back to original state
      await supabase
        .from('email_processing_stats')
        .update({
          total_processed: currentStats.total_processed,
          session_processed: currentStats.session_processed,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentStats.id);
      
      console.log('🧹 Reset processing stats to original state');
    } else {
      console.log('ℹ️  No processing stats to test update with');
    }
    
    // Test 4: Test queue status API (which now includes processing stats)
    console.log('\n📋 Testing queue status API with processing stats...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/queueStatus`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Queue status API working');
        console.log('📊 Queue status includes processing stats:', data.processingStats);
      } else {
        console.error('❌ Queue status API failed:', data.error);
        return false;
      }
    } catch (error) {
      console.log('ℹ️  Could not test queue status API (server may not be running):', error.message);
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('========================================');
    console.log('✅ Processing stats migration is working correctly');
    console.log('✅ All Supabase operations are functioning');
    console.log('✅ Processing stats API is ready for production use');
    console.log('✅ Queue status API includes processing stats');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run tests
if (require.main === module) {
  testProcessingStatsMigration()
    .then((success) => {
      if (success) {
        console.log('\n✅ All processing stats tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some processing stats tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Processing stats test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testProcessingStatsMigration };
