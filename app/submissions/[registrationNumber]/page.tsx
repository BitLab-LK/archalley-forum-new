/**
 * Create Submission Page
 * Dynamic route for creating/editing a submission for a specific registration
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SubmissionForm } from './submission-form';

export const metadata = {
  title: 'Create Submission - Archalley',
  description: 'Create or edit your competition submission',
};

export default async function CreateSubmissionPage({
  params,
}: {
  params: Promise<{ registrationNumber: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/submissions');
  }

  const { registrationNumber } = await params;

  // Fetch the registration to verify it belongs to the user
  const registration = await prisma.competitionRegistration.findUnique({
    where: {
      registrationNumber: registrationNumber,
    },
    select: {
      id: true,
      registrationNumber: true,
      userId: true,
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

  // Check if user is admin or superadmin
  const userRole = session.user.role as string;
  const isAdminOrSuperAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  // Check if registration belongs to the user (unless admin)
  if (!isAdminOrSuperAdmin && registration.userId !== session.user.id) {
    redirect('/submissions?error=unauthorized');
  }

  // Check if registration is confirmed
  if (registration.status !== 'CONFIRMED') {
    redirect('/submissions?error=registration_not_confirmed');
  }

  // Fetch submission separately (no direct relation in Prisma schema)
  const submission = await prisma.competitionSubmission.findUnique({
    where: {
      registrationId: registration.id,
    },
    select: {
      id: true,
      status: true,
      title: true,
      submissionCategory: true,
    },
  });

  // If submission exists and is not a draft, redirect to view page
  if (submission && submission.status !== 'DRAFT') {
    redirect(`/submissions/${registrationNumber}/view`);
  }

  return (
    <SubmissionForm
      registration={{
        id: registration.id,
        registrationNumber: registration.registrationNumber,
        competitionId: registration.competitionId,
        status: registration.status,
        createdAt: new Date().toISOString(), // Placeholder, not used in form
        competition: registration.competition,
        registrationType: registration.registrationType,
        submission: submission || undefined,
      }}
    />
  );
}

