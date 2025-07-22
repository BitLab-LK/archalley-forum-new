import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { randomUUID } from "crypto"

// Get all pages
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const pages = await prisma.pages.findMany({
      orderBy: {
        updatedAt: "desc"
      }
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("[ADMIN_PAGES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Create a new page
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, slug, content, isPublished } = body

    if (!title || !slug || !content) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if slug is unique
    const existingPage = await prisma.pages.findUnique({
      where: { slug }
    })

    if (existingPage) {
      return new NextResponse("Page with this slug already exists", { status: 400 })
    }
    

    const page = await prisma.pages.create({
      data: {
        id: randomUUID(),
        title,
        slug,
        content,
        isPublished: isPublished || false,
        authorId: session.user.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error("[ADMIN_PAGES_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Update a page
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { id, title, slug, content, isPublished } = body

    if (!id || !title || !slug || !content) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Check if slug is unique (excluding current page)
    const existingPage = await prisma.pages.findFirst({
      where: {
        slug,
        id: { not: id }
      }
    })

    if (existingPage) {
      return new NextResponse("Page with this slug already exists", { status: 400 })
    }

    const page = await prisma.pages.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        isPublished: isPublished || false,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(page)
  } catch (error) {
    console.error("[ADMIN_PAGES_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Delete a page
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const pageId = searchParams.get("pageId")

    if (!pageId) {
      return new NextResponse("Missing page ID", { status: 400 })
    }

    await prisma.pages.delete({
      where: { id: pageId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ADMIN_PAGES_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 