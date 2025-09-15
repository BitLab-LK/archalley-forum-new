/**
 * Simple script to check and fix categoryIds for posts
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixPosts() {
  console.log('🔍 Checking current posts and categories...');
  
  try {
    // First, let's see what we have in the database
    const allPosts = await prisma.post.findMany({
      select: {
        id: true,
        categoryId: true,
        categoryIds: true,
        aiCategories: true,
        content: true
      },
      take: 10
    });

    console.log(`\n📊 Found ${allPosts.length} posts in database`);
    
    allPosts.forEach(post => {
      console.log(`Post ${post.id}:`);
      console.log(`  Primary categoryId: ${post.categoryId}`);
      console.log(`  categoryIds array: [${post.categoryIds?.join(', ') || 'empty'}]`);
      console.log(`  aiCategories: [${post.aiCategories?.join(', ') || 'empty'}]`);
      console.log(`  Content: "${post.content.substring(0, 50)}..."`);
      console.log('---');
    });

    // Check categories
    const categories = await prisma.categories.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`\n📋 Available categories:`);
    categories.forEach(cat => {
      console.log(`  ${cat.id}: ${cat.name}`);
    });

    // Fix posts that don't have categoryIds array populated
    console.log(`\n🔧 Fixing posts without categoryIds...`);
    
    let fixed = 0;
    for (const post of allPosts) {
      if (!post.categoryIds || post.categoryIds.length === 0) {
        // Create categoryIds array starting with primary category
        const categoryIds = [post.categoryId];
        
        // Add AI categories if they exist and match our categories
        if (post.aiCategories && post.aiCategories.length > 0) {
          for (const aiCategoryName of post.aiCategories) {
            const matchingCategory = categories.find(cat => 
              cat.name.toLowerCase() === aiCategoryName.toLowerCase()
            );
            if (matchingCategory && !categoryIds.includes(matchingCategory.id)) {
              categoryIds.push(matchingCategory.id);
            }
          }
        }

        // Update the post
        await prisma.post.update({
          where: { id: post.id },
          data: { categoryIds: categoryIds }
        });

        console.log(`✅ Fixed post ${post.id}: ${categoryIds.length} categories`);
        fixed++;
      }
    }

    console.log(`\n🎉 Fixed ${fixed} posts`);

    // Verify the fix
    console.log(`\n🔍 Verification - checking posts again...`);
    const fixedPosts = await prisma.post.findMany({
      select: {
        id: true,
        categoryIds: true
      },
      take: 5
    });

    fixedPosts.forEach(post => {
      console.log(`Post ${post.id}: ${post.categoryIds?.length || 0} categories`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixPosts();