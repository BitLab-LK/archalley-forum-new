import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  // Basic Information
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
  image: z.string().optional(),
  
  // Professional Profile
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  portfolioUrl: z.string().optional(),
  
  // Social Media
  linkedinUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  
  // Note: workExperience and education are handled separately via their own endpoints
  // They are not included in this schema to avoid Prisma type conflicts
  
  // Legacy fields for backward compatibility
  company: z.string().optional(),
  profession: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  profileVisibility: z.boolean().optional(),
  twitterUrl: z.string().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        // Work Experience & Education as relationships
        workExperience: {
          orderBy: {
            startDate: 'desc'
          }
        },
        education: {
          orderBy: {
            startDate: 'desc'
          }
        },
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
      
      // Basic Information
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      
      // Professional Profile
      headline: user.headline,
      skills: user.skills,
      industry: user.industry,
      country: user.country,
      city: user.city,
      bio: user.bio,
      portfolioUrl: user.portfolioUrl,
      
      // Social Media
      linkedinUrl: user.linkedinUrl,
      facebookUrl: user.facebookUrl,
      instagramUrl: user.instagramUrl,
      
      // Work Experience & Education
      workExperience: user.workExperience?.map(work => ({
        ...work,
        startDate: work.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        endDate: work.endDate ? work.endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
      })),
      education: user.education?.map(edu => ({
        ...edu,
        startDate: edu.startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        endDate: edu.endDate ? edu.endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null,
      })),
      
      // Legacy fields
      profession: user.profession,
      company: user.company,
      location: user.location,
      website: user.website,
      phone: user.phone,
      twitterUrl: user.twitterUrl,
      
      // System fields
      rank: user.rank || 'Member',
      posts: user._count.Post,
      comments: user._count.Comment,
      upvotes: 0, // Simplified for now - can be enhanced later
      joinDate: new Date(user.createdAt).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      isVerified: user.isVerified || false,
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
        
        // Basic Information
        firstName: true,
        lastName: true,
        phoneNumber: true,
        
        // Professional Profile
        headline: true,
        skills: true,
        industry: true,
        country: true,
        city: true,
        bio: true,
        portfolioUrl: true,
        
        // Social Media
        linkedinUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        
        // Legacy fields
        company: true,
        profession: true,
        location: true,
        website: true,
        phone: true,
        profileVisibility: true,
        twitterUrl: true,
        
        // System fields
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
