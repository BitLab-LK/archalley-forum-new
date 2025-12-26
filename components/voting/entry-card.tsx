/**
 * Entry Card Component
 * Displays submission in gallery grid with vote button
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { VoteButton } from './vote-button';
import { useState, useEffect } from 'react';

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
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalHeight / img.naturalWidth);
      } else {
        // Fallback to 4:5 if we can't determine aspect ratio
        setAspectRatio(1.25);
      }
    };
    img.onerror = () => {
      // Fallback to 4:5 on error
      setAspectRatio(1.25);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  return (
    <div className="group relative bg-white border-2 border-gray-300 shadow-sm overflow-hidden transition-all duration-300 hover:border-gray-400 hover:shadow-md">
      {/* Vote Button - Top Right Corner */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-md flex items-center justify-center">
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
        <div className="relative w-full overflow-hidden bg-gray-50">
          {aspectRatio ? (
            <div 
              className="relative w-full" 
              style={{ 
                paddingBottom: `${aspectRatio * 100}%`
              }}
            >
              <Image
                src={imageUrl}
                alt={`Entry ${registrationNumber}`}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="relative w-full" style={{ minHeight: '300px' }}>
              <Image
                src={imageUrl}
                alt={`Entry ${registrationNumber}`}
                fill
                className="object-contain transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setAspectRatio(img.naturalHeight / img.naturalWidth);
                  }
                }}
              />
            </div>
          )}
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
