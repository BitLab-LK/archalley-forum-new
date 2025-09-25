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
  phoneNumber: z.string().optional().refine((phone) => {
    if (!phone || phone.trim() === '') return true
    // Basic phone number validation (international format)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }, "Invalid phone number format"),
  image: z.string().optional(), // Add image field
  
  // Professional Profile
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional().refine((bio) => {
    if (!bio) return true; // Allow empty bio
    const wordCount = bio.trim().split(/\s+/).length;
    return wordCount <= 150;
  }, {
    message: "Bio must be 150 words or less"
  }),
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
  phone: z.string().optional().refine((phone) => {
    if (!phone || phone.trim() === '') return true
    // Basic phone number validation (international format)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }, "Invalid phone number format"),
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
        // Social accounts information
        Account: {
          select: {
            provider: true
          }
        },
        userBadges: {
          include: {
            badges: true
          },
          take: 10,
          orderBy: {
            earnedAt: 'desc'
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
    const viewerIsAuthenticated = !!session?.user
    const viewerIsMember = true // Assuming all authenticated users are members

    // Helper function to check privacy
    const shouldShowField = (privacy: string | null) => {
      if (isOwnProfile) return true // Owner always sees their fields
      
      switch (privacy) {
        case "EVERYONE":
          return true
        case "MEMBERS_ONLY":
          return viewerIsAuthenticated && viewerIsMember
        case "ONLY_ME":
          return false
        default:
          return true // Default to visible for compatibility
      }
    }

    // Transform the data to match the profile page format
    const formattedUser = {
      id: user.id,
      name: user.name || 'Anonymous User',
      email: shouldShowField(user.emailPrivacy) ? user.email : undefined,
      image: user.image,
      
      // Privacy settings (always include for the frontend to know the settings)
      emailPrivacy: user.emailPrivacy,
      phonePrivacy: user.phonePrivacy,
      profilePhotoPrivacy: user.profilePhotoPrivacy,
      
      // Basic Information
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: shouldShowField(user.phonePrivacy) ? user.phoneNumber : undefined,
      
      // Professional Profile
      headline: user.headline,
      skills: user.skills,
      professions: user.professions,
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
      phone: shouldShowField(user.phonePrivacy) ? user.phone : undefined,
      twitterUrl: user.twitterUrl,
      
      // System fields
      rank: user.userBadges?.[0]?.badges?.name || 'Member',
      badgeCount: user.userBadges?.length || 0,
      badges: user.userBadges || [],
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
      
      // Email Notification Preferences (only for own profile)
      ...(isOwnProfile && {
        emailNotifications: user.emailNotifications,
        notifyOnComment: user.notifyOnComment,
        notifyOnLike: user.notifyOnLike,
        notifyOnMention: user.notifyOnMention,
        notifyOnReply: user.notifyOnReply,
        notifyOnNewPost: user.notifyOnNewPost,
        notifyOnSystem: user.notifyOnSystem,
        emailDigest: user.emailDigest,
        // Add password and account info for privacy settings
        password: user.password, // Include password field to check if user has one
        twoFactorEnabled: user.twoFactorEnabled,
        Account: user.Account, // Include social accounts info
      }),
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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
    const userRole = session.user.role as string;
    if (session.user.id !== id && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const updateData = updateUserSchema.parse(body)

    // Check if phone number already exists (if provided and different from current)
    if ((updateData.phoneNumber && updateData.phoneNumber.trim() !== '') || 
        (updateData.phone && updateData.phone.trim() !== '')) {
      const phoneToCheck = updateData.phoneNumber || updateData.phone
      
      const existingUserByPhone = await prisma.users.findFirst({
        where: { 
          AND: [
            {
              OR: [
                { phone: phoneToCheck },
                { phoneNumber: phoneToCheck }
              ]
            },
            {
              id: {
                not: id // Exclude current user
              }
            }
          ]
        }
      })

      if (existingUserByPhone) {
        return NextResponse.json({ error: "User with this phone number already exists" }, { status: 400 })
      }
    }

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
        userBadges: {
          include: {
            badges: true
          },
          take: 5
        },
        isVerified: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extract specific validation error messages
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      // Check if it's a phone number format error
      const phoneError = fieldErrors.find(err => 
        (err.field === 'phoneNumber' || err.field === 'phone') && 
        err.message === 'Invalid phone number format'
      )
      
      if (phoneError) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
      }
      
      // For other validation errors, return the first specific message
      const firstError = fieldErrors[0]
      return NextResponse.json({ 
        error: firstError?.message || "Invalid input", 
        field: firstError?.field,
        details: fieldErrors 
      }, { status: 400 })
    }

    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
