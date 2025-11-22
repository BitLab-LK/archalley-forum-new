/**
 * Registrations Client Component
 * Display and manage user's competition registrations
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { RegistrationWithDetails } from '@/types/competition';
import { toast } from 'sonner';
import Link from 'next/link';

interface Props {
  user: any;
}

type RegistrationStatus = 'all' | 'PENDING' | 'CONFIRMED' | 'SUBMITTED';

export default function RegistrationsClient({ user: _user }: Props) {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<RegistrationStatus>('all');

  // Ensure registrations is always an array
  const safeRegistrations = useMemo(() => {
    return Array.isArray(registrations) ? registrations : [];
  }, [registrations]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/competitions/my-registrations');
      const data = await response.json();

      if (data.success) {
        setRegistrations(data.data || []);
      } else {
        toast.error('Failed to load registrations');
        setRegistrations([]);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('An error occurred while loading registrations');
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRegistrations = useMemo(() => {
    return safeRegistrations.filter((reg) => {
      if (filter === 'all') return true;
      return reg.status === filter;
    });
  }, [safeRegistrations, filter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Registrations</h1>
          <p className="text-gray-600">
            Manage your competition registrations and submissions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({safeRegistrations.length})
            </button>
            <button
              onClick={() => setFilter('CONFIRMED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'CONFIRMED'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed ({safeRegistrations.filter((r) => r.status === 'CONFIRMED').length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'PENDING'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({safeRegistrations.filter((r) => r.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('SUBMITTED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'SUBMITTED'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Submitted ({safeRegistrations.filter((r) => r.status === 'SUBMITTED').length})
            </button>
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'No registrations yet' : `No ${filter.toLowerCase()} registrations`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't registered for any competitions yet."
                : `You don't have any ${filter.toLowerCase()} registrations.`}
            </p>
            <Link
              href="/events"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-lg transform transition-all duration-300 hover:scale-105"
            >
              Browse Competitions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {registration.competition.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                            registration.status
                          )}`}
                        >
                          {registration.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          {registration.registrationType.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right mt-4 md:mt-0">
                      <div className="text-sm text-gray-600 mb-1">Registration Number</div>
                      <div className="font-mono font-bold text-gray-900">
                        {registration.registrationNumber}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Country</p>
                      <p className="font-medium text-gray-900">{registration.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Registration Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(registration.registeredAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                      <p className="font-bold text-yellow-600">
                        LKR {registration.amountPaid.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Members */}
                  {registration.members && Array.isArray(registration.members) && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Team Members ({(registration.members as any[]).length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(registration.members as any[]).map((member: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded-lg p-3 text-sm"
                          >
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.email}</p>
                            {member.role && (
                              <p className="text-xs text-gray-500 mt-1">
                                Role: {member.role}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Info */}
                  {registration.payment && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-1">
                            Payment Information
                          </p>
                          <p className="text-xs text-gray-600">
                            Order ID: {registration.payment.orderId}
                          </p>
                          {registration.payment.paymentId && (
                            <p className="text-xs text-gray-600">
                              Payment ID: {registration.payment.paymentId}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(
                            registration.payment.status
                          )}`}
                        >
                          {registration.payment.status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submission Info */}
                  {registration.submissionUrl && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        📎 Submission Uploaded
                      </p>
                      <a
                        href={registration.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm underline"
                      >
                        View Submission
                      </a>
                      {registration.submittedAt && (
                        <p className="text-xs text-blue-700 mt-1">
                          Submitted on{' '}
                          {new Date(registration.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/events/${registration.competition.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Competition
                    </Link>

                    {registration.status === 'CONFIRMED' && !registration.submissionUrl && (
                      <button
                        className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors"
                        onClick={() => toast.info('Submission feature coming soon!')}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Upload Submission
                      </button>
                    )}

                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-lg transition-colors"
                      onClick={() => toast.info('Receipt download coming soon!')}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download Receipt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
