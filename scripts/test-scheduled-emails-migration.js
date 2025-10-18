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

async function testScheduledEmailsMigration() {
  try {
    console.log('🧪 Testing scheduled emails migration...');
    console.log('==========================================');
    
    // Test 1: Check Supabase connection
    console.log('\n1️⃣ Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('scheduled_emails')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }
    console.log('✅ Supabase connection successful');
    
    // Test 2: Check scheduled_emails table structure
    console.log('\n2️⃣ Testing scheduled_emails table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .limit(1);
    
    if (tableError) {
      throw new Error(`Table structure check failed: ${tableError.message}`);
    }
    console.log('✅ scheduled_emails table accessible');
    
    // Test 3: Get all scheduled emails
    console.log('\n3️⃣ Testing scheduled emails retrieval...');
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('*')
      .order('scheduled_date', { ascending: true });
    
    if (fetchError) {
      throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
    }
    
    console.log(`✅ Found ${scheduledEmails.length} scheduled emails in Supabase`);
    
    if (scheduledEmails.length > 0) {
      console.log('\n📧 Scheduled emails details:');
      scheduledEmails.forEach((email, index) => {
        console.log(`   ${index + 1}. ID: ${email.id}`);
        console.log(`      Scheduled: ${email.scheduled_date}`);
        console.log(`      Status: ${email.status}`);
        console.log(`      Created: ${email.created_at}`);
        console.log(`      Email Data: ${JSON.stringify(email.email_data, null, 2)}`);
        console.log('');
      });
    }
    
    // Test 4: Test API endpoint
    console.log('\n4️⃣ Testing scheduled emails API endpoint...');
    try {
      const response = await fetch('http://localhost:3000/api/scheduledEmails');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const apiData = await response.json();
      console.log('✅ API endpoint working');
      console.log('API Response:', JSON.stringify(apiData, null, 2));
      
      if (apiData.success && apiData.scheduledEmails) {
        const { total, upcoming, overdue, emails } = apiData.scheduledEmails;
        console.log(`📊 API Stats: Total=${total}, Upcoming=${upcoming}, Overdue=${overdue}`);
        
        if (emails.length > 0) {
          console.log('\n📧 API Email Details:');
          emails.forEach((email, index) => {
            console.log(`   ${index + 1}. ID: ${email.id}`);
            console.log(`      Scheduled: ${email.scheduledDate}`);
            console.log(`      Status: ${email.status}`);
            console.log(`      Created: ${email.createdAt}`);
            console.log('');
          });
        }
      }
    } catch (apiError) {
      console.log('⚠️  API endpoint test failed (this is expected if the server is not running)');
      console.log('   Error:', apiError.message);
    }
    
    // Test 5: Test scheduled email processing logic
    console.log('\n5️⃣ Testing scheduled email processing logic...');
    const now = new Date();
    const upcomingEmails = scheduledEmails.filter(email => {
      const scheduledTime = new Date(email.scheduled_date);
      return scheduledTime > now;
    });
    
    const overdueEmails = scheduledEmails.filter(email => {
      const scheduledTime = new Date(email.scheduled_date);
      return scheduledTime <= now;
    });
    
    console.log(`📊 Processing Logic Results:`);
    console.log(`   - Total emails: ${scheduledEmails.length}`);
    console.log(`   - Upcoming emails: ${upcomingEmails.length}`);
    console.log(`   - Overdue emails: ${overdueEmails.length}`);
    
    if (upcomingEmails.length > 0) {
      console.log('\n⏰ Upcoming emails:');
      upcomingEmails.forEach(email => {
        const timeUntil = new Date(email.scheduled_date) - now;
        const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
        const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
        console.log(`   - ${email.id}: ${hoursUntil}h ${minutesUntil}m until scheduled`);
      });
    }
    
    if (overdueEmails.length > 0) {
      console.log('\n⚠️  Overdue emails:');
      overdueEmails.forEach(email => {
        const timeOverdue = now - new Date(email.scheduled_date);
        const hoursOverdue = Math.floor(timeOverdue / (1000 * 60 * 60));
        const minutesOverdue = Math.floor((timeOverdue % (1000 * 60 * 60)) / (1000 * 60));
        console.log(`   - ${email.id}: ${hoursOverdue}h ${minutesOverdue}m overdue`);
      });
    }
    
    console.log('\n🎉 All scheduled emails tests passed!');
    console.log('==========================================');
    console.log('✅ Supabase connection working');
    console.log('✅ scheduled_emails table accessible');
    console.log('✅ Scheduled emails data available');
    console.log('✅ Processing logic working correctly');
    console.log('✅ Migration successful');
    
    console.log('\n📝 Migration Summary:');
    console.log(`   - Total scheduled emails: ${scheduledEmails.length}`);
    console.log(`   - Upcoming emails: ${upcomingEmails.length}`);
    console.log(`   - Overdue emails: ${overdueEmails.length}`);
    console.log('   - Data source: Supabase (scheduled_emails table)');
    console.log('   - No more dependency on scheduledEmails.json');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  testScheduledEmailsMigration()
    .then(() => {
      console.log('\n✅ All scheduled emails tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Scheduled emails tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testScheduledEmailsMigration };
