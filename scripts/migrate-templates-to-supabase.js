import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateTemplates() {
  try {
    // Read the current templates.json file
    const templatesFilePath = path.join(__dirname, '..', 'data', 'templates.json');
    const templatesData = JSON.parse(fs.readFileSync(templatesFilePath, 'utf8'));
    
    console.log(`Found ${templatesData.templates.length} templates to migrate`);
    
    // Check if templates already exist in Supabase
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('email_templates')
      .select('id');
    
    if (fetchError) {
      console.error('Error checking existing templates:', fetchError);
      return;
    }
    
    if (existingTemplates && existingTemplates.length > 0) {
      console.log(`Found ${existingTemplates.length} existing templates in Supabase`);
      console.log('Existing template IDs:', existingTemplates.map(t => t.id));
      
      // Ask for confirmation to proceed
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('Do you want to continue and potentially create duplicates? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Migration cancelled');
        return;
      }
    }
    
    // Migrate each template
    let successCount = 0;
    let errorCount = 0;
    
    for (const template of templatesData.templates) {
      try {
        const { error } = await supabase
          .from('email_templates')
          .insert({
            id: template.id,
            name: template.name,
            subject: template.subject,
            body: template.body,
            created_at: template.createdAt || new Date().toISOString(),
            updated_at: template.updatedAt || new Date().toISOString()
          });
        
        if (error) {
          console.error(`Error inserting template ${template.id}:`, error);
          errorCount++;
        } else {
          console.log(`✓ Migrated template: ${template.name} (${template.id})`);
          successCount++;
        }
      } catch (err) {
        console.error(`Error processing template ${template.id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`\nMigration completed:`);
    console.log(`✓ Successfully migrated: ${successCount} templates`);
    console.log(`✗ Errors: ${errorCount} templates`);
    
    if (successCount > 0) {
      console.log('\nTemplates have been successfully migrated to Supabase!');
      console.log('You can now update your API routes to use Supabase instead of the JSON file.');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateTemplates();
