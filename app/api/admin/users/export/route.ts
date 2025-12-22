import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    
    // Update admin activity for active user tracking
    const { updateUserActivityAsync } = await import("@/lib/activity-service")
    updateUserActivityAsync(user!.id)
    
    // Log admin action
    logAdminAction("EXPORT_USERS", user!.id, {
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Get all users with their competition registrations and submissions
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        competitionRegistrations: {
          select: {
            id: true,
            competitionId: true,
            status: true,
            submissionStatus: true,
            createdAt: true,
            competition: {
              select: {
                title: true,
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        },
        _count: {
          select: {
            competitionRegistrations: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Get all submissions to check submission status
    const allSubmissions = await prisma.competitionSubmission.findMany({
      select: {
        userId: true,
        registrationId: true,
        status: true,
        competitionId: true,
      }
    })

    // Create a map of registrationId -> submission status
    const registrationSubmissionMap = new Map<string, string>()
    
    allSubmissions.forEach(submission => {
      registrationSubmissionMap.set(submission.registrationId, submission.status)
    })

    // Format data for CSV
    const csvRows = []
    
    // CSV Header
    csvRows.push([
      "Name",
      "Email",
      "Competition Registration Status",
      "Competition Submission Status"
    ].join(","))

    // CSV Rows
    users.forEach(user => {
      const name = user.name || "N/A"
      const email = user.email || ""
      
      // Determine competition registration status
      // Use the most recent registration if multiple exist
      let registrationStatus = "Not Registered"
      if (user.competitionRegistrations.length > 0) {
        // Sort by createdAt descending to get most recent (assuming orderBy in query)
        const latestRegistration = user.competitionRegistrations[0]
        registrationStatus = latestRegistration.status || "Unknown"
      }

      // Determine competition submission status
      let submissionStatus = "Not Submitted"
      if (user.competitionRegistrations.length > 0) {
        // Check if there's a submission for any of the user's registrations
        const latestRegistration = user.competitionRegistrations[0]
        const submissionStatusFromSubmission = registrationSubmissionMap.get(latestRegistration.id)
        
        if (submissionStatusFromSubmission) {
          // User has a submission - use the submission status
          submissionStatus = submissionStatusFromSubmission
        } else {
          // User has registration but no submission - use the submissionStatus from registration
          submissionStatus = latestRegistration.submissionStatus || "Not Submitted"
        }
      }

      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCsvValue = (value: string) => {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }

      csvRows.push([
        escapeCsvValue(name),
        escapeCsvValue(email),
        escapeCsvValue(registrationStatus),
        escapeCsvValue(submissionStatus)
      ].join(","))
    })

    const csvContent = csvRows.join("\n")

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("[ADMIN_USERS_EXPORT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

