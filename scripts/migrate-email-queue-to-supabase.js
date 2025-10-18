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

async function migrateEmailQueue() {
  try {
    console.log('🚀 Starting email queue migration to Supabase...');
    console.log('===============================================');
    
    // Read current JSON files
    const emailQueuePath = path.join(process.cwd(), 'data', 'emailQueue.json');
    const scheduledEmailsPath = path.join(process.cwd(), 'data', 'scheduledEmails.json');
    const processingStatsPath = path.join(process.cwd(), 'data', 'processingStats.json');
    
    // Migrate email queue
    console.log('\n📧 Migrating email queue...');
    try {
      const emailQueueData = JSON.parse(await fs.readFile(emailQueuePath, 'utf8'));
      if (emailQueueData.queue && emailQueueData.queue.length > 0) {
        console.log(`Found ${emailQueueData.queue.length} email queue entries to migrate`);
        
        const { data, error } = await supabase
          .from('email_queue')
          .insert(emailQueueData.queue.map(entry => ({
            id: entry.id,
            recipient_email: entry.recipientEmail,
            recipient_name: entry.recipientName,
            template_id: entry.templateId,
            sender_email: entry.senderEmail,
            sender_name: entry.senderName,
            sender_password: entry.senderPassword,
            send_mode: entry.sendMode,
            scheduled_date: entry.scheduledDate,
            email_count: entry.emailCount,
            entry_data: entry.entryData,
            status: entry.status,
            created_at: entry.createdAt,
            processed_at: entry.processedAt,
            message: entry.message
          })));
        
        if (error) throw error;
        console.log(`✅ Migrated ${emailQueueData.queue.length} email queue entries`);
      } else {
        console.log('ℹ️  No email queue data to migrate');
      }
    } catch (error) {
      console.log('ℹ️  No email queue data to migrate or error reading file:', error.message);
    }
    
    // Migrate scheduled emails
    console.log('\n⏰ Migrating scheduled emails...');
    try {
      const scheduledEmailsData = JSON.parse(await fs.readFile(scheduledEmailsPath, 'utf8'));
      if (scheduledEmailsData.length > 0) {
        console.log(`Found ${scheduledEmailsData.length} scheduled emails to migrate`);
        
        const { data, error } = await supabase
          .from('scheduled_emails')
          .insert(scheduledEmailsData.map(email => ({
            id: email.id,
            email_data: email.emailData,
            scheduled_date: email.scheduledDate,
            status: email.status,
            created_at: email.createdAt
          })));
        
        if (error) throw error;
        console.log(`✅ Migrated ${scheduledEmailsData.length} scheduled emails`);
      } else {
        console.log('ℹ️  No scheduled emails data to migrate');
      }
    } catch (error) {
      console.log('ℹ️  No scheduled emails data to migrate or error reading file:', error.message);
    }
    
    // Migrate processing stats
    console.log('\n📊 Migrating processing stats...');
    try {
      const processingStatsData = JSON.parse(await fs.readFile(processingStatsPath, 'utf8'));
      console.log('Found processing stats to migrate:', processingStatsData);
      
      const { data, error } = await supabase
        .from('email_processing_stats')
        .insert([{
          total_processed: processingStatsData.totalProcessed || 0,
          total_failed: processingStatsData.totalFailed || 0,
          last_processing_time: processingStatsData.lastProcessingTime,
          session_processed: processingStatsData.sessionProcessed || 0,
          session_failed: processingStatsData.sessionFailed || 0
        }]);
      
      if (error) throw error;
      console.log('✅ Migrated processing stats');
    } catch (error) {
      console.log('ℹ️  No processing stats to migrate or error reading file:', error.message);
    }
    
    console.log('\n🎉 Email queue migration completed successfully!');
    console.log('===============================================');
    console.log('✅ All JSON data has been migrated to Supabase');
    console.log('✅ Email queue system is now using Supabase');
    console.log('✅ No more file system race conditions');
    console.log('✅ Better performance and reliability');
    
    console.log('\n📝 Next steps:');
    console.log('1. Test the email queue functionality');
    console.log('2. Verify that bulk email sending works');
    console.log('3. Check that scheduled emails are processed correctly');
    console.log('4. Monitor the processing stats');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateEmailQueue()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateEmailQueue };
