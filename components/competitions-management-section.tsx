'use client';

/**
 * Competitions Management Section
 * Wrapper component for admin dashboard that fetches and displays competition registrations
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminRegistrationsClient from '@/app/admin/competitions/registrations/admin-registrations-client';

interface Registration {
  id: string;
  registrationNumber: string;
  status: string;
  submissionStatus: string;
  country: string;
  teamMembers: any;
  amountPaid: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  competition: {
    id: string;
    slug: string;
    title: string;
    year: number;
    status: string;
    startDate: string;
    endDate: string;
    registrationDeadline: string;
  };
  registrationType: {
    id: string;
    name: string;
    fee: number;
  };
  payment: {
    id: string;
    orderId: string;
    status: string;
    amount: number;
    paymentMethod: string;
    completedAt: string | null;
  } | null;
}

interface Competition {
  id: string;
  slug: string;
  title: string;
  year: number;
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  submitted: number;
  totalRevenue: number;
}

export default function CompetitionsManagementSection() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    submitted: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/competitions/registrations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch competition data');
      }

      const data = await response.json();
      
      setRegistrations(data.registrations || []);
      setCompetitions(data.competitions || []);
      setStats(data.stats || {
        total: 0,
        confirmed: 0,
        pending: 0,
        submitted: 0,
        totalRevenue: 0,
      });
    } catch (err) {
      console.error('Error fetching competition data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load competition data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#FACC15]" />
          <p className="text-gray-600 dark:text-gray-400">Loading competition registrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-red-600 dark:text-red-300">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6">
      <AdminRegistrationsClient
        registrations={registrations}
        competitions={competitions}
        stats={stats}
      />
    </div>
  );
}
