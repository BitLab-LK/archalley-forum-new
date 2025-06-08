import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addSamplePosts() {
  try {
    console.log('Adding sample posts...')

    // Get a category and user for the posts
    const [designCategory, businessCategory, careerCategory] = await Promise.all([
      prisma.category.findFirst({ where: { slug: 'design' } }),
      prisma.category.findFirst({ where: { slug: 'business' } }),
      prisma.category.findFirst({ where: { slug: 'career' } }),
    ])

    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@archalley.com' } })

    if (!designCategory || !businessCategory || !careerCategory || !adminUser) {
      throw new Error('Required category or user not found')
    }

    // Sample posts with diverse content
    const posts = [
      {
        content: "Just completed a sustainable residential project that incorporates passive solar design and rainwater harvesting. The client is thrilled with the energy efficiency! Would love to share some insights about the design process. #SustainableDesign #Architecture",
        categoryId: designCategory.id,
        authorId: adminUser.id,
        isAnonymous: false,
        attachments: [
          {
            url: "/uploads/sample-design-1.jpg",
            filename: "sustainable-home.jpg",
            size: 1024,
            mimeType: "image/jpeg",
          },
        ],
      },
      {
        content: "Looking for advice on starting an architecture firm in Sri Lanka. What are the key challenges and opportunities in the current market? Any experienced architects willing to share their journey?",
        categoryId: businessCategory.id,
        authorId: adminUser.id,
        isAnonymous: true,
      },
      {
        content: "Exciting news! We're hiring junior architects for our growing practice. Looking for candidates with 2-3 years of experience in residential projects. Must be proficient in Revit and have a passion for sustainable design. Send your portfolio to careers@example.com",
        categoryId: careerCategory.id,
        authorId: adminUser.id,
        isAnonymous: false,
      },
      {
        content: "Check out this innovative use of local materials in our latest project. We used traditional techniques with a modern twist to create this stunning facade. The community response has been amazing! #LocalArchitecture #Innovation",
        categoryId: designCategory.id,
        authorId: adminUser.id,
        isAnonymous: false,
        attachments: [
          {
            url: "/uploads/sample-design-2.jpg",
            filename: "local-materials.jpg",
            size: 1024,
            mimeType: "image/jpeg",
          },
        ],
      },
      {
        content: "Important discussion: How are you all adapting to the new building regulations? I've noticed some changes in the approval process that might affect our current projects. Let's share experiences and best practices.",
        categoryId: businessCategory.id,
        authorId: adminUser.id,
        isAnonymous: false,
      },
    ]

    // Create posts with attachments
    for (const postData of posts) {
      const { attachments, ...postContent } = postData
      const post = await prisma.post.create({
        data: {
          ...postContent,
          attachments: attachments
            ? {
                create: attachments,
              }
            : undefined,
        },
      })
      console.log(`Created post: ${post.id}`)

      // Update category post count
      await prisma.category.update({
        where: { id: postData.categoryId },
        data: { postCount: { increment: 1 } },
      })
    }

    console.log('Sample posts added successfully!')
  } catch (error) {
    console.error('Error adding sample posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
addSamplePosts() 