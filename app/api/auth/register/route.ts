import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().nullable().optional().refine((phone) => {
    if (!phone || phone.trim() === '') return true
    // Basic phone number validation (international format)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }, "Invalid phone number format"),
  password: z.string().nullable().optional().refine((pwd) => {
    if (!pwd) return true // Allow null/undefined
    return pwd.length >= 6
  }, "Password must be at least 6 characters"),
  headline: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  industry: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  profession: z.string().nullable().optional(),
  bio: z.string().nullable().optional().refine((bio) => {
    if (!bio || bio.trim() === '') return true
    const wordCount = bio.trim().split(/\s+/).length
    return wordCount <= 150
  }, "About/Summary must not exceed 150 words"),
  portfolioUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid portfolio URL"),
  linkedinUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid LinkedIn URL"),
  facebookUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid Facebook URL"),
  instagramUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid Instagram URL"),
  profileImageUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid profile image URL"),
  workExperience: z.array(z.object({
    jobTitle: z.string(),
    company: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean().nullable().optional(),
    description: z.string().nullable().optional(),
  })).nullable().optional(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    startDate: z.string(),
    endDate: z.string().nullable().optional(),
    isCurrent: z.boolean().nullable().optional(),
    description: z.string().nullable().optional(),
  })).nullable().optional(),
  // Social registration fields
  isSocialRegistration: z.boolean().nullable().optional(),
  provider: z.string().nullable().optional(),
  providerAccountId: z.string().nullable().optional(),
  accessToken: z.string().nullable().optional(),
  tokenType: z.string().nullable().optional(),
  scope: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid website URL"),
  portfolioLinks: z.array(z.string()).nullable().optional(),
  socialMediaLinks: z.array(z.object({
    platform: z.string(),
    url: z.string(),
  })).nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Basic validation for required fields before Zod parsing
    const { email, phoneNumber } = body
    
    // Check if user already exists by email (before Zod validation)
    if (email) {
      const existingUser = await prisma.users.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
      }
    }

    // Check if phone number already exists (before Zod validation)
    if (phoneNumber && phoneNumber.trim() !== '') {
      const existingUserByPhone = await prisma.users.findFirst({
        where: { 
          OR: [
            { phone: phoneNumber },
            { phoneNumber: phoneNumber }
          ]
        }
      })

      if (existingUserByPhone) {
        return NextResponse.json({ error: "User with this phone number already exists" }, { status: 400 })
      }
    }

    // Now parse with Zod schema
    const {
      firstName: validatedFirstName,
      lastName: validatedLastName,
      email: validatedEmail,
      phoneNumber: validatedPhoneNumber,
      password,
      headline,
      skills,
      industry,
      country,
      city,
      company,
      profession,
      bio,
      portfolioUrl,
      linkedinUrl,
      facebookUrl,
      instagramUrl,
      profileImageUrl,
      workExperience,
      education,
      isSocialRegistration,
      provider,
      providerAccountId,
      accessToken,
      tokenType,
      scope,
      websiteUrl,
      portfolioLinks,
      socialMediaLinks,
    } = registerSchema.parse(body)

    // Validate password for non-social registration
    if (!isSocialRegistration && !password) {
      return NextResponse.json({ error: "Password is required for regular registration" }, { status: 400 })
    }

    // Hash password only if provided (for non-social registration)
    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12)
    }

    // Create user and OAuth account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.users.create({
        data: {
          id: crypto.randomUUID(),
          name: `${validatedFirstName} ${validatedLastName}`,
          email: validatedEmail as string,
          phone: validatedPhoneNumber || null,
          phoneNumber: validatedPhoneNumber || null,
          password: hashedPassword,
          company,
          profession: profession || industry,
          location: country && city ? `${city}, ${country}` : (city || country),
          image: profileImageUrl || null,
          bio: [
            bio,
            headline ? `Headline: ${headline}` : '',
            skills && skills.length > 0 ? `Skills: ${skills.join(', ')}` : '',
            websiteUrl ? `Website: ${websiteUrl}` : '',
            portfolioLinks && portfolioLinks.length > 0 ? `Portfolio Links: ${portfolioLinks.join(', ')}` : '',
            socialMediaLinks && socialMediaLinks.length > 0 ? `Social Media: ${socialMediaLinks.map(link => `${link.platform}: ${link.url}`).join(', ')}` : '',
          ].filter(Boolean).join('\n\n'),
          website: websiteUrl || portfolioUrl,
          linkedinUrl,
          instagramUrl: instagramUrl,
          twitterUrl: facebookUrl,
          role: 'MEMBER',
          isVerified: isSocialRegistration ? true : false, // Social registrations are automatically verified
          updatedAt: new Date(),
        },
      })

      // Create OAuth account if this is a social registration
      if (isSocialRegistration && provider && providerAccountId) {
        await tx.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider: provider,
            providerAccountId: providerAccountId,
            access_token: accessToken,
            token_type: tokenType,
            scope: scope,
          }
        })
      }

      return user
    })

    // Store work experience and education info in a comment or log for now
    if (workExperience && workExperience.length > 0) {
      // Future: Store in dedicated tables
    }
    
    if (education && education.length > 0) {
      // Future: Store in dedicated tables
    }

    // Log social registration info for monitoring
    if (isSocialRegistration && provider) {
      // Social registration completed successfully
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result

    return NextResponse.json({ 
      user: userWithoutPassword, 
      message: isSocialRegistration 
        ? `Profile completed successfully! You are now automatically logged in.`
        : "User created successfully. Enhanced profile features will be available after database migration.",
      autoLogin: isSocialRegistration // Flag to indicate auto-login should happen
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extract specific validation error messages
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      // Check if it's a phone number format error
      const phoneError = fieldErrors.find(err => 
        err.field === 'phoneNumber' && err.message === 'Invalid phone number format'
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

    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
