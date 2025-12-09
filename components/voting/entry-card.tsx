/**
 * Entry Card Component
 * Displays submission in gallery grid with vote button
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { VoteButton } from './vote-button';

interface EntryCardProps {
  registrationNumber: string;
  category: 'DIGITAL' | 'PHYSICAL';
  imageUrl: string;
  voteCount: number;
  hasVoted: boolean;
  isAuthenticated: boolean;
}

export function EntryCard({
  registrationNumber,
  category,
  imageUrl,
  voteCount,
  hasVoted,
  isAuthenticated,
}: EntryCardProps) {
  return (
    <div className="group relative bg-white border border-gray-200 overflow-hidden transition-all duration-300">
      {/* Vote Button - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10">
        <VoteButton
          registrationNumber={registrationNumber}
          initialVoteCount={voteCount}
          initialHasVoted={hasVoted}
          isAuthenticated={isAuthenticated}
          size="md"
          showCount={true}
          variant="compact"
        />
      </div>

      {/* Category Badge - Top Left Corner */}
      <div className="absolute top-4 left-4 z-10">
        <span className={`
          px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded
          ${category === 'DIGITAL' 
            ? 'bg-blue-500 text-white' 
            : 'bg-green-500 text-white'
          }
        `}>
          {category === 'DIGITAL' ? 'Digital' : 'Physical'}
        </span>
      </div>

      {/* Image - Clickable */}
      <Link href={`/submissions/${registrationNumber}/view`} className="block">
        <div className="relative w-full overflow-hidden bg-gray-50" style={{ aspectRatio: '4/5' }}>
          <Image
            src={imageUrl}
            alt={`Entry ${registrationNumber}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </Link>

      {/* Entry Info */}
      <div className="p-6 bg-white border-t border-gray-200">
        <Link 
          href={`/submissions/${registrationNumber}/view`}
          className="block hover:text-gray-600 transition-colors"
        >
          <h3 className="text-base font-semibold text-gray-900 tracking-wide">
            ENTRY #{registrationNumber}
          </h3>
        </Link>
      </div>
    </div>
  );
}
