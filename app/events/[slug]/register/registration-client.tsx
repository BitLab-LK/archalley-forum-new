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
import RegistrationCountdown from './components/RegistrationCountdown';
import { formatDate, getDaysRemaining } from '@/lib/competition-utils';

interface Props {
  competition: Competition & {
    registrationTypes: CompetitionRegistrationType[];
  };
  registrationTypes: CompetitionRegistrationType[];
  isOpen: boolean;
  hasNotStarted?: boolean;
  startDate?: Date | string;
}

export default function RegistrationClient({
  competition,
  registrationTypes,
  isOpen,
  hasNotStarted = false,
  startDate,
}: Props) {
  const router = useRouter();
  const [cartKey, setCartKey] = useState(0);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const handleCartUpdate = () => {
    setCartKey((prev) => prev + 1);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
  };

  const handleEditComplete = () => {
    setEditingItem(null);
  };

  const daysRemaining = getDaysRemaining(new Date(competition.registrationDeadline));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black border-b border-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push(`/events/${competition.slug}`)}
            className="text-white/80 mb-6 flex items-center gap-2 hover:text-orange-500 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Competition
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
            {competition.title}
          </h1>
          <p className="text-orange-500 text-sm font-medium">
            Archalley Competitions {competition.year}
          </p>
          
          {isOpen && (
            <div className="mt-6 flex items-center gap-4 text-sm">
              <div className="text-white/60">
                <span className="text-white/80 font-medium">Deadline: </span>
                {formatDate(competition.registrationDeadline)}
              </div>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="text-orange-500 font-medium">
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : 'Deadline passed'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {hasNotStarted && startDate ? (
          <RegistrationCountdown 
            targetDate={startDate}
            onExpired={() => {
              // Reload page when countdown expires to check registration status
              window.location.reload();
            }}
          />
        ) : !isOpen ? (
          <div className="bg-white border-2 border-orange-500 rounded-lg p-6 text-center shadow-lg">
            <h2 className="text-2xl font-bold text-black mb-2">
              Registration Closed
            </h2>
            <p className="text-gray-700">
              Registration for this competition has ended.
            </p>
            <button
              onClick={() => router.push('/events')}
              className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
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
                editingItem={editingItem}
                onEditComplete={handleEditComplete}
              />
            </div>

            {/* Cart Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <RegistrationCartSidebar
                  refreshKey={cartKey}
                  onCartUpdate={handleCartUpdate}
                  onEditItem={handleEditItem}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
