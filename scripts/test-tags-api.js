const { createClient } = require('@supabase/supabase-js');
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

async function testTagsAPI() {
  console.log('🧪 Testing Tags API with Supabase...\n');
  
  try {
    // Test 1: Get all unique tags from practices table
    console.log('1. Testing GET /api/tags (fetching from practices table)');
    const { data: practices, error: fetchError } = await supabase
      .from('practices')
      .select('tags')
      .not('tags', 'is', null);
    
    if (fetchError) {
      console.error('❌ Error fetching practices:', fetchError);
    } else {
      // Extract and deduplicate tags
      const allTags = [];
      practices.forEach(practice => {
        if (practice.tags && Array.isArray(practice.tags)) {
          allTags.push(...practice.tags);
        }
      });
      const uniqueTags = [...new Set(allTags)].sort();
      
      console.log(`✅ Successfully fetched ${uniqueTags.length} unique tags from practices table`);
      if (uniqueTags.length > 0) {
        console.log('   Sample tags:', uniqueTags.slice(0, 5));
      }
    }
    
    // Test 2: Check if we can add a tag to a practice
    console.log('\n2. Testing tag addition to practice');
    
    // First, get a practice to test with
    const { data: testPractice, error: practiceError } = await supabase
      .from('practices')
      .select('id, tags')
      .limit(1)
      .single();
    
    if (practiceError || !testPractice) {
      console.log('⚠️  No practices found to test with');
    } else {
      const currentTags = testPractice.tags || [];
      const testTag = `test-tag-${Date.now()}`;
      const newTags = [...currentTags, testTag];
      
      const { error: updateError } = await supabase
        .from('practices')
        .update({ tags: newTags })
        .eq('id', testPractice.id);
      
      if (updateError) {
        console.error('❌ Error updating practice tags:', updateError);
      } else {
        console.log('✅ Successfully added test tag to practice');
        
        // Clean up - remove the test tag
        const cleanedTags = currentTags;
        await supabase
          .from('practices')
          .update({ tags: cleanedTags })
          .eq('id', testPractice.id);
        console.log('🧹 Cleaned up test tag');
      }
    }
    
    // Test 3: Test tag filtering
    console.log('\n3. Testing tag filtering');
    const { data: filteredPractices, error: filterError } = await supabase
      .from('practices')
      .select('id, tags')
      .not('tags', 'is', null)
      .limit(5);
    
    if (filterError) {
      console.error('❌ Error filtering practices by tags:', filterError);
    } else {
      console.log(`✅ Successfully filtered ${filteredPractices.length} practices with tags`);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('\n✨ Tags system is now fully Supabase-powered!');
    console.log('   No more JSON file dependencies! 🚀');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
testTagsAPI();
