/**
 * Find posts that should have multiple categories and check API response
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findMultipleCategoryPosts() {
  console.log('🔍 Finding posts with multiple categories...');
  
  try {
    // Get all posts and check their categoryIds length
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        categoryIds: true,
        aiCategories: true,
        content: true
      }
    });

    console.log(`\nTotal posts in database: ${allPosts.length}`);
    
    // Find posts with multiple categories
    const multipleCategoryPosts = allPosts.filter(post => 
      post.categoryIds && post.categoryIds.length > 1
    );
    
    console.log(`Posts with multiple categories: ${multipleCategoryPosts.length}`);
    
    if (multipleCategoryPosts.length === 0) {
      console.log('❌ NO POSTS WITH MULTIPLE CATEGORIES FOUND!');
      console.log('This is the root cause of the issue.\n');
      
      // Find posts that have AI categories but only one categoryId
      const postsWithAICategories = allPosts.filter(post => 
        post.aiCategories && 
        post.aiCategories.length > 0 && 
        post.categoryIds.length === 1
      );
      
      console.log(`\nPosts with AI categories but single categoryId: ${postsWithAICategories.length}`);
      
      if (postsWithAICategories.length > 0) {
        console.log('\nThese posts should have multiple categories:');
        postsWithAICategories.slice(0, 3).forEach(post => {
          console.log(`Post ${post.id}:`);
          console.log(`  categoryIds: [${post.categoryIds.join(', ')}]`);
          console.log(`  aiCategories: [${post.aiCategories.join(', ')}]`);
          console.log(`  Content: "${post.content.substring(0, 50)}..."`);
          console.log('---');
        });
        
        console.log('\n🔧 FIXING THESE POSTS...');
        
        // Get all categories for mapping
        const allCategories = await prisma.categories.findMany({
          select: { id: true, name: true }
        });
        const categoryNameToIdMap = new Map(
          allCategories.map(cat => [cat.name.toLowerCase(), cat.id])
        );
        
        let fixed = 0;
        for (const post of postsWithAICategories) {
          const newCategoryIds = [...post.categoryIds]; // Start with existing
          
          // Add AI categories that match our database
          for (const aiCategoryName of post.aiCategories) {
            const categoryId = categoryNameToIdMap.get(aiCategoryName.toLowerCase());
            if (categoryId && !newCategoryIds.includes(categoryId)) {
              newCategoryIds.push(categoryId);
            }
          }
          
          if (newCategoryIds.length > post.categoryIds.length) {
            await prisma.post.update({
              where: { id: post.id },
              data: { categoryIds: newCategoryIds }
            });
            
            console.log(`✅ Fixed post ${post.id}: ${post.categoryIds.length} → ${newCategoryIds.length} categories`);
            fixed++;
          }
        }
        
        console.log(`\n🎉 Fixed ${fixed} posts with multiple categories!`);
      }
    } else {
      console.log('\n✅ Found posts with multiple categories:');
      multipleCategoryPosts.forEach(post => {
        console.log(`Post ${post.id}: ${post.categoryIds.length} categories [${post.categoryIds.join(', ')}]`);
      });
    }

    // Test the API response for a specific post with multiple categories
    console.log('\n🧪 Testing API simulation...');
    
    // Get a fresh list after potential fixes
    const updatedPosts = await prisma.post.findMany({
      where: {
        categoryIds: {
          // Find posts with more than one category
          // Since we can't use array_length, we'll filter in JS
        }
      },
      include: {
        categories: true,
      },
      take: 10
    });
    
    const postsWithMultiple = updatedPosts.filter(post => 
      post.categoryIds && post.categoryIds.length > 1
    );
    
    if (postsWithMultiple.length > 0) {
      console.log(`\n✅ Found ${postsWithMultiple.length} posts with multiple categories after fix:`);
      
      const testPost = postsWithMultiple[0];
      console.log(`\nTesting with post: ${testPost.id}`);
      console.log(`categoryIds: [${testPost.categoryIds.join(', ')}]`);
      
      // Simulate the API allCategories fetch
      const allCategoriesForPost = await prisma.categories.findMany({
        where: {
          id: { in: testPost.categoryIds }
        },
        select: { id: true, name: true, color: true, slug: true }
      });
      
      console.log('\nAPI would return allCategories:', allCategoriesForPost.map(c => c.name));
      console.log('This should show multiple category badges in the UI! 🎉');
    } else {
      console.log('\n❌ Still no posts with multiple categories found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMultipleCategoryPosts();