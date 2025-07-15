import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon is required"),
  slug: z.string().min(1, "Slug is required"),
})

// Fallback categories for when database is not available
const FALLBACK_CATEGORIES = [
  { id: "1", name: "Business", color: "#3B82F6", icon: "💼", slug: "business", count: 0 },
  { id: "2", name: "Design", color: "#8B5CF6", icon: "🎨", slug: "design", count: 0 },
  { id: "3", name: "Career", color: "#10B981", icon: "🚀", slug: "career", count: 0 },
  { id: "4", name: "Construction", color: "#F59E0B", icon: "🏗️", slug: "construction", count: 0 },
  { id: "5", name: "Academic", color: "#EF4444", icon: "📚", slug: "academic", count: 0 },
  { id: "6", name: "Informative", color: "#06B6D4", icon: "ℹ️", slug: "informative", count: 0 },
  { id: "7", name: "Other", color: "#6B7280", icon: "💬", slug: "other", count: 0 },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryName = searchParams.get("name")

    // Test database connection
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.warn("Database connection failed, using fallback categories:", dbError)
      
      if (categoryName) {
        const fallbackCategory = FALLBACK_CATEGORIES.find(
          cat => cat.name.toLowerCase() === categoryName.toLowerCase()
        )
        
        if (!fallbackCategory) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 })
        }
        
        return NextResponse.json({ category: fallbackCategory })
      }
      
      return NextResponse.json(FALLBACK_CATEGORIES)
    }

    if (categoryName) {
      // Search for a specific category by name
      const category = await prisma.categories.findFirst({
        where: {
          name: {
            equals: categoryName,
            mode: 'insensitive' // Case-insensitive search
          }
        },
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          slug: true,
          postCount: true,
          _count: {
            select: {
              Post: true
            }
          }
        }
      })

      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }

      return NextResponse.json({
        category: {
          id: category.id,
          name: category.name,
          color: category.color,
          icon: category.icon,
          slug: category.slug,
          count: category._count.Post
        }
      })
    }

    // If no name provided, return all categories
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        slug: true,
        postCount: true,
        _count: {
          select: {
            Post: true
          }
        }
      },
      orderBy: {
        postCount: 'desc'
      }
    })

    // Format the response to include both stored postCount and actual count
    const formattedCategories = categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      slug: category.slug,
      count: category._count.posts // Use actual post count
    }))

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error("[CATEGORIES_GET]", error)
    
    // If it's a database error, return fallback data
    if (error instanceof Error && error.message.includes('database')) {
      console.warn("Database error, returning fallback categories")
      return NextResponse.json(FALLBACK_CATEGORIES)
    }
    
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color, icon, slug } = createCategorySchema.parse(body)

    // Check if category with same name or slug exists
    const existingCategory = await prisma.categories.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category with this name or slug already exists" }, { status: 400 })
    }

    const category = await prisma.categories.create({
      data: {
        id: `cat-${Date.now()}`,
        name,
        description,
        color,
        icon,
        slug,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Create category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
