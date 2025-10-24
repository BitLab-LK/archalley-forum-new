// Categories Management API Route
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
import { clearCategoryCache } from "@/lib/ai-service"
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
        color: true,
        slug: true,
        postCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            postCategories: true, // Count PostCategory junction entries
            primaryPosts: true    // Count posts where this is primary category
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    const formattedCategories = categories.map(category => ({
      ...category,
      actualPostCount: category._count.postCategories + category._count.primaryPosts,
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
    const { name, color, slug } = body

    if (!name || !slug) {
      return new NextResponse("Name and slug are required", { status: 400 })
    }

    logAdminAction("CREATE_CATEGORY", user!.id, {
      categoryName: name,
      categorySlug: slug,
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Check if slug already exists (slug will be used as ID)
    const existingCategory = await prisma.categories.findFirst({
      where: { 
        OR: [
          { slug },
          { id: slug }
        ]
      }
    })

    if (existingCategory) {
      return new NextResponse("Category slug already exists", { status: 400 })
    }

    const category = await prisma.categories.create({
      data: {
        id: slug, // Use slug as ID for consistency with existing categories
        name,
        color: color || "#E0F2FE",
        slug,
        postCount: 0,
        updatedAt: new Date()
      }
    })

    // Clear AI category cache to ensure new category is immediately available for AI categorization
    clearCategoryCache()
    console.log("✨ Category cache cleared after creating:", category.name)

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
    const { categoryId, name, color, slug } = body

    if (!categoryId) {
      return new NextResponse("Category ID is required", { status: 400 })
    }

    // Check if category has posts before allowing name/slug changes
    if (name || slug) {
      const [primaryPostsCount, junctionPostsCount] = await Promise.all([
        prisma.post.count({
          where: { primaryCategoryId: categoryId }
        }),
        prisma.postCategory.count({
          where: { categoryId }
        })
      ])

      const totalPostsCount = primaryPostsCount + junctionPostsCount

      if (totalPostsCount > 0) {
        if (name) {
          return new NextResponse(`Cannot change category name when it has ${totalPostsCount} posts. Only color changes are allowed.`, { status: 400 })
        }
        if (slug) {
          return new NextResponse(`Cannot change category slug when it has ${totalPostsCount} posts. Only color changes are allowed.`, { status: 400 })
        }
      }
    }

    logAdminAction("UPDATE_CATEGORY", user!.id, {
      categoryId,
      changes: { name, color, slug },
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // If updating slug, check for conflicts and update ID as well
    if (slug) {
      const existingCategory = await prisma.categories.findFirst({
        where: { 
          OR: [
            { slug },
            { id: slug }
          ],
          NOT: { id: categoryId }
        }
      })

      if (existingCategory) {
        return new NextResponse("Category slug already exists", { status: 400 })
      }

      // Get current category data for the transaction
      const currentCategory = await prisma.categories.findUnique({
        where: { id: categoryId }
      })

      if (!currentCategory) {
        return new NextResponse("Category not found", { status: 404 })
      }

      // If slug is changing, we need to update the ID as well using a transaction
      // This ensures data integrity across all related tables
      const updatedCategory = await prisma.$transaction(async (tx) => {
        // First, update all foreign key references
        await tx.post.updateMany({
          where: { primaryCategoryId: categoryId },
          data: { primaryCategoryId: slug }
        })

        await tx.postCategory.updateMany({
          where: { categoryId: categoryId },
          data: { categoryId: slug }
        })

        // Then delete the old category
        await tx.categories.delete({
          where: { id: categoryId }
        })

        // Finally, create the new category with the new ID
        return await tx.categories.create({
          data: {
            id: slug, // New ID matches the slug
            name: name || currentCategory.name,
            color: color || currentCategory.color,
            slug: slug,
            postCount: currentCategory.postCount,
            createdAt: currentCategory.createdAt,
            updatedAt: new Date()
          }
        })
      })

      // Clear AI category cache to ensure updated category is reflected in AI categorization
      clearCategoryCache()
      console.log("✨ Category cache cleared after updating with new ID:", updatedCategory.name)

      return NextResponse.json({ 
        message: "Category updated successfully with new ID", 
        category: updatedCategory 
      })
    }

    // For non-slug updates (only name or color changes)
    const updatedCategory = await prisma.categories.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        updatedAt: new Date()
      }
    })

    // Clear AI category cache to ensure updated category is reflected in AI categorization
    clearCategoryCache()
    console.log("✨ Category cache cleared after updating:", updatedCategory.name)

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

    // Check if category has posts (either as primary category or in junction table)
    const [primaryPostsCount, junctionPostsCount] = await Promise.all([
      prisma.post.count({
        where: { primaryCategoryId: categoryId }
      }),
      prisma.postCategory.count({
        where: { categoryId }
      })
    ])

    const totalPostsCount = primaryPostsCount + junctionPostsCount

    if (totalPostsCount > 0) {
      return new NextResponse(`Cannot delete category with ${totalPostsCount} posts. Move posts to another category first.`, { status: 400 })
    }

    await prisma.categories.delete({
      where: { id: categoryId }
    })

    // Clear AI category cache to ensure deleted category is removed from AI categorization
    clearCategoryCache()
    console.log("✨ Category cache cleared after deleting category:", categoryId)

    return NextResponse.json({ 
      message: "Category deleted successfully" 
    })
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}