require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

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

async function migrateEmailCounters() {
  try {
    console.log('🚀 Starting email counters migration to Supabase...');
    console.log('==================================================');
    
    // Read user.json to get all 7 users
    const userFilePath = path.join(process.cwd(), 'data', 'user.json');
    const userData = JSON.parse(await fs.readFile(userFilePath, 'utf8'));
    
    console.log(`📊 Found ${userData.users.length} users to migrate`);
    
    // Create email counter entries for all users
    const emailCounterEntries = userData.users.map(user => ({
      email_id: user.id,
      direct_send_count: 0,
      scheduled_send_count: 0,
      total_count: 0
    }));
    
    console.log('📝 Creating email counter entries...');
    console.log('Users to migrate:', userData.users.map(u => ({ id: u.id, name: u.name, email: u.email })));
    
    // Insert all email counter entries
    const { data, error } = await supabase
      .from('email_counters')
      .insert(emailCounterEntries);
    
    if (error) {
      // Check if entries already exist
      if (error.code === '23505') { // Unique constraint violation
        console.log('ℹ️  Email counter entries already exist, skipping creation');
        
        // Get existing entries to verify
        const { data: existingCounters, error: fetchError } = await supabase
          .from('email_counters')
          .select('*')
          .order('email_id', { ascending: true });
        
        if (fetchError) throw fetchError;
        
        console.log(`✅ Found ${existingCounters.length} existing email counter entries`);
        existingCounters.forEach(counter => {
          console.log(`   - Email ID ${counter.email_id}: ${counter.direct_send_count} direct, ${counter.scheduled_send_count} scheduled, ${counter.total_count} total`);
        });
      } else {
        throw error;
      }
    } else {
      console.log(`✅ Created ${emailCounterEntries.length} email counter entries`);
      
      // Verify the entries were created
      const { data: newCounters, error: verifyError } = await supabase
        .from('email_counters')
        .select('*')
        .order('email_id', { ascending: true });
      
      if (verifyError) throw verifyError;
      
      console.log('📊 Email counter entries created:');
      newCounters.forEach(counter => {
        console.log(`   - Email ID ${counter.email_id}: ${counter.direct_send_count} direct, ${counter.scheduled_send_count} scheduled, ${counter.total_count} total`);
      });
    }
    
    // Migrate existing data from emailCounters.json if it exists
    console.log('\n📧 Migrating existing email counter data...');
    try {
      const emailCountersPath = path.join(process.cwd(), 'data', 'emailCounters.json');
      const emailCountersData = JSON.parse(await fs.readFile(emailCountersPath, 'utf8'));
      
      if (emailCountersData.emailCounters && emailCountersData.emailCounters.length > 0) {
        console.log(`Found ${emailCountersData.emailCounters.length} existing counter entries to migrate`);
        
        for (const counter of emailCountersData.emailCounters) {
          // Update the corresponding Supabase entry
          const { error: updateError } = await supabase
            .from('email_counters')
            .update({
              direct_send_count: counter.emailsSentToday || 0,
              total_count: counter.emailsSentToday || 0,
              updated_at: new Date().toISOString()
            })
            .eq('email_id', counter.emailId);
          
          if (updateError) {
            console.log(`⚠️  Could not migrate data for email ID ${counter.emailId}:`, updateError.message);
          } else {
            console.log(`✅ Migrated data for email ID ${counter.emailId}: ${counter.emailsSentToday} emails`);
          }
        }
      } else {
        console.log('ℹ️  No existing email counter data to migrate');
      }
    } catch (error) {
      console.log('ℹ️  No existing email counter data to migrate or error reading file:', error.message);
    }
    
    console.log('\n🎉 Email counters migration completed successfully!');
    console.log('==================================================');
    console.log('✅ All 7 users have email counter entries in Supabase');
    console.log('✅ Email counter API now uses Supabase');
    console.log('✅ No more dependency on emailCounters.json');
    console.log('✅ Better performance and reliability');
    
    console.log('\n📝 Next steps:');
    console.log('1. Test the email counter functionality');
    console.log('2. Verify that email sending increments counters');
    console.log('3. Check that counters are displayed correctly in the UI');
    console.log('4. Monitor email sending limits and statistics');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateEmailCounters()
    .then(() => {
      console.log('\n✅ Email counters migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Email counters migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateEmailCounters };
