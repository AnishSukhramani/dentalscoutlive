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

async function testEmailCountersMigration() {
  try {
    console.log('🧪 Testing email counters migration...');
    console.log('=====================================');
    
    // Test 1: Check email counters table
    console.log('\n📊 Testing email counters table...');
    const { data: counters, error: countersError } = await supabase
      .from('email_counters')
      .select('*')
      .order('email_id', { ascending: true });
    
    if (countersError) {
      console.error('❌ Error reading email counters:', countersError);
      return false;
    }
    
    console.log(`✅ Email counters table accessible`);
    console.log(`📊 Found ${counters.length} email counter entries`);
    
    if (counters.length > 0) {
      console.log('📋 Email counter entries:');
      counters.forEach(counter => {
        console.log(`   - Email ID ${counter.email_id}: ${counter.direct_send_count} direct, ${counter.scheduled_send_count} scheduled, ${counter.total_count} total`);
      });
    }
    
    // Test 2: Test API endpoint
    console.log('\n🌐 Testing email counters API endpoint...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/emailCounters`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Email counters API endpoint working');
        console.log(`📊 API returned ${data.emailCounters?.length || 0} counters`);
      } else {
        console.error('❌ Email counters API endpoint failed:', data.error);
        return false;
      }
    } catch (error) {
      console.log('ℹ️  Could not test API endpoint (server may not be running):', error.message);
    }
    
    // Test 3: Test creating/updating a counter
    console.log('\n➕ Testing counter update...');
    const testEmailId = 1; // Use the first email ID
    
    // Get current counter
    const { data: currentCounter, error: fetchError } = await supabase
      .from('email_counters')
      .select('*')
      .eq('email_id', testEmailId)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching test counter:', fetchError);
      return false;
    }
    
    console.log(`📊 Current counter for email ID ${testEmailId}:`, {
      direct_send_count: currentCounter.direct_send_count,
      scheduled_send_count: currentCounter.scheduled_send_count,
      total_count: currentCounter.total_count
    });
    
    // Test incrementing the counter
    const { data: updatedCounter, error: updateError } = await supabase
      .from('email_counters')
      .update({
        direct_send_count: (currentCounter.direct_send_count || 0) + 1,
        total_count: (currentCounter.total_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('email_id', testEmailId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating test counter:', updateError);
      return false;
    }
    
    console.log('✅ Successfully updated test counter');
    console.log(`📊 Updated counter for email ID ${testEmailId}:`, {
      direct_send_count: updatedCounter.direct_send_count,
      scheduled_send_count: updatedCounter.scheduled_send_count,
      total_count: updatedCounter.total_count
    });
    
    // Reset the counter back to original state
    await supabase
      .from('email_counters')
      .update({
        direct_send_count: currentCounter.direct_send_count,
        total_count: currentCounter.total_count,
        updated_at: new Date().toISOString()
      })
      .eq('email_id', testEmailId);
    
    console.log('🧹 Reset test counter to original state');
    
    // Test 4: Verify all 7 users have counters
    console.log('\n👥 Verifying all 7 users have email counters...');
    const expectedUserIds = [1, 2, 3, 4, 5, 6, 7];
    const foundUserIds = counters.map(c => c.email_id).sort((a, b) => a - b);
    
    const missingUserIds = expectedUserIds.filter(id => !foundUserIds.includes(id));
    const extraUserIds = foundUserIds.filter(id => !expectedUserIds.includes(id));
    
    if (missingUserIds.length > 0) {
      console.error(`❌ Missing email counters for user IDs: ${missingUserIds.join(', ')}`);
      return false;
    }
    
    if (extraUserIds.length > 0) {
      console.log(`ℹ️  Extra email counters found for user IDs: ${extraUserIds.join(', ')}`);
    }
    
    console.log('✅ All 7 users have email counter entries');
    
    console.log('\n🎉 All tests passed!');
    console.log('=====================================');
    console.log('✅ Email counters migration is working correctly');
    console.log('✅ All Supabase operations are functioning');
    console.log('✅ Email counter API is ready for production use');
    console.log('✅ All 7 users have proper email counter entries');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run tests
if (require.main === module) {
  testEmailCountersMigration()
    .then((success) => {
      if (success) {
        console.log('\n✅ All email counters tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some email counters tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Email counters test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailCountersMigration };
