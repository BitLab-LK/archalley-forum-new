import { PrismaClient, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminUser = await prisma.users.create({
    data: {
      id: "admin-1",
      name: "Admin User",
      email: "admin@archalley.com",
      role: UserRole.ADMIN,
      isVerified: true,
      company: "Archalley",
      bio: "Forum administrator and community manager.",
      updatedAt: new Date(),
    },
  })

  // Create sample users
  const users = await Promise.all([
    prisma.users.create({
      data: {
        id: "user-1",
        name: "Sarah Chen",
        email: "sarah@example.com",
        role: UserRole.MEMBER,
        isVerified: true,
        company: "Chen Design Studio",
        bio: "Passionate architect with 10+ years of experience in sustainable design.",
        updatedAt: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        id: "user-2",
        name: "Mike Johnson",
        email: "mike@example.com",
        role: UserRole.MODERATOR,
        isVerified: true,
        company: "Johnson Interiors",
        bio: "Interior designer specializing in modern commercial spaces.",
        updatedAt: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        id: "user-3",
        name: "Emma Davis",
        email: "emma@example.com",
        role: UserRole.MEMBER,
        isVerified: false,
        company: "Davis Engineering",
        bio: "Structural engineer passionate about sustainable construction.",
        updatedAt: new Date(),
      },
    }),
  ])

  // Create categories first
  const categories = await Promise.all([
    prisma.categories.create({
      data: {
        id: "design",
        name: "Design",
        color: "#8B5CF6",
        slug: "design",
        updatedAt: new Date(),
      },
    }),
    prisma.categories.create({
      data: {
        id: "business",
        name: "Business",
        color: "#3B82F6",
        slug: "business",
        updatedAt: new Date(),
      },
    }),
    prisma.categories.create({
      data: {
        id: "career",
        name: "Career",
        color: "#10B981",
        slug: "career",
        updatedAt: new Date(),
      },
    }),
    prisma.categories.create({
      data: {
        id: "construction",
        name: "Construction",
        color: "#F59E0B",
        slug: "construction",
        updatedAt: new Date(),
      },
    }),
  ])

  // Create sample posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        id: "post1",
        content:
          "Just finished designing a sustainable office complex in downtown. The integration of green walls and natural lighting has been incredible. What are your thoughts on biophilic design in modern architecture?",
        authorId: users[0].id,
        primaryCategoryId: categories[0].id,
        aiTags: ["sustainable", "biophilic", "office"],
        updatedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        id: "post2",
        content: "Need the service of a good architect for a proposed house in Mathugama. Looking for someone experienced in residential projects with modern design aesthetics.",
        authorId: users[1].id,
        primaryCategoryId: categories[1].id,
        aiTags: ["residential", "modern", "mathugama"],
        isAnonymous: true,
        updatedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        id: "post3",
        content: "Recently graduated and starting my career in architecture. Any advice for new graduates entering the field? What should I focus on in my first year?",
        authorId: users[2].id,
        primaryCategoryId: categories[2].id,
        aiTags: ["career", "advice", "graduate"],
        updatedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        id: "post4",
        content: "Has anyone worked with 3D printing in construction? I'm curious about its practical applications and limitations in Sri Lankan context.",
        authorId: adminUser.id,
        primaryCategoryId: categories[3].id,
        aiTags: ["3d-printing", "technology", "innovation"],
        isPinned: true,
        updatedAt: new Date(),
      },
    }),
  ])

  // Create sample comments
  await Promise.all([
    prisma.comment.create({
      data: {
        id: "comment1",
        content: "Great question! Biophilic design has shown amazing results in employee productivity. We've implemented similar concepts in our recent projects.",
        authorId: users[1].id,
        postId: posts[0].id,
        updatedAt: new Date(),
      },
    }),
    prisma.comment.create({
      data: {
        id: "comment2",
        content: "I'd recommend focusing on building strong relationships with senior architects and learning project management skills early on.",
        authorId: users[0].id,
        postId: posts[2].id,
        updatedAt: new Date(),
      },
    }),
  ])

  // Create sample votes
  await Promise.all([
    prisma.votes.create({
      data: {
        id: "vote-1",
        type: "UP",
        userId: users[1].id,
        postId: posts[0].id,
      },
    }),
    prisma.votes.create({
      data: {
        id: "vote-2",
        type: "UP",
        userId: users[2].id,
        postId: posts[0].id,
      },
    }),
    prisma.votes.create({
      data: {
        id: "vote-3",
        type: "UP",
        userId: adminUser.id,
        postId: posts[2].id,
      },
    }),
  ])

  // Create badges
  const badges = await Promise.all([
    // Activity badges
    prisma.badges.create({
      data: {
        id: "first-post",
        name: "First Post",
        description: "Created your first post",
        icon: "🎉",
        color: "#10B981",
        type: "ACTIVITY",
        level: "BRONZE",
        criteria: { postsCount: 1 },
        updatedAt: new Date(),
      },
    }),
    prisma.badges.create({
      data: {
        id: "prolific-writer",
        name: "Prolific Writer",
        description: "Created 50+ posts",
        icon: "✍️",
        color: "#F59E0B",
        type: "ACTIVITY",
        level: "GOLD",
        criteria: { postsCount: 50 },
        updatedAt: new Date(),
      },
    }),
    // Appreciation badges
    prisma.badges.create({
      data: {
        id: "well-liked",
        name: "Well Liked",
        description: "Received 100+ upvotes",
        icon: "❤️",
        color: "#EC4899",
        type: "APPRECIATION",
        level: "SILVER",
        criteria: { upvotesReceived: 100 },
        updatedAt: new Date(),
      },
    }),
    prisma.badges.create({
      data: {
        id: "community-favorite",
        name: "Community Favorite",
        description: "Received 1000+ upvotes",
        icon: "🏆",
        color: "#8B5CF6",
        type: "APPRECIATION",
        level: "PLATINUM",
        criteria: { upvotesReceived: 1000 },
        updatedAt: new Date(),
      },
    }),
    // Engagement badges
    prisma.badges.create({
      data: {
        id: "conversationalist",
        name: "Conversationalist",
        description: "Posted 50+ comments",
        icon: "💬",
        color: "#3B82F6",
        type: "ENGAGEMENT",
        level: "SILVER",
        criteria: { commentsCount: 50 },
        updatedAt: new Date(),
      },
    }),
    // Tenure badges
    prisma.badges.create({
      data: {
        id: "regular",
        name: "Regular",
        description: "Member for 6+ months",
        icon: "🎖️",
        color: "#F59E0B",
        type: "TENURE",
        level: "BRONZE",
        criteria: { daysAsActiveMember: 180 },
        updatedAt: new Date(),
      },
    }),
    // Achievement badges
    prisma.badges.create({
      data: {
        id: "verified-expert",
        name: "Verified Expert",
        description: "Manually verified by administrators",
        icon: "✅",
        color: "#059669",
        type: "ACHIEVEMENT",
        level: "PLATINUM",
        criteria: { manuallyAwarded: true },
        updatedAt: new Date(),
      },
    }),
    // Content type badges
    prisma.badges.create({
      data: {
        id: "visual-storyteller",
        name: "Visual Storyteller",
        description: "Posted 10+ image posts",
        icon: "📸",
        color: "#EC4899",
        type: "CONTENT_TYPE",
        level: "SILVER",
        criteria: { imagePostsCount: 10 },
        updatedAt: new Date(),
      },
    }),
  ])

  // Award some badges to users
  await Promise.all([
    // Give admin user the verified expert badge
    prisma.userBadges.create({
      data: {
        userId: adminUser.id,
        badgeId: badges.find((b: any) => b.id === "verified-expert")!.id,
        awardedBy: "system",
      },
    }),
    // Give Sarah the first post badge
    prisma.userBadges.create({
      data: {
        userId: users[0].id,
        badgeId: badges.find((b: any) => b.id === "first-post")!.id,
      },
    }),
    // Give Mike the conversationalist badge
    prisma.userBadges.create({
      data: {
        userId: users[1].id,
        badgeId: badges.find((b: any) => b.id === "conversationalist")!.id,
      },
    }),
  ])

  console.log("Database seeded successfully!")
  console.log(`Created admin user: ${adminUser.email}`)
  console.log(`Created ${users.length} sample users`)
  console.log(`Created ${categories.length} categories`)
  console.log(`Created ${posts.length} posts`)
  console.log(`Created ${badges.length} badges`)
  console.log("✅ All sample data has been added to the database")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
