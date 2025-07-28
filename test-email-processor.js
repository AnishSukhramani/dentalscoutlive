// Test script for email processor
// Run with: node test-email-processor.js

const { processEmailQueue, getCurrentSenderEmail, setSenderEmail } = require('./src/lib/emailProcessor');

async function testEmailProcessor() {
  console.log('=== Email Processor Test ===');
  
  // Test 1: Check current sender email
  console.log('\n1. Current sender email:', getCurrentSenderEmail());
  
  // Test 2: Change sender email
  console.log('\n2. Changing sender email to user2@example.com...');
  setSenderEmail('user2@example.com');
  console.log('New sender email:', getCurrentSenderEmail());
  
  // Test 3: Process email queue
  console.log('\n3. Processing email queue...');
  try {
    await processEmailQueue();
    console.log('✅ Email queue processed successfully');
  } catch (error) {
    console.error('❌ Error processing email queue:', error.message);
  }
  
  // Test 4: Reset sender email
  console.log('\n4. Resetting sender email to user1@example.com...');
  setSenderEmail('user1@example.com');
  console.log('Final sender email:', getCurrentSenderEmail());
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testEmailProcessor().catch(console.error); 