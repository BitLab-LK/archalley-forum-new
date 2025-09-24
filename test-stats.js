// Test script for stats functionality
// Run this in the browser console while on admin dashboard

async function testStatsRefresh() {
  console.log('🧪 Testing manual stats refresh...');
  
  try {
    // Test manual refresh API call
    const response = await fetch('/api/admin/stats');
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Stats API response:', data);
    
    // Test if stats have timestamp
    if (data.timestamp) {
      console.log('✅ Stats have timestamp:', new Date(data.timestamp).toLocaleString());
    } else {
      console.log('⚠️ Stats missing timestamp');
    }
    
    // Test stats structure
    const expectedFields = ['totalUsers', 'totalPosts', 'totalComments', 'activeUsers'];
    const missingFields = expectedFields.filter(field => typeof data[field] !== 'number');
    
    if (missingFields.length === 0) {
      console.log('✅ All expected stats fields present');
    } else {
      console.log('⚠️ Missing stats fields:', missingFields);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Stats refresh test failed:', error);
    return null;
  }
}

async function testUserDeletion() {
  console.log('🧪 Testing user deletion stats update...');
  
  // Get current stats
  const beforeStats = await testStatsRefresh();
  if (!beforeStats) return;
  
  console.log('📊 Stats before deletion:', {
    users: beforeStats.totalUsers,
    posts: beforeStats.totalPosts,
    comments: beforeStats.totalComments
  });
  
  // Note: This is just a test - don't actually delete users in production
  console.log('ℹ️ To test user deletion:');
  console.log('1. Go to Users tab');
  console.log('2. Delete a test user');
  console.log('3. Watch for real-time stats update');
  console.log('4. Or click manual refresh button');
}

// Test WebSocket connection
function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket connection...');
  
  // Check if socket context is available
  if (window.io) {
    console.log('✅ Socket.IO available');
  } else {
    console.log('⚠️ Socket.IO not found');
  }
  
  // This would need to be run from the admin dashboard to access React context
  console.log('ℹ️ To test WebSocket:');
  console.log('1. Open browser dev tools');
  console.log('2. Look for "Connected to Socket.IO server" message');
  console.log('3. Check Network tab for WebSocket connection');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting stats functionality tests...');
  console.log('=====================================');
  
  await testStatsRefresh();
  console.log('');
  
  await testUserDeletion();
  console.log('');
  
  testWebSocketConnection();
  console.log('');
  
  console.log('✅ Tests completed!');
  console.log('📝 Check admin dashboard for real-time updates');
}

// Auto-run tests
runAllTests();