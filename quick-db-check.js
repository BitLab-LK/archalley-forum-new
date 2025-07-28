const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickCheck() {
  try {
    console.log('⚡ Quick database check...');
    
    // Test basic connection
    const postCount = await prisma.post.count();
    console.log(`Posts in database: ${postCount}`);
    
    const attachmentCount = await prisma.attachments.count();
    console.log(`Attachments in database: ${attachmentCount}`);
    
    if (attachmentCount > 0) {
      console.log('✅ Attachments exist - images should be working');
      
      // Get one example
      const example = await prisma.attachments.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      console.log('Latest attachment:', {
        postId: example.postId,
        filename: example.filename,
        url: example.url.substring(0, 60) + '...'
      });
    } else {
      console.log('❌ No attachments found - this is why images are not showing');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected');
  }
}

quickCheck();
