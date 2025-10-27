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
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const competition = await prisma.competition.findUnique({
    where: { slug: params.slug },
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
  const session = await getServerSession(authOptions);

  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/events/${params.slug}/register`);
  }

  // Fetch competition data
  const competition = await prisma.competition.findUnique({
    where: { slug: params.slug },
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
  const now = new Date();
  const isOpen = 
    competition.status === 'REGISTRATION_OPEN' &&
    now <= new Date(competition.registrationDeadline);

  return (
    <RegistrationClient
      competition={competition}
      registrationTypes={competition.registrationTypes}
      isOpen={isOpen}
      user={session.user}
    />
  );
}
