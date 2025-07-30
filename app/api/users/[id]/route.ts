import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  profession: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  profileVisibility: z.boolean().optional(),
  linkedinUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        company: true,
        profession: true,
        bio: true,
        location: true,
        website: true,
        phone: true,
        profileVisibility: true,
        linkedinUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        role: true,
        rank: true,
        isVerified: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            Post: true,
            Comment: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if profile is private
    const session = await getServerSession(authOptions)
    if (!user.profileVisibility && session?.user?.id !== user.id) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 })
    }

    // Check if the current user is viewing their own profile for conditional data
    const isOwnProfile = session?.user?.id === user.id

    // Transform the data to match the profile page format
    const formattedUser = {
      id: user.id,
      name: user.name || 'Anonymous User',
      email: isOwnProfile ? user.email : undefined, // Only include email for own profile
      image: user.image,
      profession: user.profession,
      company: user.company,
      location: user.location,
      website: user.website,
      phone: user.phone,
      linkedinUrl: user.linkedinUrl,
      twitterUrl: user.twitterUrl,
      instagramUrl: user.instagramUrl,
      rank: user.rank || 'Member',
      posts: user._count.Post,
      comments: user._count.Comment,
      upvotes: 0, // Simplified for now - can be enhanced later
      joinDate: new Date(user.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      isVerified: user.isVerified || false,
      bio: user.bio,
      role: user.role,
      profileVisibility: user.profileVisibility,
      lastActiveAt: user.lastActiveAt,
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    // Check if user can update this profile
    if (session.user.id !== id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const updateData = updateUserSchema.parse(body)

    const user = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        company: true,
        profession: true,
        bio: true,
        location: true,
        website: true,
        phone: true,
        profileVisibility: true,
        linkedinUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        role: true,
        rank: true,
        isVerified: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
