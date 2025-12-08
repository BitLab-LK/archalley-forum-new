/**
 * Public Entries Gallery Page
 * Displays all published competition submissions
 */

import { getPublishedSubmissions } from '@/app/actions/voting-actions';
import { EntryCard } from '@/components/voting/entry-card';
import { Filter } from 'lucide-react';
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
  const sortBy = sort === 'newest' ? 'newest' : 'votes';

  const result = await getPublishedSubmissions(selectedCategory, sortBy, competition.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {competition.title.toUpperCase()}
          </h1>
          <p className="text-lg text-gray-600">
            Browse and vote for your favorite entries
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <div className="flex gap-2">
                <Link
                  href={`/competitions/${competitionSlug}/entries`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/entries?category=DIGITAL`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'DIGITAL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Digital
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/entries?category=PHYSICAL`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === 'PHYSICAL'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Physical
                </Link>
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <div className="flex gap-2">
                <Link
                  href={`/competitions/${competitionSlug}/entries${category ? `?category=${category}` : ''}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'votes'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Most Votes
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/entries?sort=newest${category ? `&category=${category}` : ''}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'newest'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Newest First
                </Link>
              </div>
            </div>
          </div>

          {/* Leaderboard Link */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link
              href={`/competitions/${competitionSlug}/leaderboard`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>View Leaderboard</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{result.submissions?.length || 0}</span> {selectedCategory ? selectedCategory.toLowerCase() : ''} entries
          </p>
        </div>

        {/* Entries Grid */}
        <Suspense fallback={<LoadingGrid />}>
          {result.success && result.submissions && result.submissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {result.submissions.map((submission) => (
                <EntryCard
                  key={submission.registrationNumber}
                  registrationNumber={submission.registrationNumber}
                  title={submission.title}
                  category={submission.submissionCategory}
                  imageUrl={submission.keyPhotographUrl}
                  voteCount={submission.voteCount}
                  hasVoted={submission.hasVoted}
                  isAuthenticated={result.isAuthenticated || false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No entries found. Check back soon!
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
