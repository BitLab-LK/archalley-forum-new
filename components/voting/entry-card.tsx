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
    <div className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Vote Button - Top Right Corner */}
      <div className="absolute top-3 right-3 z-10">
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
      <div className="absolute top-3 left-3 z-10">
        <span className={`
          px-3 py-1 text-xs font-semibold rounded-full shadow-sm
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
        <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={`Entry ${registrationNumber}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </Link>

      {/* Entry Info */}
      <div className="p-4">
        <Link 
          href={`/submissions/${registrationNumber}/view`}
          className="block hover:text-blue-600 transition-colors"
        >
          <h3 className="text-lg font-bold text-gray-900 text-center">
            Entry #{registrationNumber}
          </h3>
        </Link>
      </div>
    </div>
  );
}
