const { processEmailQueue } = require('./src/lib/emailProcessor');

// Test function to verify email setup
async function testEmailSetup() {
  console.log('Testing email setup...');
  console.log('');
  console.log('📧 EMAIL SETUP INSTRUCTIONS:');
  console.log('================================');
  console.log('');
  console.log('1. Create a .env file in the root directory:');
  console.log('   touch .env  (on Mac/Linux)');
  console.log('   echo. > .env  (on Windows)');
  console.log('');
  console.log('2. Add your Gmail app password to the .env file:');
  console.log('   GMAIL_APP_PASSWORD=your_16_character_app_password');
  console.log('');
  console.log('3. To get your Gmail App Password:');
  console.log('   - Go to your Google Account settings');
  console.log('   - Navigate to Security > 2-Step Verification');
  console.log('   - Scroll down to "App passwords"');
  console.log('   - Generate a new app password for "Mail"');
  console.log('   - Copy the 16-character password');
  console.log('');
  console.log('4. Make sure 2-factor authentication is enabled on your Gmail account');
  console.log('');
  console.log('5. Test the setup by running: node test-email-setup.js');
  console.log('');
  
  // Check if environment variable is set
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.log('❌ ERROR: GMAIL_APP_PASSWORD environment variable is not set!');
    console.log('');
    console.log('Please create a .env file with:');
    console.log('GMAIL_APP_PASSWORD=your_16_character_app_password');
    console.log('');
    console.log('Example .env file:');
    console.log('GMAIL_APP_PASSWORD=abcd efgh ijkl mnop');
    console.log('');
    return;
  }
  
  console.log('✅ GMAIL_APP_PASSWORD environment variable is set');
  console.log('');
  
  try {
    // Test the email processor
    await processEmailQueue();
    console.log('✅ Email processor test completed successfully!');
  } catch (error) {
    console.error('❌ Email processor test failed:', error.message);
    console.log('');
    console.log('Common issues:');
    console.log('- App password not set correctly in .env file');
    console.log('- 2-factor authentication not enabled');
    console.log('- Gmail account not configured properly');
    console.log('- Environment variable not loaded properly');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmailSetup();
}

module.exports = { testEmailSetup }; 