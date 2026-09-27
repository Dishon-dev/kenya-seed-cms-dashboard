// Test script to verify image management endpoints are working
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5001';

async function testEndpoints() {
  console.log('🧪 Testing Image Management Endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server health check failed');
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Make sure to start the server with: node fixed-server.js');
    return;
  }

  try {
    // Test 2: Test batch images endpoint
    console.log('\n2. Testing batch images endpoint...');
    const batchResponse = await fetch(`${BASE_URL}/api/images/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productIds: ['maize', 'horticulture', 'legumes'] }),
    });

    if (batchResponse.ok) {
      const data = await batchResponse.json();
      console.log('✅ Batch images endpoint working');
      console.log('   Response:', Object.keys(data).length, 'images found');
    } else {
      console.log('❌ Batch images endpoint failed:', batchResponse.status);
    }
  } catch (error) {
    console.log('❌ Batch images endpoint error:', error.message);
  }

  try {
    // Test 3: Test individual image endpoint
    console.log('\n3. Testing individual image endpoint...');
    const imageResponse = await fetch(`${BASE_URL}/api/images/maize`);
    
    if (imageResponse.status === 404) {
      console.log('✅ Individual image endpoint working (no image found - expected)');
    } else if (imageResponse.ok) {
      console.log('✅ Individual image endpoint working (image found)');
    } else {
      console.log('❌ Individual image endpoint failed:', imageResponse.status);
    }
  } catch (error) {
    console.log('❌ Individual image endpoint error:', error.message);
  }

  console.log('\n🎯 Test Summary:');
  console.log('   - Make sure the server is running on port 5001');
  console.log('   - Check that the image management endpoints are accessible');
  console.log('   - Verify CORS settings allow requests from localhost:3000');
}

testEndpoints();
