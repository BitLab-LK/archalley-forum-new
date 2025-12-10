/**
 * View Submission Page
 * Read-only view for submitted entries
 * Public access only after December 25, 2025
 * Submission owners can always view their own submissions when logged in
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
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

  // Fetch the registration
  const registration = await prisma.competitionRegistration.findUnique({
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
  });

  // Check if registration exists
  if (!registration) {
    redirect('/submissions?error=registration_not_found');
  }

  // Fetch submission
  const submission = await prisma.competitionSubmission.findUnique({
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
      votingStats: {
        select: {
          publicVoteCount: true,
        },
      },
    },
  });

  // Check if user has voted (only for published submissions)
  let hasVoted = false;
  if (session?.user?.id && submission?.isPublished && submission?.registrationNumber) {
    const vote = await prisma.submissionVote.findUnique({
      where: {
        registrationNumber_userId: {
          registrationNumber: submission.registrationNumber,
          userId: session.user.id,
        },
      },
    });
    hasVoted = !!vote;
  }

  // Only allow viewing if submission exists and is not a draft
  if (!submission) {
    redirect(`/submissions/${registrationNumber}`);
  }

  if (submission.status === 'DRAFT') {
    redirect(`/submissions/${registrationNumber}`);
  }

  // Check public access date (December 25, 2025)
  const publicAccessDate = new Date('2025-12-25T00:00:00+05:30');
  const now = new Date();
  const isPublicAccessAllowed = now >= publicAccessDate;

  // Check if user is the submission owner
  const isOwner = session?.user?.id && submission.userId === session.user.id;

  // Access control:
  // 1. Submission owner can always view (when logged in)
  // 2. Public access allowed after December 25, 2025
  // 3. Otherwise, block access
  if (!isOwner && !isPublicAccessAllowed) {
    // Not the owner and public access not yet allowed
    if (!session?.user) {
      // Guest user - redirect to login with message
      // /auth/login redirects to /auth/register?tab=login
      const callbackUrl = encodeURIComponent(`/submissions/${registrationNumber}/view`);
      const message = encodeURIComponent('Submissions will be publicly available after December 25, 2025');
      redirect(`/auth/login?callbackUrl=${callbackUrl}&message=${message}`);
    } else {
      // Logged in but not the owner - show access denied
      redirect('/submissions?error=access_denied&message=Submissions will be publicly available after December 25, 2025');
    }
  }

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
      voteCount={submission.votingStats?.publicVoteCount ?? 0}
      hasVoted={hasVoted}
      isAuthenticated={!!session?.user?.id}
    />
  );
}

