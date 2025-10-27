/**
 * Registration Client Component
 * Client-side registration form with cart functionality
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Competition, CompetitionRegistrationType } from '@prisma/client';
import RegistrationForm from './components/RegistrationForm';
import RegistrationCartSidebar from './components/RegistrationCartSidebar';
import { formatDate, getDaysRemaining } from '@/lib/competition-utils';

interface Props {
  competition: Competition & {
    registrationTypes: CompetitionRegistrationType[];
  };
  registrationTypes: CompetitionRegistrationType[];
  isOpen: boolean;
  user: any;
}

export default function RegistrationClient({
  competition,
  registrationTypes,
  isOpen,
  user,
}: Props) {
  const router = useRouter();
  const [cartKey, setCartKey] = useState(0);

  const handleCartUpdate = () => {
    setCartKey((prev) => prev + 1);
  };

  const daysRemaining = getDaysRemaining(new Date(competition.registrationDeadline));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push(`/events/${competition.slug}`)}
            className="text-white mb-4 flex items-center gap-2 hover:underline"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Competition
          </button>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {competition.title}
          </h1>
          <p className="text-white text-lg">
            Archalley Competitions {competition.year}
          </p>
          
          {isOpen && (
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
              <p className="text-white font-semibold">
                Registration Deadline: {formatDate(competition.registrationDeadline)}
              </p>
              <p className="text-white text-sm">
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : 'Deadline passed'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!isOpen ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-800 mb-2">
              Registration Closed
            </h2>
            <p className="text-red-600">
              Registration for this competition has ended or is not yet open.
            </p>
            <button
              onClick={() => router.push('/events')}
              className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
            >
              View Other Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Registration Form */}
            <div className="lg:col-span-2">
              <RegistrationForm
                competition={competition}
                registrationTypes={registrationTypes}
                onCartUpdate={handleCartUpdate}
                user={user}
              />
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <RegistrationCartSidebar
                  refreshKey={cartKey}
                  onCartUpdate={handleCartUpdate}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
