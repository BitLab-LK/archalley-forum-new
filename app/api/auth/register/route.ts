import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { sendVerificationEmail } from "@/lib/email-service"

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
  professions: z.array(z.string()).nullable().optional(),
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
  twitterUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid Twitter URL"),
  githubUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid GitHub URL"),
  youtubeUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid YouTube URL"),
  tiktokUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid TikTok URL"),
  behanceUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid Behance URL"),
  dribbbleUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid Dribbble URL"),
  otherSocialUrl: z.string().nullable().optional().refine((url) => {
    if (!url || url.trim() === '') return true
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, "Invalid social media URL"),
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
  // Privacy settings
  emailPrivacy: z.enum(["EVERYONE", "MEMBERS_ONLY", "ONLY_ME"]).optional().default("EVERYONE"),
  phonePrivacy: z.enum(["EVERYONE", "MEMBERS_ONLY", "ONLY_ME"]).optional().default("MEMBERS_ONLY"),
  profilePhotoPrivacy: z.enum(["EVERYONE", "MEMBERS_ONLY", "ONLY_ME"]).optional().default("EVERYONE"),
  // Callback URL for redirect after registration
  callbackUrl: z.string().optional().default("/"),
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
          phoneNumber: phoneNumber
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
      professions,
      country,
      city,
      company,
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
      websiteUrl,
      portfolioLinks,
      socialMediaLinks,
      emailPrivacy,
      phonePrivacy,
      profilePhotoPrivacy,
      callbackUrl,
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

    // Process social media links array into individual URL fields
    console.log('🔗 Processing social media links:', socialMediaLinks)
    let processedLinkedinUrl = linkedinUrl
    let processedFacebookUrl = facebookUrl
    let processedInstagramUrl = instagramUrl
    let processedTwitterUrl: string | null = null
    let processedGithubUrl: string | null = null
    let processedYoutubeUrl: string | null = null
    let processedTiktokUrl: string | null = null
    let processedBehanceUrl: string | null = null
    let processedDribbbleUrl: string | null = null
    let processedOtherSocialUrl: string | null = null

    if (socialMediaLinks && socialMediaLinks.length > 0) {
      socialMediaLinks.forEach(link => {
        const platform = link.platform.toLowerCase().replace(/[\s\/]/g, '') // Remove spaces and slashes
        const url = link.url
        console.log(`📱 Processing ${platform}: ${url}`)
        
        if (platform === 'linkedin' && url) {
          processedLinkedinUrl = processedLinkedinUrl || url
        } else if (platform === 'facebook' && url) {
          processedFacebookUrl = processedFacebookUrl || url
        } else if (platform === 'instagram' && url) {
          processedInstagramUrl = processedInstagramUrl || url
        } else if (platform === 'twitter' || platform === 'twitterx' && url) {
          processedTwitterUrl = processedTwitterUrl || url
        } else if (platform === 'github' && url) {
          processedGithubUrl = processedGithubUrl || url
        } else if (platform === 'youtube' && url) {
          processedYoutubeUrl = processedYoutubeUrl || url
        } else if (platform === 'tiktok' && url) {
          processedTiktokUrl = processedTiktokUrl || url
        } else if (platform === 'behance' && url) {
          processedBehanceUrl = processedBehanceUrl || url
        } else if (platform === 'dribbble' && url) {
          processedDribbbleUrl = processedDribbbleUrl || url
        } else if (platform === 'other' && url) {
          processedOtherSocialUrl = processedOtherSocialUrl || url
        }
      })
    }

    console.log('🔗 Final processed URLs:', {
      linkedin: processedLinkedinUrl,
      facebook: processedFacebookUrl,
      instagram: processedInstagramUrl,
      twitter: processedTwitterUrl,
      github: processedGithubUrl,
      youtube: processedYoutubeUrl,
      tiktok: processedTiktokUrl,
      behance: processedBehanceUrl,
      dribbble: processedDribbbleUrl,
      other: processedOtherSocialUrl
    })

    // Create user and OAuth account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.users.create({
        data: {
          id: crypto.randomUUID(),
          name: `${validatedFirstName} ${validatedLastName}`,
          firstName: validatedFirstName,
          lastName: validatedLastName,
          email: validatedEmail as string,
          phoneNumber: validatedPhoneNumber || null,
          password: hashedPassword,
          
          // Professional fields stored separately
          headline: headline || null,
          skills: skills || [],
          professions: professions || [],
          country: country || null,
          city: city || null,
          company: company || null,
          profession: professions?.[0] || null, // Use first profession for backward compatibility
          bio: bio || null, // Store bio separately, not concatenated
          
          // Location field for backward compatibility
          location: country && city ? `${city}, ${country}` : (city || country),
          
          // Profile image
          image: profileImageUrl || null,
          
          // URLs and Portfolio
          portfolioUrl: portfolioUrl || websiteUrl || null,
          portfolioLinks: portfolioLinks || [],
          linkedinUrl: processedLinkedinUrl || null,
          facebookUrl: processedFacebookUrl || null,
          instagramUrl: processedInstagramUrl || null,
          twitterUrl: processedTwitterUrl || null,
          githubUrl: processedGithubUrl || null,
          youtubeUrl: processedYoutubeUrl || null,
          tiktokUrl: processedTiktokUrl || null,
          behanceUrl: processedBehanceUrl || null,
          dribbbleUrl: processedDribbbleUrl || null,
          otherSocialUrl: processedOtherSocialUrl || null,
          
          // Privacy settings
          emailPrivacy: emailPrivacy || "EVERYONE",
          phonePrivacy: phonePrivacy || "MEMBERS_ONLY", 
          profilePhotoPrivacy: profilePhotoPrivacy || "EVERYONE",
          
          // System fields
          role: 'MEMBER',
          isVerified: isSocialRegistration ? true : false, // Social login users are auto-verified
          emailVerified: isSocialRegistration ? new Date() : null, // Email verified for social, null for email/password until verified
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
          }
        })
      }

      // Create work experience entries
      if (workExperience && workExperience.length > 0) {
        for (const work of workExperience) {
          if (work.jobTitle && work.company) {
            await tx.workExperience.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                jobTitle: work.jobTitle,
                company: work.company,
                startDate: new Date(work.startDate),
                endDate: work.endDate ? new Date(work.endDate) : null,
                isCurrent: work.isCurrent || false,
                description: work.description || null,
              }
            })
          }
        }
      }

      // Create education entries
      if (education && education.length > 0) {
        for (const edu of education) {
          if (edu.degree && edu.institution) {
            await tx.education.create({
              data: {
                id: crypto.randomUUID(),
                userId: user.id,
                degree: edu.degree,
                institution: edu.institution,
                startDate: new Date(edu.startDate),
                endDate: edu.endDate ? new Date(edu.endDate) : null,
                isCurrent: edu.isCurrent || false,
                description: edu.description || null,
              }
            })
          }
        }
      }

      return user
    })

    // For email/password registration, generate verification token and send email
    if (!isSocialRegistration) {
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')
      const expires = new Date()
      expires.setHours(expires.getHours() + 24) // Token expires in 24 hours

      // Store verification token
      await prisma.verificationToken.create({
        data: {
          id: crypto.randomUUID(),
          identifier: validatedEmail,
          token: verificationToken,
          expires,
        },
      })

      // Send verification email
      // Note: callbackUrl is stored in sessionStorage on client side, so we don't need to pass it in email
      const userName = `${validatedFirstName} ${validatedLastName}`
      await sendVerificationEmail(validatedEmail, userName, verificationToken, '/')

      return NextResponse.json({
        user: {
          id: result.id,
          name: result.name,
          email: result.email
        },
        message: "Registration successful! Please check your email to verify your account. After verification, you will be automatically logged in.",
        requiresVerification: true,
        // callbackUrl is stored in sessionStorage on client, no need to pass in redirect
        redirectTo: `/auth/register?tab=login&message=${encodeURIComponent('Registration successful! Please check your email to verify your account.')}`
      }, { status: 201 })
    }

    // Auto-login for social registration
    if (isSocialRegistration && provider) {
      try {
        // Call auto-login API to set session
        const autoLoginResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/auto-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: result.email,
            provider: provider
          })
        })

        if (autoLoginResponse.ok) {
          // Get the session cookie from the auto-login response
          const sessionCookie = autoLoginResponse.headers.get('set-cookie')
          
          const response = NextResponse.json({ 
            user: {
              id: result.id,
              name: result.name,
              email: result.email
            }, 
            message: `Profile completed successfully! You are now automatically logged in.`,
            autoLogin: true,
            redirectTo: callbackUrl || "/"
          }, { status: 201 })

          // Forward the session cookie to the client
          if (sessionCookie) {
            response.headers.set('set-cookie', sessionCookie)
          }

          return response
        } else {
          console.error('Auto-login failed:', await autoLoginResponse.text())
        }
      } catch (error) {
        console.error('Auto-login error:', error)
      }
    }

    // Fallback response for social registration if auto-login fails
    return NextResponse.json({ 
      user: {
        id: result.id,
        name: result.name,
        email: result.email
      }, 
      message: `Profile completed successfully! Please log in to continue.`,
      autoLogin: false,
      redirectTo: callbackUrl || "/"
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
