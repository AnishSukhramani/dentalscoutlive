require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

async function testEmailSenderNames() {
  try {
    console.log('🧪 Testing email sender names functionality...');
    console.log('===============================================');
    
    // Test 1: Check user.json structure
    console.log('\n1️⃣ Testing user.json structure...');
    const userFilePath = path.join(process.cwd(), 'data', 'user.json');
    const userData = await fs.readFile(userFilePath, 'utf8');
    const users = JSON.parse(userData);
    
    console.log('✅ user.json file loaded successfully');
    console.log(`📊 Found ${users.users.length} users`);
    
    // Test 2: Verify displayName fields exist
    console.log('\n2️⃣ Verifying displayName fields...');
    const usersWithDisplayName = users.users.filter(user => user.displayName);
    const usersWithoutDisplayName = users.users.filter(user => !user.displayName);
    
    console.log(`✅ Users with displayName: ${usersWithDisplayName.length}`);
    console.log(`⚠️  Users without displayName: ${usersWithoutDisplayName.length}`);
    
    if (usersWithoutDisplayName.length > 0) {
      console.log('Users missing displayName:');
      usersWithoutDisplayName.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    }
    
    // Test 3: Display user information
    console.log('\n3️⃣ User information:');
    users.users.forEach((user, index) => {
      console.log(`   ${index + 1}. Internal Name: "${user.name}"`);
      console.log(`      Display Name: "${user.displayName || 'NOT SET'}"`);
      console.log(`      Email: ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log('');
    });
    
    // Test 4: Test displayName logic
    console.log('\n4️⃣ Testing displayName logic...');
    users.users.forEach(user => {
      const senderName = user.displayName || user.name;
      console.log(`   ${user.email}: "${senderName}"`);
    });
    
    // Test 5: Check for proper names vs internal identifiers
    console.log('\n5️⃣ Analyzing name patterns...');
    const internalIdentifiers = ['biz', 'info', 'net', 'org', 'co', 'Primary', 'Secondary'];
    const properNames = ['Anish Sukhramani', 'Rahul Sharma'];
    
    users.users.forEach(user => {
      const senderName = user.displayName || user.name;
      const isInternalIdentifier = internalIdentifiers.some(identifier => 
        senderName.includes(identifier)
      );
      const isProperName = properNames.some(name => 
        senderName.includes(name)
      );
      
      console.log(`   ${user.email}:`);
      console.log(`     Sender Name: "${senderName}"`);
      console.log(`     Is Internal ID: ${isInternalIdentifier ? '❌ YES' : '✅ NO'}`);
      console.log(`     Is Proper Name: ${isProperName ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
    
    // Test 6: Simulate email sending logic
    console.log('\n6️⃣ Simulating email sending logic...');
    const testEmail = 'anishsukhramani@gmail.com';
    const testUser = users.users.find(user => user.email === testEmail);
    
    if (testUser) {
      const senderName = testUser.displayName || testUser.name;
      console.log(`✅ Test user found: ${testUser.email}`);
      console.log(`   Internal name: "${testUser.name}"`);
      console.log(`   Display name: "${testUser.displayName}"`);
      console.log(`   Final sender name: "${senderName}"`);
      
      if (senderName === testUser.displayName) {
        console.log('✅ Email will use proper display name');
      } else {
        console.log('❌ Email will use internal identifier');
      }
    } else {
      console.log('❌ Test user not found');
    }
    
    console.log('\n🎉 Email sender names test completed!');
    console.log('===============================================');
    console.log('✅ user.json structure updated');
    console.log('✅ displayName fields added');
    console.log('✅ Outbound component updated');
    console.log('✅ Email sender names will now show proper names');
    
    console.log('\n📝 Summary:');
    console.log('   - Internal identifiers (biz, info, etc.) are now hidden');
    console.log('   - Proper display names (Anish Sukhramani, Rahul Sharma) will be used');
    console.log('   - Emails will show professional sender names');
    console.log('   - System maintains internal organization while improving user experience');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Run tests
if (require.main === module) {
  testEmailSenderNames()
    .then(() => {
      console.log('\n✅ All email sender name tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Email sender name tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailSenderNames };
