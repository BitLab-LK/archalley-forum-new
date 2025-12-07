/**
 * Get Single Submission API
 * GET /api/submissions/[submissionId]
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { submissionId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'draft' to fetch by registrationId
    
    let submission;
    
    if (type === 'draft') {
      // Fetch draft by registrationId
      const registration = await prisma.competitionRegistration.findUnique({
        where: { 
          id: submissionId,
          userId: session.user.id,
        },
      });
      
      if (!registration) {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }
      
      submission = await prisma.competitionSubmission.findUnique({
        where: { registrationId: registration.id },
      });
      
      // Return draft even if it doesn't exist yet (for new submissions)
      if (!submission) {
        return NextResponse.json({
          success: true,
          submission: null,
        });
      }
    } else {
      // Fetch submission by submissionId
      submission = await prisma.competitionSubmission.findUnique({
        where: { id: submissionId },
        include: {
          votes: true,
        },
      });
      
      if (!submission) {
        return NextResponse.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }
      
      // Verify ownership - user can only access their own submissions
      if (submission.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to access this submission' },
          { status: 403 }
        );
      }
    }
    
    // Optionally fetch related data
    const [registration, competition] = await Promise.all([
      prisma.competitionRegistration.findUnique({
        where: { id: submission.registrationId },
        include: { registrationType: true },
      }),
      prisma.competition.findUnique({
        where: { id: submission.competitionId },
      }),
    ]);
    
    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        registration: registration || undefined,
        competition: competition || undefined,
      },
    });
  } catch (error) {
    console.error('Get submission error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    );
  }
}
