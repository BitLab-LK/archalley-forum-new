/**
 * Public Entries Gallery Page
 * Displays all published competition submissions
 */

import { getPublishedSubmissions } from '@/app/actions/voting-actions';
import { EntryCard } from '@/components/voting/entry-card';
import Link from 'next/link';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ competitionSlug: string }> }) {
  const { competitionSlug } = await params;
  
  const competition = await prisma.competition.findUnique({
    where: { slug: competitionSlug },
    select: { title: true },
  });

  return {
    title: `Competition Entries - ${competition?.title || 'Archalley Competition'}`,
    description: `Browse and vote for your favorite entries in the ${competition?.title || 'competition'}`,
  };
}

interface PageProps {
  params: Promise<{ competitionSlug: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
}

export default async function EntriesPage({ params, searchParams }: PageProps) {
  const { competitionSlug } = await params;
  const { category, sort } = await searchParams;

  // Fetch competition details
  const competition = await prisma.competition.findUnique({
    where: { slug: competitionSlug },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  if (!competition) {
    notFound();
  }

  const selectedCategory = category === 'DIGITAL' || category === 'PHYSICAL' ? category : undefined;
  // Default to 'random' on initial page load (when no sort param is provided)
  const sortBy = sort === 'newest' ? 'newest' : sort === 'votes' ? 'votes' : 'random';

  const result = await getPublishedSubmissions(selectedCategory, sortBy, competition.id);

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            CHRISTMAS IN FUTURE 2025
          </h1>
          <div className="w-64 h-0.5 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-base text-gray-600 font-light">
            Browse and vote for your favorite entries
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="mb-10 pb-8 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Filter:</span>
              <div className="flex gap-2">
                <Link
                  href={`/competitions/${competitionSlug}/entries`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    !selectedCategory
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/entries?category=DIGITAL`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    selectedCategory === 'DIGITAL'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Digital
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/entries?category=PHYSICAL`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    selectedCategory === 'PHYSICAL'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Physical
                </Link>
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Sort:</span>
              <div className="flex gap-2">
                <Link
                  href={`/competitions/${competitionSlug}/entries${category ? `?category=${category}` : ''}`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    sortBy === 'random'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Random
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/entries?sort=votes${category ? `&category=${category}` : ''}`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    sortBy === 'votes'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Most Votes
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/entries?sort=newest${category ? `&category=${category}` : ''}`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    sortBy === 'newest'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Newest
                </Link>
              </div>
            </div>
          </div>

          {/* Leaderboard Link */}
          <div className="mt-6">
            <Link
              href={`/competitions/${competitionSlug}/leaderboard`}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <span>View Leaderboard</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 font-light">
            {result.submissions?.length || 0} {selectedCategory ? selectedCategory.toLowerCase() : ''} {result.submissions?.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* Entries Masonry Gallery */}
        <Suspense fallback={<LoadingGrid />}>
          {result.success && result.submissions && result.submissions.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 mb-16 [column-gap:2rem]">
              {result.submissions.map((submission) => (
                <div key={submission.registrationNumber} className="break-inside-avoid mb-8">
                  <EntryCard
                    registrationNumber={submission.registrationNumber}
                    category={submission.submissionCategory}
                    imageUrl={submission.keyPhotographUrl}
                    voteCount={submission.voteCount}
                    hasVoted={submission.hasVoted}
                    isAuthenticated={result.isAuthenticated || false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-gray-400 text-base font-light">
                No entries found
              </p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="break-inside-avoid mb-8 bg-gray-50 overflow-hidden animate-pulse">
          <div className="h-64 bg-gray-200" />
          <div className="p-4">
            <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
