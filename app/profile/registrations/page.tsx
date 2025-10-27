/**
 * User Registrations Page
 * Display all competition registrations for the logged-in user
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import RegistrationsClient from './registrations-client';

export const metadata: Metadata = {
  title: 'My Registrations - Archalley Forum',
  description: 'View and manage your competition registrations',
};

export default async function RegistrationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/profile/registrations');
  }

  return <RegistrationsClient user={session.user} />;
}
