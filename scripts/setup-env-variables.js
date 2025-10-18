require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔧 Email Queue Migration Environment Setup');
console.log('==========================================');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from env.example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check current environment variables
console.log('\n🔍 Checking environment variables...');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let missingVars = [];

requiredVars.forEach(varName => {
  if (process.env[varName] && process.env[varName] !== `your_${varName.toLowerCase()}_here`) {
    console.log(`✅ ${varName}: Set`);
  } else {
    console.log(`❌ ${varName}: Missing or not configured`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('\n🚨 Missing Environment Variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📋 How to get the SUPABASE_SERVICE_ROLE_KEY:');
  console.log('1. Go to your Supabase dashboard');
  console.log('2. Navigate to Settings → API');
  console.log('3. Copy the "service_role" key (not the anon key)');
  console.log('4. Add it to your .env file:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  
  console.log('\n💡 After adding the environment variables:');
  console.log('1. Restart your development server');
  console.log('2. Run: node scripts/migrate-email-queue-to-supabase.js');
  console.log('3. Test: node scripts/test-email-queue-migration.js');
} else {
  console.log('\n🎉 All environment variables are configured!');
  console.log('✅ Ready to run the migration');
}

console.log('\n📚 Next Steps:');
console.log('1. Add SUPABASE_SERVICE_ROLE_KEY to your .env file');
console.log('2. Restart your development server');
console.log('3. Run the migration script');
console.log('4. Test the email queue functionality');
