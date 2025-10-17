import { migrateDataFromFiles } from './kvStorage.js';

/**
 * Migration script to move data from JSON files to Vercel KV
 * Run this once to migrate existing data
 */
async function runMigration() {
  console.log('Starting data migration from files to KV storage...');
  
  try {
    const success = await migrateDataFromFiles();
    
    if (success) {
      console.log('✅ Data migration completed successfully!');
      console.log('All data has been moved from JSON files to Vercel KV storage.');
      console.log('You can now deploy to Vercel without file system issues.');
    } else {
      console.error('❌ Data migration failed. Please check the logs above.');
    }
  } catch (error) {
    console.error('❌ Error during migration:', error);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration };
