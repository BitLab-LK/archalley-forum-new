/**
 * Submissions Page
 * Shows user's competition registrations and allows creating submissions
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubmissionsClient } from './submissions-client';

export const metadata = {
  title: 'My Submissions - Archalley',
  description: 'View your competition registrations and create submissions',
};

export default async function SubmissionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/submissions');
  }

  return <SubmissionsClient />;
}
