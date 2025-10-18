const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateTags() {
  try {
    console.log('🚀 Starting tags migration to Supabase...\n');
    
    // Read existing tags from JSON file
    const tagsFilePath = path.join(__dirname, '..', 'data', 'tags.json');
    let existingTags = [];
    
    if (fs.existsSync(tagsFilePath)) {
      const tagsData = JSON.parse(fs.readFileSync(tagsFilePath, 'utf8'));
      existingTags = tagsData.tags || [];
      console.log(`📋 Found ${existingTags.length} existing tags in JSON file`);
    } else {
      console.log('📋 No existing tags.json file found');
    }
    
    // Get all unique tags currently in practices table
    const { data: practices, error: fetchError } = await supabase
      .from('practices')
      .select('tags')
      .not('tags', 'is', null);
    
    if (fetchError) {
      console.error('❌ Error fetching practices:', fetchError);
      return;
    }
    
    // Extract all tags from practices
    const allTagsFromPractices = [];
    practices.forEach(practice => {
      if (practice.tags && Array.isArray(practice.tags)) {
        allTagsFromPractices.push(...practice.tags);
      }
    });
    
    const uniqueTagsFromPractices = [...new Set(allTagsFromPractices)];
    console.log(`📊 Found ${uniqueTagsFromPractices.length} unique tags in practices table`);
    
    // Combine JSON tags with practice tags
    const allUniqueTags = [...new Set([...existingTags, ...uniqueTagsFromPractices])];
    console.log(`📝 Total unique tags to work with: ${allUniqueTags.length}`);
    
    // Create tags table if it doesn't exist
    console.log('\n🔧 Creating tags table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tags (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
      `
    });
    
    if (createTableError) {
      console.log('⚠️  Table might already exist or error creating:', createTableError.message);
    } else {
      console.log('✅ Tags table created successfully');
    }
    
    // Insert all unique tags into tags table
    if (allUniqueTags.length > 0) {
      console.log('\n📥 Inserting tags into database...');
      
      const tagsToInsert = allUniqueTags.map(tag => ({ name: tag }));
      
      const { data, error: insertError } = await supabase
        .from('tags')
        .upsert(tagsToInsert, { 
          onConflict: 'name',
          ignoreDuplicates: true 
        })
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting tags:', insertError);
      } else {
        console.log(`✅ Successfully processed ${allUniqueTags.length} tags`);
      }
    }
    
    console.log('\n🎉 Tags migration completed!');
    console.log('\n📋 Summary:');
    console.log(`   - JSON tags: ${existingTags.length}`);
    console.log(`   - Practice tags: ${uniqueTagsFromPractices.length}`);
    console.log(`   - Total unique: ${allUniqueTags.length}`);
    console.log('\n✨ The tags API now reads directly from the practices table!');
    console.log('   No more JSON file dependency in production! 🚀');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateTags();
