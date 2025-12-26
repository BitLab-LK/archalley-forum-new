/**
 * View Submission Page
 * Read-only view for submitted entries
 * Public access only after December 25, 2025
 * Submission owners can always view their own submissions when logged in
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma, withRetry } from '@/lib/prisma';
import { ViewSubmissionForm } from './view-submission-form';

export const metadata = {
  title: 'View Submission - Archalley',
  description: 'View your submitted competition entry',
};

export default async function ViewSubmissionPage({
  params,
}: {
  params: Promise<{ registrationNumber: string }>;
}) {
  const { registrationNumber } = await params;
  const session = await getServerSession(authOptions);

  try {
    // Fetch the registration with retry logic for connection errors
    const registration = await withRetry(() =>
      prisma.competitionRegistration.findUnique({
        where: {
          registrationNumber: registrationNumber,
        },
        select: {
          id: true,
          userId: true,
          registrationNumber: true,
          status: true,
          competitionId: true,
          competition: {
            select: {
              id: true,
              title: true,
            },
          },
          registrationType: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      })
    );

    // Check if registration exists
    if (!registration) {
      redirect('/submissions?error=registration_not_found');
    }

    // Fetch submission with retry logic
    const submission = await withRetry(() =>
      prisma.competitionSubmission.findUnique({
        where: {
          registrationId: registration.id,
        },
        select: {
          id: true,
          userId: true,
          status: true,
          title: true,
          submissionCategory: true,
          description: true,
          keyPhotographUrl: true,
          additionalPhotographs: true,
          documentFileUrl: true,
          videoFileUrl: true,
          submittedAt: true,
          createdAt: true,
          updatedAt: true,
          isPublished: true,
          registrationNumber: true,
        },
      })
    );

    // Fetch voting stats separately (may not exist for new submissions)
    let voteCount = 0;
    if (submission?.registrationNumber) {
      try {
        const votingStats = await withRetry(() =>
          prisma.submissionVotingStats.findUnique({
            where: {
              registrationNumber: submission.registrationNumber,
            },
            select: {
              publicVoteCount: true,
            },
          })
        );
        voteCount = votingStats?.publicVoteCount ?? 0;
      } catch (error) {
        // Voting stats may not exist for new submissions, so we ignore errors here
        console.warn('Failed to fetch voting stats (may not exist yet):', error);
        voteCount = 0;
      }
    }

    // Check if user has voted (only for published submissions)
    let hasVoted = false;
    if (session?.user?.id && submission?.isPublished && submission?.registrationNumber) {
      try {
        const vote = await withRetry(() =>
          prisma.submissionVote.findUnique({
            where: {
              registrationNumber_userId: {
                registrationNumber: submission.registrationNumber,
                userId: session.user.id,
              },
            },
          })
        );
        hasVoted = !!vote;
      } catch (error) {
        // If we can't check vote status, default to false
        console.warn('Failed to check vote status:', error);
        hasVoted = false;
      }
    }

    // Only allow viewing if submission exists and is not a draft
    if (!submission) {
      redirect(`/submissions/${registrationNumber}`);
    }

    if (submission.status === 'DRAFT') {
      redirect(`/submissions/${registrationNumber}`);
    }

    // Check if user is the submission owner
    const isOwner = session?.user?.id && submission.userId === session.user.id;

    // Access control:
    // 1. Submission owner can always view (when logged in)
    // 2. Published submissions are publicly viewable by anyone
    // 3. Non-published submissions require ownership
    if (!submission.isPublished && !isOwner) {
      // Not published and not the owner - block access
      if (!session?.user) {
        // Guest user - redirect to login with message
        const callbackUrl = encodeURIComponent(`/submissions/${registrationNumber}/view`);
        const message = encodeURIComponent('This submission is not yet published');
        redirect(`/auth/login?callbackUrl=${callbackUrl}&message=${message}`);
      } else {
        // Logged in but not the owner and not published - show access denied
        redirect('/submissions?error=access_denied&message=This submission is not yet published');
      }
    }

    // Check if user is admin or superadmin
    const userRole = session?.user?.role as string;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    return (
      <ViewSubmissionForm
        registration={{
          id: registration.id,
          registrationNumber: registration.registrationNumber,
          competitionId: registration.competitionId,
          status: registration.status,
          createdAt: new Date().toISOString(),
          competition: registration.competition,
          registrationType: registration.registrationType,
        }}
        submission={submission}
        voteCount={voteCount}
        hasVoted={hasVoted}
        isAuthenticated={!!session?.user?.id}
        isAdmin={isAdmin}
      />
    );
  } catch (error: any) {
    console.error('Error loading submission view page:', error);
    
    // Handle connection pool exhaustion specifically
    if (error?.code === 'P2037' || error?.errorCode === 'P2037' || 
        error?.message?.includes('too many connections') || 
        error?.message?.includes('connection slots')) {
      // Redirect to submissions list with error message
      redirect('/submissions?error=database_unavailable&message=Database temporarily unavailable. Please try again in a moment.');
    }
    
    // For other errors, redirect to submissions list
    redirect('/submissions?error=load_failed');
  }
}

