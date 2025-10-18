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

async function migrateProcessingStats() {
  try {
    console.log('🚀 Starting processing stats migration to Supabase...');
    console.log('==================================================');
    
    // Read existing processing stats from JSON file
    const processingStatsPath = path.join(process.cwd(), 'data', 'processingStats.json');
    let existingStats = null;
    
    try {
      const statsContent = await fs.readFile(processingStatsPath, 'utf8');
      existingStats = JSON.parse(statsContent);
      console.log('📊 Found existing processing stats:', existingStats);
    } catch (error) {
      console.log('ℹ️  No existing processing stats file found, will create new entry');
    }
    
    // Check if stats already exist in Supabase
    const { data: existingSupabaseStats, error: fetchError } = await supabase
      .from('email_processing_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }
    
    if (existingSupabaseStats) {
      console.log('ℹ️  Processing stats already exist in Supabase:');
      console.log(`   - Total Processed: ${existingSupabaseStats.total_processed}`);
      console.log(`   - Total Failed: ${existingSupabaseStats.total_failed}`);
      console.log(`   - Session Processed: ${existingSupabaseStats.session_processed}`);
      console.log(`   - Session Failed: ${existingSupabaseStats.session_failed}`);
      console.log(`   - Last Processing Time: ${existingSupabaseStats.last_processing_time}`);
      
      // If we have existing JSON data and it's different, update Supabase
      if (existingStats) {
        console.log('\n🔄 Updating Supabase with JSON data...');
        const { data: updatedStats, error: updateError } = await supabase
          .from('email_processing_stats')
          .update({
            total_processed: existingStats.totalProcessed || 0,
            total_failed: existingStats.totalFailed || 0,
            session_processed: existingStats.sessionProcessed || 0,
            session_failed: existingStats.sessionFailed || 0,
            last_processing_time: existingStats.lastProcessingTime || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSupabaseStats.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        
        console.log('✅ Updated Supabase with JSON data:');
        console.log(`   - Total Processed: ${updatedStats.total_processed}`);
        console.log(`   - Total Failed: ${updatedStats.total_failed}`);
        console.log(`   - Session Processed: ${updatedStats.session_processed}`);
        console.log(`   - Session Failed: ${updatedStats.session_failed}`);
        console.log(`   - Last Processing Time: ${updatedStats.last_processing_time}`);
      }
    } else {
      // Create new processing stats entry
      console.log('📝 Creating new processing stats entry...');
      
      const newStats = {
        total_processed: existingStats?.totalProcessed || 0,
        total_failed: existingStats?.totalFailed || 0,
        session_processed: existingStats?.sessionProcessed || 0,
        session_failed: existingStats?.sessionFailed || 0,
        last_processing_time: existingStats?.lastProcessingTime || null
      };
      
      const { data: createdStats, error: createError } = await supabase
        .from('email_processing_stats')
        .insert([newStats])
        .select()
        .single();
      
      if (createError) throw createError;
      
      console.log('✅ Created new processing stats entry:');
      console.log(`   - Total Processed: ${createdStats.total_processed}`);
      console.log(`   - Total Failed: ${createdStats.total_failed}`);
      console.log(`   - Session Processed: ${createdStats.session_processed}`);
      console.log(`   - Session Failed: ${createdStats.session_failed}`);
      console.log(`   - Last Processing Time: ${createdStats.last_processing_time}`);
    }
    
    console.log('\n🎉 Processing stats migration completed successfully!');
    console.log('==================================================');
    console.log('✅ Processing stats now use Supabase');
    console.log('✅ No more dependency on processingStats.json');
    console.log('✅ Better performance and reliability');
    console.log('✅ Real-time processing statistics');
    
    console.log('\n📝 Next steps:');
    console.log('1. Test the processing stats API endpoints');
    console.log('2. Verify that email processing updates stats correctly');
    console.log('3. Check that stats are displayed correctly in the UI');
    console.log('4. Monitor processing performance and statistics');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateProcessingStats()
    .then(() => {
      console.log('\n✅ Processing stats migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Processing stats migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateProcessingStats };
