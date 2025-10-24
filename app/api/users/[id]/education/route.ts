import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { randomUUID } from "crypto"

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
})

const updateEducationSchema = z.array(educationSchema.extend({
  id: z.string().optional(), // Optional for new entries
}))

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const education = await prisma.education.findMany({
      where: { userId: id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ education })
  } catch (error) {
    console.error("Get education error:", error)
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
    const userRole = session.user.role as string;
    if (session.user.id !== id && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const educations = updateEducationSchema.parse(body.education || [])

    // Delete existing education entries and recreate them
    await prisma.education.deleteMany({
      where: { userId: id }
    })

    // Create new education entries
    if (educations.length > 0) {
      await prisma.education.createMany({
        data: educations.map(edu => ({
          id: randomUUID(),
          degree: edu.degree,
          institution: edu.institution,
          startDate: new Date(edu.startDate),
          endDate: edu.endDate ? new Date(edu.endDate) : null,
          isCurrent: edu.isCurrent,
          description: edu.description,
          userId: id,
          updatedAt: new Date(),
        }))
      })
    }

    // Fetch updated education
    const updatedEducation = await prisma.education.findMany({
      where: { userId: id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ education: updatedEducation })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Update education error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
