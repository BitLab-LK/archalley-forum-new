/**
 * Test script to check if the API returns posts with multiple categories correctly
 */

require('dotenv').config();

async function testPostsAPI() {
  console.log('🧪 Testing Posts API Response...');
  
  try {
    // Test the posts API endpoint
    const response = await fetch('http://localhost:3000/api/posts?limit=5', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`✅ API responded with ${data.posts?.length || 0} posts`);
    
    // Check each post for multiple categories
    if (data.posts && data.posts.length > 0) {
      console.log('\n📊 Posts with categories:');
      
      data.posts.forEach((post, index) => {
        console.log(`\nPost ${index + 1} (${post.id}):`);
        console.log(`  Content: "${post.content.substring(0, 50)}..."`);
        console.log(`  Primary category: ${post.category}`);
        console.log(`  Categories object:`, post.categories);
        console.log(`  All categories:`, post.allCategories);
        console.log(`  AI categories:`, post.aiCategories);
        
        if (post.allCategories && post.allCategories.length > 1) {
          console.log(`  ✅ HAS MULTIPLE CATEGORIES: ${post.allCategories.map(c => c.name).join(', ')}`);
        } else if (post.allCategories && post.allCategories.length === 1) {
          console.log(`  📌 Single category: ${post.allCategories[0].name}`);
        } else {
          console.log(`  ⚠️  No allCategories field or empty`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your development server is running with: npm run dev');
    }
  }
}

testPostsAPI();