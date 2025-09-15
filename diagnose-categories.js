/**
 * Comprehensive test to diagnose the multiple categories issue
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseProblem() {
  console.log('🔍 Comprehensive Multiple Categories Diagnosis');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check database structure
    console.log('\n1️⃣ CHECKING DATABASE STRUCTURE...');
    
    const posts = await prisma.post.findMany({
      where: {
        categoryIds: {
          isEmpty: false
        }
      },
      include: {
        categories: true, // Primary category
      },
      take: 5
    });

    console.log(`Found ${posts.length} posts with categoryIds populated`);
    
    // 2. Check what categoryIds look like
    console.log('\n2️⃣ CHECKING categoryIds VALUES...');
    for (const post of posts) {
      console.log(`Post ${post.id}:`);
      console.log(`  categoryId (primary): ${post.categoryId}`);
      console.log(`  categoryIds array: [${post.categoryIds.join(', ')}]`);
      console.log(`  aiCategories: [${post.aiCategories?.join(', ') || 'none'}]`);
      console.log(`  Primary category object:`, post.categories);
    }

    // 3. Check if we can fetch multiple categories properly
    console.log('\n3️⃣ CHECKING MULTIPLE CATEGORIES FETCH...');
    
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log(`\nTesting with post: ${firstPost.id}`);
      console.log(`Category IDs to fetch: [${firstPost.categoryIds.join(', ')}]`);
      
      // Fetch all categories for this post
      const allCategoriesForPost = await prisma.categories.findMany({
        where: {
          id: {
            in: firstPost.categoryIds
          }
        },
        select: {
          id: true,
          name: true,
          color: true,
          slug: true
        }
      });
      
      console.log('Fetched categories:', allCategoriesForPost);
      
      if (allCategoriesForPost.length !== firstPost.categoryIds.length) {
        console.log('⚠️  MISMATCH: Some category IDs don\'t exist in categories table!');
        
        // Check which ones are missing
        const existingIds = allCategoriesForPost.map(c => c.id);
        const missingIds = firstPost.categoryIds.filter(id => !existingIds.includes(id));
        console.log('Missing category IDs:', missingIds);
      } else {
        console.log('✅ All category IDs found in categories table');
      }
    }

    // 4. Test the exact API logic
    console.log('\n4️⃣ SIMULATING API LOGIC...');
    
    const testPosts = await prisma.post.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        categories: true,  // Primary category
        _count: {
          select: {
            Comment: true,
          },
        },
      },
      take: 3
    });

    // Get multiple categories for all posts (simulating API logic)
    const allCategoryIds = testPosts.flatMap(post => post.categoryIds || []);
    const uniqueCategoryIds = [...new Set(allCategoryIds)];
    
    console.log('All category IDs from posts:', allCategoryIds);
    console.log('Unique category IDs:', uniqueCategoryIds);
    
    const multipleCategories = uniqueCategoryIds.length > 0 
      ? await prisma.categories.findMany({
          where: { id: { in: uniqueCategoryIds } },
          select: { id: true, name: true, color: true, slug: true }
        })
      : [];
    
    console.log('Fetched multiple categories:', multipleCategories);
    
    // Create category map
    const categoryMap = new Map(multipleCategories.map(cat => [cat.id, cat]));
    
    // Transform posts (simulating API response)
    const transformedPosts = testPosts.map(post => {
      const postCategories = (post.categoryIds || [])
        .map(id => categoryMap.get(id))
        .filter(Boolean);
      
      const uniqueCategories = postCategories.filter((category, index, array) => 
        array.findIndex(c => c?.id === category?.id) === index
      );
      
      return {
        id: post.id,
        content: post.content.substring(0, 50) + '...',
        category: post.categories.name, // Primary category name
        categories: post.categories, // Primary category object
        allCategories: uniqueCategories, // Multiple categories
        aiCategories: post.aiCategories || [],
      };
    });

    console.log('\n5️⃣ FINAL TRANSFORMED POSTS (API RESPONSE SIMULATION):');
    transformedPosts.forEach((post, index) => {
      console.log(`\nPost ${index + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Content: ${post.content}`);
      console.log(`  Primary category: ${post.category}`);
      console.log(`  All categories count: ${post.allCategories.length}`);
      console.log(`  All categories:`, post.allCategories.map(c => c.name));
      
      if (post.allCategories.length > 1) {
        console.log(`  ✅ HAS MULTIPLE CATEGORIES!`);
      } else {
        console.log(`  📌 Single category only`);
      }
    });

    // 6. Check if any posts should have multiple categories but don't
    console.log('\n6️⃣ CHECKING FOR POTENTIAL MISSING CATEGORIES...');
    
    const postsWithAICategories = await prisma.post.findMany({
      where: {
        aiCategories: {
          not: { isEmpty: true }
        }
      },
      select: {
        id: true,
        categoryId: true,
        categoryIds: true,
        aiCategories: true
      },
      take: 5
    });

    console.log(`Found ${postsWithAICategories.length} posts with AI categories`);
    
    for (const post of postsWithAICategories) {
      console.log(`\nPost ${post.id}:`);
      console.log(`  categoryIds length: ${post.categoryIds.length}`);
      console.log(`  aiCategories: [${post.aiCategories.join(', ')}]`);
      
      if (post.categoryIds.length === 1 && post.aiCategories.length > 0) {
        console.log(`  ⚠️  This post could have multiple categories but doesn't!`);
      }
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseProblem();