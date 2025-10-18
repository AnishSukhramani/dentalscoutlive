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

async function migrateScheduledEmails() {
  try {
    console.log('🚀 Starting scheduled emails migration to Supabase...');
    console.log('====================================================');
    
    // Read existing scheduled emails from JSON file
    const scheduledEmailsPath = path.join(process.cwd(), 'data', 'scheduledEmails.json');
    let existingScheduledEmails = [];
    
    try {
      const scheduledEmailsContent = await fs.readFile(scheduledEmailsPath, 'utf8');
      existingScheduledEmails = JSON.parse(scheduledEmailsContent);
      console.log(`📧 Found ${existingScheduledEmails.length} scheduled emails to migrate`);
    } catch (error) {
      console.log('ℹ️  No existing scheduled emails file found or error reading file:', error.message);
    }
    
    if (existingScheduledEmails.length > 0) {
      console.log('📝 Migrating scheduled emails to Supabase...');
      console.log('Scheduled emails to migrate:', existingScheduledEmails.map(email => ({
        id: email.id,
        scheduledDate: email.scheduledDate,
        status: email.status
      })));
      
      // Check if scheduled emails already exist in Supabase
      const { data: existingSupabaseEmails, error: fetchError } = await supabase
        .from('scheduled_emails')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (existingSupabaseEmails.length > 0) {
        console.log('ℹ️  Scheduled emails already exist in Supabase:');
        existingSupabaseEmails.forEach(email => {
          console.log(`   - ID: ${email.id}, Scheduled: ${email.scheduled_date}, Status: ${email.status}`);
        });
        
        console.log('🔄 Updating Supabase with JSON data...');
        // Update existing entries or add new ones
        for (const email of existingScheduledEmails) {
          const { data: updatedEmail, error: updateError } = await supabase
            .from('scheduled_emails')
            .upsert({
              id: email.id,
              email_data: email.emailData,
              scheduled_date: email.scheduledDate,
              status: email.status || 'scheduled',
              created_at: email.createdAt
            })
            .select()
            .single();
          
          if (updateError) {
            console.log(`⚠️  Could not migrate scheduled email ${email.id}:`, updateError.message);
          } else {
            console.log(`✅ Migrated scheduled email ${email.id}: ${email.scheduledDate}`);
          }
        }
      } else {
        // Insert all scheduled emails
        const { data: insertedEmails, error: insertError } = await supabase
          .from('scheduled_emails')
          .insert(existingScheduledEmails.map(email => ({
            id: email.id,
            email_data: email.emailData,
            scheduled_date: email.scheduledDate,
            status: email.status || 'scheduled',
            created_at: email.createdAt
          })));
        
        if (insertError) {
          throw insertError;
        }
        
        console.log(`✅ Migrated ${existingScheduledEmails.length} scheduled emails to Supabase`);
        
        // Verify the migration
        const { data: verifyEmails, error: verifyError } = await supabase
          .from('scheduled_emails')
          .select('*')
          .order('scheduled_date', { ascending: true });
        
        if (verifyError) throw verifyError;
        
        console.log('📊 Scheduled emails in Supabase:');
        verifyEmails.forEach(email => {
          console.log(`   - ID: ${email.id}, Scheduled: ${email.scheduled_date}, Status: ${email.status}`);
        });
      }
    } else {
      console.log('ℹ️  No scheduled emails to migrate');
      
      // Check if there are any scheduled emails in Supabase
      const { data: existingSupabaseEmails, error: fetchError } = await supabase
        .from('scheduled_emails')
        .select('*');
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (existingSupabaseEmails.length > 0) {
        console.log('ℹ️  Scheduled emails already exist in Supabase:');
        existingSupabaseEmails.forEach(email => {
          console.log(`   - ID: ${email.id}, Scheduled: ${email.scheduled_date}, Status: ${email.status}`);
        });
      } else {
        console.log('ℹ️  No scheduled emails in Supabase either');
      }
    }
    
    console.log('\n🎉 Scheduled emails migration completed successfully!');
    console.log('====================================================');
    console.log('✅ Scheduled emails now use Supabase');
    console.log('✅ No more dependency on scheduledEmails.json');
    console.log('✅ Better performance and reliability');
    console.log('✅ Real-time scheduled email monitoring');
    
    console.log('\n📝 Next steps:');
    console.log('1. Test the scheduled emails API endpoint');
    console.log('2. Verify that email scheduling works correctly');
    console.log('3. Check that scheduled emails are displayed in the UI');
    console.log('4. Monitor scheduled email processing');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateScheduledEmails()
    .then(() => {
      console.log('\n✅ Scheduled emails migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Scheduled emails migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateScheduledEmails };
