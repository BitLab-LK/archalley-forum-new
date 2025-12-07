/**
 * Submissions Client Component
 * Displays user's registrations and submission forms
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
interface Registration {
  id: string;
  registrationNumber: string;
  competitionId: string;
  status: string;
  createdAt: string;
  competition: {
    id: string;
    title: string;
  };
  registrationType?: {
    id: string;
    name: string;
    type: string;
  } | null;
  submission?: {
    id: string;
    status: string;
    title: string;
    submissionCategory: string;
  } | null;
}

export function SubmissionsClient() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibilityMessage, setEligibilityMessage] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch('/api/competitions/my-registrations');
      if (response.ok) {
        const result = await response.json();
        // Filter confirmed registrations only
        const confirmed = result.data.filter(
          (r: Registration) => r.status === 'CONFIRMED'
        );
        setRegistrations(confirmed);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
          <p className="mt-2 text-gray-600">
            View your competition registrations and create submissions
          </p>
        </div>

        {/* Eligibility Message */}
        {eligibilityMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{eligibilityMessage}</p>
          </div>
        )}

        {/* No Registrations */}
        {registrations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No confirmed registrations
            </h3>
            <p className="mt-2 text-gray-600">
              Register for a competition first to create submissions
            </p>
            <button
              onClick={() => router.push('/competitions')}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Competitions
            </button>
          </div>
        )}

        {/* Registrations List */}
        {registrations.length > 0 && (
          <div className="space-y-6">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {registration.competition.title}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {registration.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Registration Number:</span>{' '}
                        {registration.registrationNumber}
                      </p>
                      <p>
                        <span className="font-medium">Registered:</span>{' '}
                        {new Date(registration.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Submission Status */}
                    {registration.submission ? (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">
                              Submission: {registration.registrationNumber}
                            </p>
                            <p className="text-sm text-blue-700">
                              {registration.submission.submissionCategory}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              registration.submission.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                              registration.submission.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                              registration.submission.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                              registration.submission.status === 'PUBLISHED' ? 'bg-purple-100 text-purple-800' :
                              registration.submission.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              registration.submission.status === 'WITHDRAWN' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {registration.submission.status}
                            </span>
                             {registration.submission.status === 'DRAFT' ? (
                               <button
                                 onClick={() => router.push(`/submissions/${registration.registrationNumber}`)}
                                 className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
                               >
                                 Edit Draft
                               </button>
                             ) : (
                               <button
                                 onClick={() => router.push(`/submissions/${registration.registrationNumber}/view`)}
                                 className="px-3 py-1 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700"
                               >
                                 View Submission
                               </button>
                             )}
                          </div>
                        </div>
                      </div>
                     ) : (
                       <div className="mt-4">
                         <button
                           onClick={() => router.push(`/submissions/${registration.registrationNumber}`)}
                           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                         >
                           Add Submission
                         </button>
                       </div>
                     )}
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
