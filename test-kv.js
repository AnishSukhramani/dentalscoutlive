/**
 * Test script to verify KV storage is working
 * Run this locally to test before deploying
 */
import { kv } from '@vercel/kv';

async function testKV() {
  try {
    console.log('Testing Vercel KV connection...');
    
    // Test basic operations
    await kv.set('test-key', 'test-value');
    const value = await kv.get('test-key');
    
    if (value === 'test-value') {
      console.log('✅ KV storage is working correctly!');
      
      // Clean up test data
      await kv.del('test-key');
      console.log('✅ Test data cleaned up');
    } else {
      console.error('❌ KV storage test failed');
    }
  } catch (error) {
    console.error('❌ KV storage error:', error);
    console.log('Make sure you have KV configured in your Vercel project');
  }
}

testKV();
