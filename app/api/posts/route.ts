import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  categoryId: z.string(),
  isAnonymous: z.boolean().default(false),
  attachments: z.array(z.string()).optional(),
})

const getPostsSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  category: z.string().optional(),
  sort: z.enum(["latest", "popular", "oldest"]).optional().default("latest"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, categoryId, isAnonymous, attachments } = createPostSchema.parse(body)

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        content,
        categoryId,
        authorId: session.user.id,
        isAnonymous,
        attachments: attachments
          ? {
              create: attachments.map((url) => ({
                url,
                filename: url.split("/").pop() || "attachment",
                size: 0,
                mimeType: "image/jpeg",
              })),
            }
          : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: true,
            isVerified: true,
          },
        },
        category: true,
        attachments: true,
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    })

    // Update category post count
    await prisma.category.update({
      where: { id: categoryId },
      data: { postCount: { increment: 1 } },
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Create post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, category, sort } = getPostsSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      category: searchParams.get("category") || undefined,
      sort: searchParams.get("sort") || "latest",
    })

    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const where = category ? { categoryId: category } : {}

    const orderBy = {
      latest: { createdAt: "desc" as const },
      popular: { upvotes: "desc" as const },
      oldest: { createdAt: "asc" as const },
    }[sort]

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              rank: true,
              isVerified: true,
            },
          },
          category: true,
          attachments: true,
          comments: {
            take: 1,
            orderBy: { upvotes: "desc" },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
