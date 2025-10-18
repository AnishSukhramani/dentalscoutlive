import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTemplatesAPI() {
  console.log('Testing Templates API with Supabase...\n');
  
  try {
    // Test 1: Fetch all templates
    console.log('1. Testing GET /api/templates');
    const { data: templates, error: fetchError } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
    } else {
      console.log(`✅ Successfully fetched ${templates.length} templates`);
      if (templates.length > 0) {
        console.log('   Sample template:', {
          id: templates[0].id,
          name: templates[0].name,
          subject: templates[0].subject.substring(0, 50) + '...'
        });
      }
    }
    
    // Test 2: Create a new template
    console.log('\n2. Testing POST /api/templates');
    const testTemplate = {
      name: 'Test Template',
      subject: 'Test Subject',
      body: 'This is a test template body for migration testing.'
    };
    
    const { data: newTemplate, error: createError } = await supabase
      .from('email_templates')
      .insert([{
        id: Date.now().toString(),
        name: testTemplate.name,
        subject: testTemplate.subject,
        body: testTemplate.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating template:', createError);
    } else {
      console.log('✅ Successfully created test template:', newTemplate.id);
      
      // Test 3: Update the template
      console.log('\n3. Testing PUT /api/templates/[id]');
      const { data: updatedTemplate, error: updateError } = await supabase
        .from('email_templates')
        .update({
          name: 'Updated Test Template',
          subject: 'Updated Test Subject',
          updated_at: new Date().toISOString()
        })
        .eq('id', newTemplate.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating template:', updateError);
      } else {
        console.log('✅ Successfully updated template');
      }
      
      // Test 4: Delete the template
      console.log('\n4. Testing DELETE /api/templates');
      const { error: deleteError } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', newTemplate.id);
      
      if (deleteError) {
        console.error('❌ Error deleting template:', deleteError);
      } else {
        console.log('✅ Successfully deleted test template');
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
testTemplatesAPI();
