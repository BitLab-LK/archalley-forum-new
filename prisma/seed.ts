import { PrismaClient, UserRole, UserRank } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Business",
        description:
          "Discuss business strategies, entrepreneurship, and industry trends in architecture and construction.",
        color: "bg-blue-500",
        icon: "Briefcase",
        slug: "business",
      },
    }),
    prisma.category.create({
      data: {
        name: "Design",
        description: "Share and discuss architectural designs, concepts, and creative inspiration.",
        color: "bg-purple-500",
        icon: "Palette",
        slug: "design",
      },
    }),
    prisma.category.create({
      data: {
        name: "Career",
        description: "Career advice, job opportunities, and professional development in the industry.",
        color: "bg-green-500",
        icon: "GraduationCap",
        slug: "career",
      },
    }),
    prisma.category.create({
      data: {
        name: "Construction",
        description: "Construction techniques, materials, project management, and industry innovations.",
        color: "bg-yellow-500",
        icon: "HardHat",
        slug: "construction",
      },
    }),
    prisma.category.create({
      data: {
        name: "Academic",
        description: "Academic discussions, research, theories, and educational resources.",
        color: "bg-indigo-500",
        icon: "BookOpen",
        slug: "academic",
      },
    }),
    prisma.category.create({
      data: {
        name: "Informative",
        description: "News, updates, tutorials, and informational content about the industry.",
        color: "bg-cyan-500",
        icon: "Info",
        slug: "informative",
      },
    }),
    prisma.category.create({
      data: {
        name: "Other",
        description: "General discussions and topics that don't fit into other categories.",
        color: "bg-gray-500",
        icon: "MoreHorizontal",
        slug: "other",
      },
    }),
  ])

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@archalley.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      rank: UserRank.COMMUNITY_EXPERT,
      isVerified: true,
      company: "Archalley",
      profession: "Administrator",
      bio: "Forum administrator and community manager.",
    },
  })

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Sarah Chen",
        email: "sarah@example.com",
        password: await bcrypt.hash("password123", 12),
        role: UserRole.MEMBER,
        rank: UserRank.COMMUNITY_EXPERT,
        isVerified: true,
        company: "Chen Design Studio",
        profession: "Architect",
        bio: "Passionate architect with 10+ years of experience in sustainable design.",
        location: "San Francisco, CA",
      },
    }),
    prisma.user.create({
      data: {
        name: "Mike Johnson",
        email: "mike@example.com",
        password: await bcrypt.hash("password123", 12),
        role: UserRole.MODERATOR,
        rank: UserRank.TOP_CONTRIBUTOR,
        isVerified: true,
        company: "Johnson Interiors",
        profession: "Interior Designer",
        bio: "Interior designer specializing in modern commercial spaces.",
        location: "New York, NY",
      },
    }),
  ])

  // Create sample posts
  await Promise.all([
    prisma.post.create({
      data: {
        content:
          "Just finished designing a sustainable office complex in downtown. The integration of green walls and natural lighting has been incredible. What are your thoughts on biophilic design in modern architecture?",
        authorId: users[0].id,
        categoryId: categories[1].id, // Design
        upvotes: 45,
        downvotes: 2,
      },
    }),
    prisma.post.create({
      data: {
        content: "Need the service of a good architect for a proposed house in Mathugama",
        authorId: users[1].id,
        categoryId: categories[0].id, // Business
        isAnonymous: true,
        upvotes: 23,
        downvotes: 1,
      },
    }),
  ])

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
