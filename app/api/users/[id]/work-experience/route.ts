import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { randomUUID } from "crypto"

const workExperienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
})

const updateWorkExperienceSchema = z.array(workExperienceSchema.extend({
  id: z.string().optional(), // Optional for new entries
}))

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const workExperience = await prisma.workExperience.findMany({
      where: { userId: id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ workExperience })
  } catch (error) {
    console.error("Get work experience error:", error)
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
    const workExperiences = updateWorkExperienceSchema.parse(body.workExperience || [])

    // Delete existing work experiences and recreate them
    await prisma.workExperience.deleteMany({
      where: { userId: id }
    })

    // Create new work experiences
    if (workExperiences.length > 0) {
      await prisma.workExperience.createMany({
        data: workExperiences.map(exp => ({
          id: randomUUID(),
          jobTitle: exp.jobTitle,
          company: exp.company,
          startDate: new Date(exp.startDate),
          endDate: exp.endDate ? new Date(exp.endDate) : null,
          isCurrent: exp.isCurrent,
          description: exp.description,
          userId: id,
          updatedAt: new Date(),
        }))
      })
    }

    // Fetch updated work experiences
    const updatedWorkExperience = await prisma.workExperience.findMany({
      where: { userId: id },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ workExperience: updatedWorkExperience })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Update work experience error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
