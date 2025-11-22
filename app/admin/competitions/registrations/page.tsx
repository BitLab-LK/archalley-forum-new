/**
 * Admin Competition Registrations Dashboard
 * View and manage all competition registrations
 */

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminRegistrationsClient from './admin-registrations-client';

export const metadata: Metadata = {
  title: 'Competition Registrations - Admin Dashboard | Archalley Forum',
  description: 'Manage all competition registrations, payments, and submissions',
};

export default async function AdminCompetitionRegistrationsPage() {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin/competitions/registrations');
  }

  // Check if user is admin
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch all registrations with related data
  const registrations = await prisma.competitionRegistration.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      competition: {
        select: {
          id: true,
          slug: true,
          title: true,
          year: true,
          status: true,
          startDate: true,
          endDate: true,
          registrationDeadline: true,
        },
      },
      registrationType: {
        select: {
          id: true,
          name: true,
          fee: true,
        },
      },
      payment: {
        select: {
          id: true,
          orderId: true,
          status: true,
          amount: true,
          paymentMethod: true,
          completedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch competitions for filtering
  const competitions = await prisma.competition.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      year: true,
    },
    orderBy: {
      year: 'desc',
    },
  });

  // Calculate statistics
  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'CONFIRMED').length,
    pending: registrations.filter(r => r.status === 'PENDING').length,
    submitted: registrations.filter(r => r.submissionStatus === 'SUBMITTED').length,
    totalRevenue: registrations
      .filter(r => r.status === 'CONFIRMED')
      .reduce((sum, r) => sum + r.amountPaid, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminRegistrationsClient 
        registrations={JSON.parse(JSON.stringify(registrations))}
        competitions={competitions}
        stats={stats}
      />
    </div>
  );
}
