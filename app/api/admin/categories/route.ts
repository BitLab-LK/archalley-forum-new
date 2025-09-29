// Categories Management API Route
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
import type { NextRequest } from "next/server"

// GET - List all categories
export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    
    logAdminAction("VIEW_CATEGORIES", user!.id, {
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        slug: true,
        postCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Post: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    const formattedCategories = categories.map(category => ({
      ...category,
      actualPostCount: category._count.Post,
      lastUpdated: category.updatedAt.toISOString().split("T")[0]
    }))

    return NextResponse.json({ categories: formattedCategories })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    const body = await request.json()
    const { name, description, color, slug } = body

    if (!name || !slug) {
      return new NextResponse("Name and slug are required", { status: 400 })
    }

    logAdminAction("CREATE_CATEGORY", user!.id, {
      categoryName: name,
      categorySlug: slug,
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Check if slug already exists
    const existingCategory = await prisma.categories.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      return new NextResponse("Category slug already exists", { status: 400 })
    }

    const category = await prisma.categories.create({
      data: {
        id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: description || "",
        color: color || "#3B82F6",

        slug,
        postCount: 0,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: "Category created successfully", 
      category 
    })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// PATCH - Update category
export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    const body = await request.json()
    const { categoryId, name, description, color, slug } = body

    if (!categoryId) {
      return new NextResponse("Category ID is required", { status: 400 })
    }

    logAdminAction("UPDATE_CATEGORY", user!.id, {
      categoryId,
      changes: { name, description, color, slug },
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // If updating slug, check for conflicts
    if (slug) {
      const existingCategory = await prisma.categories.findFirst({
        where: { 
          slug,
          NOT: { id: categoryId }
        }
      })

      if (existingCategory) {
        return new NextResponse("Category slug already exists", { status: 400 })
      }
    }

    const updatedCategory = await prisma.categories.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),

        ...(slug && { slug }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      message: "Category updated successfully", 
      category: updatedCategory 
    })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId")

    if (!categoryId) {
      return new NextResponse("Category ID is required", { status: 400 })
    }

    logAdminAction("DELETE_CATEGORY", user!.id, {
      categoryId,
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Check if category has posts
    const postsCount = await prisma.post.count({
      where: { categoryId }
    })

    if (postsCount > 0) {
      return new NextResponse(`Cannot delete category with ${postsCount} posts. Move posts to another category first.`, { status: 400 })
    }

    await prisma.categories.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ 
      message: "Category deleted successfully" 
    })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}