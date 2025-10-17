const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need to add this to your environment variables
);

async function migrateData() {
  console.log('🚀 Starting migration to Supabase...');
  
  try {
    // 1. Migrate Templates
    console.log('📧 Migrating templates...');
    const templatesData = JSON.parse(fs.readFileSync('data/templates.json', 'utf8'));
    if (templatesData.templates && templatesData.templates.length > 0) {
      const { error: templatesError } = await supabase
        .from('email_templates')
        .insert(templatesData.templates);
      
      if (templatesError) {
        console.error('❌ Error migrating templates:', templatesError);
      } else {
        console.log(`✅ Migrated ${templatesData.templates.length} templates`);
      }
    }

    // 2. Migrate Processing Stats
    console.log('📊 Migrating processing stats...');
    const statsData = JSON.parse(fs.readFileSync('data/processingStats.json', 'utf8'));
    const { error: statsError } = await supabase
      .from('email_processing_stats')
      .insert([statsData]);
    
    if (statsError) {
      console.error('❌ Error migrating processing stats:', statsError);
    } else {
      console.log('✅ Migrated processing stats');
    }

    // 3. Migrate Users
    console.log('👥 Migrating users...');
    const userData = JSON.parse(fs.readFileSync('data/user.json', 'utf8'));
    if (userData.users && userData.users.length > 0) {
      const { error: usersError } = await supabase
        .from('email_users')
        .insert(userData.users);
      
      if (usersError) {
        console.error('❌ Error migrating users:', usersError);
      } else {
        console.log(`✅ Migrated ${userData.users.length} users`);
      }
    }

    // 4. Migrate Email Counters (if exists)
    console.log('🔢 Migrating email counters...');
    try {
      const countersData = JSON.parse(fs.readFileSync('data/emailCounters.json', 'utf8'));
      if (countersData.counters && countersData.counters.length > 0) {
        const { error: countersError } = await supabase
          .from('email_counters')
          .insert(countersData.counters);
        
        if (countersError) {
          console.error('❌ Error migrating email counters:', countersError);
        } else {
          console.log(`✅ Migrated ${countersData.counters.length} email counters`);
        }
      }
    } catch (error) {
      console.log('ℹ️ No email counters file found, skipping...');
    }

    // 5. Migrate Scheduled Emails (if exists)
    console.log('⏰ Migrating scheduled emails...');
    try {
      const scheduledData = JSON.parse(fs.readFileSync('data/scheduledEmails.json', 'utf8'));
      if (scheduledData && scheduledData.length > 0) {
        const { error: scheduledError } = await supabase
          .from('scheduled_emails')
          .insert(scheduledData);
        
        if (scheduledError) {
          console.error('❌ Error migrating scheduled emails:', scheduledError);
        } else {
          console.log(`✅ Migrated ${scheduledData.length} scheduled emails`);
        }
      }
    } catch (error) {
      console.log('ℹ️ No scheduled emails file found, skipping...');
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Add SUPABASE_SERVICE_ROLE_KEY to your environment variables');
    console.log('2. Update your API routes to use Supabase instead of JSON files');
    console.log('3. Test the new setup');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
