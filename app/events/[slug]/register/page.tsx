/**
 * Competition Registration Page
 * Main page for users to register for a competition
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RegistrationClient from './registration-client';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const competition = await prisma.competition.findUnique({
    where: { slug },
  });

  if (!competition) {
    return {
      title: 'Competition Not Found',
    };
  }

  return {
    title: `Register for ${competition.title} | Archalley`,
    description: competition.description,
  };
}

export default async function RegistrationPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/events/${slug}/register`);
  }

  // Fetch competition data
  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      registrationTypes: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!competition) {
    redirect('/events');
  }

  // Check if registration is open
  // Compare dates using UTC to avoid timezone issues
  const now = new Date();
  const startDate = new Date(competition.startDate);
  const deadline = new Date(competition.registrationDeadline);
  
  // Get UTC date components for comparison (compare only year, month, day)
  // Format as YYYYMMDD for proper string comparison
  const getUTCDateString = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  };
  
  const nowDateStr = getUTCDateString(now);
  const startDateStr = getUTCDateString(startDate);
  const deadlineDateStr = getUTCDateString(deadline);
  
  // Compare date strings (registration starts at the beginning of the start date)
  const hasStarted = nowDateStr >= startDateStr;
  // Registration ends at the end of the deadline date, so we check if now is after the deadline
  const hasEnded = nowDateStr > deadlineDateStr;
  
  // Registration is open if: status is REGISTRATION_OPEN, has started, and hasn't ended
  const isOpen = 
    competition.status === 'REGISTRATION_OPEN' &&
    hasStarted &&
    !hasEnded;
  
  // Registration hasn't started if current time is before start date
  const hasNotStarted = !hasStarted;

  // Fetch user profile data for auto-filling registration form
  const userProfile = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      phoneNumber: true,
      firstName: true,
      lastName: true,
    },
  });

  return (
    <RegistrationClient
      competition={competition}
      registrationTypes={competition.registrationTypes}
      isOpen={isOpen}
      hasNotStarted={hasNotStarted}
      startDate={competition.startDate}
      userProfile={userProfile || undefined}
    />
  );
}
