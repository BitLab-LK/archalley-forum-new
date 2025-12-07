import { NextRequest, NextResponse } from "next/server"
import { sendSubmissionCreatedEmail } from "@/lib/competition-email-service"
import { prisma } from "@/lib/prisma"

/**
 * Test endpoint to send submission completed email
 * POST /api/test/submission-email
 * Body: { registrationNumber?: string, email?: string }
 * 
 * If registrationNumber is provided, uses that submission
 * Otherwise, uses the most recent submitted submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const registrationNumber = body.registrationNumber || null
    const testEmail = body.email || "chavindun@gmail.com"
    
    let submission;
    let registration;
    let competition;
    let user;

    if (registrationNumber) {
      // Find submission by registration number
      registration = await prisma.competitionRegistration.findUnique({
        where: { registrationNumber },
        include: {
          competition: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!registration) {
        return NextResponse.json({
          success: false,
          error: `Registration with number ${registrationNumber} not found`,
        }, { status: 404 })
      }

      submission = await prisma.competitionSubmission.findUnique({
        where: { registrationId: registration.id },
      });

      if (!submission) {
        return NextResponse.json({
          success: false,
          error: `No submission found for registration ${registrationNumber}`,
        }, { status: 404 })
      }

      competition = registration.competition;
      user = registration.user;
    } else {
      // Find any submitted submission
      submission = await prisma.competitionSubmission.findFirst({
        where: {
          status: {
            in: ['PUBLISHED', 'SUBMITTED', 'VALIDATED'],
          },
        },
        include: {
          registration: {
            include: {
              competition: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      if (!submission) {
        return NextResponse.json({
          success: false,
          error: 'No submitted submission found in database. Please provide a registration number.',
        }, { status: 404 })
      }

      registration = submission.registration;
      competition = registration.competition;
      user = registration.user;
    }

    console.log(`📧 Sending test submission email to ${testEmail} for registration ${registration.registrationNumber}`)
    
    const emailData = {
      submission: {
        registrationNumber: registration.registrationNumber,
        title: submission.title || `Submission ${registration.registrationNumber}`,
        submissionCategory: submission.submissionCategory || 'N/A',
        submittedAt: submission.submittedAt,
      },
      competition: competition as any,
      userName: user.name || 'Participant',
      userEmail: testEmail,
    }
    
    const result = await sendSubmissionCreatedEmail(emailData)
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `Submission completed email sent successfully to ${testEmail}`,
        email: testEmail,
        registrationNumber: registration.registrationNumber,
        submissionId: submission.id,
        submissionTitle: emailData.submission.title,
        submissionCategory: emailData.submission.submissionCategory,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send submission completed email to ${testEmail}`,
        email: testEmail,
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending test submission email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for easy testing
 * GET /api/test/submission-email?registrationNumber=64H945&email=test@example.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationNumber = searchParams.get("registrationNumber")
    const testEmail = searchParams.get("email") || "chavindun@gmail.com"
    
    let submission;
    let registration;
    let competition;
    let user;

    if (registrationNumber) {
      registration = await prisma.competitionRegistration.findUnique({
        where: { registrationNumber },
        include: {
          competition: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!registration) {
        return NextResponse.json({
          success: false,
          error: `Registration with number ${registrationNumber} not found`,
        }, { status: 404 })
      }

      submission = await prisma.competitionSubmission.findUnique({
        where: { registrationId: registration.id },
      });

      if (!submission) {
        return NextResponse.json({
          success: false,
          error: `No submission found for registration ${registrationNumber}`,
        }, { status: 404 })
      }

      competition = registration.competition;
      user = registration.user;
    } else {
      submission = await prisma.competitionSubmission.findFirst({
        where: {
          status: {
            in: ['PUBLISHED', 'SUBMITTED', 'VALIDATED'],
          },
        },
        include: {
          registration: {
            include: {
              competition: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      if (!submission) {
        return NextResponse.json({
          success: false,
          error: 'No submitted submission found in database. Please provide a registration number.',
        }, { status: 404 })
      }

      registration = submission.registration;
      competition = registration.competition;
      user = registration.user;
    }

    console.log(`📧 Sending test submission email to ${testEmail} for registration ${registration.registrationNumber}`)
    
    const emailData = {
      submission: {
        registrationNumber: registration.registrationNumber,
        title: submission.title || `Submission ${registration.registrationNumber}`,
        submissionCategory: submission.submissionCategory || 'N/A',
        submittedAt: submission.submittedAt,
      },
      competition: competition as any,
      userName: user.name || 'Participant',
      userEmail: testEmail,
    }
    
    const result = await sendSubmissionCreatedEmail(emailData)
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `Submission completed email sent successfully to ${testEmail}`,
        email: testEmail,
        registrationNumber: registration.registrationNumber,
        submissionId: submission.id,
        submissionTitle: emailData.submission.title,
        submissionCategory: emailData.submission.submissionCategory,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to send submission completed email to ${testEmail}`,
        email: testEmail,
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending test submission email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

