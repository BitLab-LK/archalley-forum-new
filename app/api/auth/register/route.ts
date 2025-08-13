import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  company: z.string().optional(),
  profession: z.string().optional(),
  bio: z.string().optional().refine((bio) => {
    if (!bio || bio.trim() === '') return true
    const wordCount = bio.trim().split(/\s+/).length
    return wordCount <= 150
  }, "About/Summary must not exceed 150 words"),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  profileImageUrl: z.string().url().optional().or(z.literal("")), // Add profile image URL
  workExperience: z.array(z.object({
    jobTitle: z.string(),
    company: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    description: z.string().optional(),
  })).optional(),
  // Social registration fields
  isSocialRegistration: z.boolean().optional(),
  provider: z.string().optional(),
  providerAccountId: z.string().optional(),
  accessToken: z.string().optional(),
  tokenType: z.string().optional(),
  scope: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  portfolioLinks: z.array(z.string()).optional(),
  socialMediaLinks: z.array(z.object({
    platform: z.string(),
    url: z.string(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
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

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

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
          name: `${firstName} ${lastName}`,
          email,
          phone: phoneNumber,
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
        console.log(`OAuth account linked for ${email} via ${provider}`)
      }

      return user
    })

    // Store work experience and education info in a comment or log for now
    if (workExperience && workExperience.length > 0) {
      console.log('Work Experience for user', result.id, ':', workExperience)
    }
    
    if (education && education.length > 0) {
      console.log('Education for user', result.id, ':', education)
    }

    // Log social registration info
    if (isSocialRegistration && provider) {
      console.log(`Social registration completed for ${email} via ${provider} with automatic account linking`)
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
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
