/**
 * Test what the posts API actually returns
 */

async function testAPIResponse() {
  console.log('🧪 Testing actual API response...');
  
  try {
    const response = await fetch('http://localhost:3000/api/posts?limit=10');
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status}`);
      if (response.status === 503) {
        console.log('💡 Database connection issue or server not running');
      }
      return;
    }
    
    const data = await response.json();
    console.log(`✅ API returned ${data.posts?.length || 0} posts`);
    
    if (data.posts && data.posts.length > 0) {
      console.log('\n📊 Checking posts for multiple categories:');
      
      data.posts.forEach((post, index) => {
        console.log(`\nPost ${index + 1}:`);
        console.log(`  ID: ${post.id.substring(0, 8)}...`);
        console.log(`  Content: "${post.content.substring(0, 40)}..."`);
        console.log(`  Primary category: ${post.category}`);
        console.log(`  Categories object:`, post.categories ? `${post.categories.name} (${post.categories.id})` : 'null');
        console.log(`  All categories:`, post.allCategories ? post.allCategories.map(c => `${c.name} (${c.id})`).join(', ') : 'null');
        console.log(`  AI categories:`, post.aiCategories || []);
        
        if (post.allCategories && post.allCategories.length > 1) {
          console.log(`  🎉 MULTIPLE CATEGORIES FOUND: ${post.allCategories.length} categories!`);
        } else if (post.allCategories && post.allCategories.length === 1) {
          console.log(`  📌 Single category: ${post.allCategories[0].name}`);
        } else {
          console.log(`  ❌ No allCategories field or null`);
        }
      });
      
      const multipleCategories = data.posts.filter(p => p.allCategories && p.allCategories.length > 1);
      console.log(`\n📈 Summary: ${multipleCategories.length} out of ${data.posts.length} posts have multiple categories`);
      
      if (multipleCategories.length === 0) {
        console.log('\n❌ PROBLEM FOUND: API is not returning allCategories field correctly!');
        console.log('The database has multiple categories but the API response doesn\'t include them.');
      } else {
        console.log('\n✅ API is correctly returning multiple categories!');
        console.log('The issue might be in the frontend PostCard component.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUTION: Start your development server first:');
      console.log('   npm run start (or next dev)');
      console.log('   Then run this test again');
    }
  }
}

console.log('🎯 Multiple Categories API Test');
console.log('=' .repeat(50));
console.log('This will test the actual API endpoint to see');
console.log('if multiple categories are being returned correctly.');
console.log('=' .repeat(50));

testAPIResponse();