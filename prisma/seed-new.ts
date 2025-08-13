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
        name: "Marcus Johnson",
        email: "marcus@example.com",
        role: UserRole.MEMBER,
        isVerified: false,
        company: "Creative Solutions Ltd",
        bio: "UI/UX designer focused on creating intuitive digital experiences.",
        updatedAt: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        id: "user-3",
        name: "Emma Rodriguez",
        email: "emma@example.com",
        role: UserRole.MEMBER,
        isVerified: false,
        company: "BuildRight Construction",
        bio: "Civil engineer specializing in infrastructure development.",
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
        description: "Architecture and design discussions",
        color: "#8B5CF6",
        icon: "🎨",
        slug: "design",
        updatedAt: new Date(),
      },
    }),
    prisma.categories.create({
      data: {
        id: "business",
        name: "Business",
        description: "Business and entrepreneurship topics",
        color: "#3B82F6",
        icon: "💼",
        slug: "business",
        updatedAt: new Date(),
      },
    }),
    prisma.categories.create({
      data: {
        id: "career",
        name: "Career",
        description: "Career development and opportunities",
        color: "#10B981",
        icon: "🚀",
        slug: "career",
        updatedAt: new Date(),
      },
    }),
    prisma.categories.create({
      data: {
        id: "construction",
        name: "Construction",
        description: "Construction and engineering discussions",
        color: "#F59E0B",
        icon: "🏗️",
        slug: "construction",
        updatedAt: new Date(),
      },
    }),
  ])

  // Create sample posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        id: "post-1",
        content: "What are the latest trends in sustainable architecture? I'm looking for innovative solutions for my upcoming project.",
        authorId: users[0].id,
        categoryId: categories[0].id,
        isAnonymous: false,
        aiTags: ["architecture", "sustainability", "innovation"],
        updatedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        id: "post-2",
        content: "How can small businesses leverage digital marketing effectively? Share your success stories and strategies.",
        authorId: users[1].id,
        categoryId: categories[1].id,
        isAnonymous: false,
        aiTags: ["digital marketing", "small business", "strategy"],
        updatedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        id: "post-3",
        content: "Career transition tips for moving from engineering to project management? What skills should I focus on?",
        authorId: users[2].id,
        categoryId: categories[2].id,
        isAnonymous: true,
        aiTags: ["career change", "project management", "engineering"],
        updatedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        id: "post-4",
        content: "Best practices for concrete quality control in high-rise construction projects. Looking for industry standards.",
        authorId: adminUser.id,
        categoryId: categories[3].id,
        isAnonymous: false,
        aiTags: ["construction", "quality control", "concrete"],
        updatedAt: new Date(),
      },
    }),
  ])

  // Create sample comments
  await Promise.all([
    prisma.comment.create({
      data: {
        id: "comment-1",
        content: "Great question! I've been experimenting with cross-laminated timber (CLT) in my recent projects.",
        postId: posts[0].id,
        authorId: users[1].id,
        updatedAt: new Date(),
      },
    }),
    prisma.comment.create({
      data: {
        id: "comment-2",
        content: "Social media marketing has been a game-changer for our agency. Focus on building authentic relationships.",
        postId: posts[1].id,
        authorId: users[2].id,
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
        userId: users[0].id,
        postId: posts[1].id,
      },
    }),
    prisma.votes.create({
      data: {
        id: "vote-2",
        type: "UP",
        userId: users[1].id,
        postId: posts[0].id,
      },
    }),
    prisma.votes.create({
      data: {
        id: "vote-3",
        type: "UP",
        userId: users[2].id,
        postId: posts[0].id,
      },
    }),
  ])

  console.log("✅ Database seeded successfully!")
  console.log(`📊 Created: ${users.length + 1} users, ${categories.length} categories, ${posts.length} posts, 2 comments, 3 votes`)
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
