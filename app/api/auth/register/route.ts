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
  password: z.string().min(6, "Password must be at least 6 characters"),
  image: z.string().optional(), // Add image field
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  company: z.string().optional(),
  profession: z.string().optional(),
  bio: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
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
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 Registration request received:', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      image: body.image || 'No image provided'
    })
    
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      image,
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
      workExperience,
      education,
    } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Check if phone number already exists (if provided)
    if (phoneNumber) {
      console.log('📞 Checking phone number uniqueness:', phoneNumber)
      const existingPhoneUser = await prisma.users.findFirst({
        where: { phone: phoneNumber },
      })

      if (existingPhoneUser) {
        console.log('❌ Phone number already exists for user:', existingPhoneUser.id)
        return NextResponse.json({ error: "User with this phone number already exists" }, { status: 400 })
      }
      console.log('✅ Phone number is available')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with current schema (temporarily store additional info in existing fields)
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        name: `${firstName} ${lastName}`,
        email,
        image: image || null, // Add profile image
        phone: phoneNumber,
        password: hashedPassword,
        company,
        profession: profession || industry,
        location: country && city ? `${city}, ${country}` : (city || country),
        bio: [
          bio,
          headline ? `Headline: ${headline}` : '',
          skills && skills.length > 0 ? `Skills: ${skills.join(', ')}` : '',
          portfolioUrl ? `Portfolio: ${portfolioUrl}` : '',
        ].filter(Boolean).join('\n\n'),
        website: portfolioUrl,
        linkedinUrl,
        instagramUrl: instagramUrl,
        twitterUrl: facebookUrl, // Using twitterUrl field for Facebook temporarily
        updatedAt: new Date(),
      },
    })

    console.log('✅ User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || 'No image'
    })

    // Store work experience and education info in a comment or log for now
    if (workExperience && workExperience.length > 0) {
      console.log('Work Experience for user', user.id, ':', workExperience)
    }
    
    if (education && education.length > 0) {
      console.log('Education for user', user.id, ':', education)
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ 
      user: userWithoutPassword, 
      message: "User created successfully. Enhanced profile features will be available after database migration." 
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
