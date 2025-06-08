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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryName = searchParams.get("name")

    if (categoryName) {
      // Search for a specific category by name
      const category = await prisma.category.findFirst({
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
              posts: true
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
          count: category._count.posts
        }
      })
    }

    // If no name provided, return all categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        icon: true,
        slug: true,
        postCount: true,
        _count: {
          select: {
            posts: true
          }
        }
      },
      orderBy: {
        postCount: 'desc'
      }
    })

    // Format the response to include both stored postCount and actual count
    const formattedCategories = categories.map(category => ({
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
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    })

    if (existingCategory) {
      return NextResponse.json({ error: "Category with this name or slug already exists" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        color,
        icon,
        slug,
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
