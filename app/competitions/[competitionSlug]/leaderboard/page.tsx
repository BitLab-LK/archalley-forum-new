/**
 * Leaderboard Page
 * Real-time ranking of competition entries by vote count
 */

import { getLeaderboard } from '@/app/actions/voting-actions';
import Image from 'next/image';
import Link from 'next/link';
import { Trophy, Medal, Award } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ competitionSlug: string }> }) {
  const { competitionSlug } = await params;
  
  const competition = await prisma.competition.findUnique({
    where: { slug: competitionSlug },
    select: { title: true },
  });

  return {
    title: `Leaderboard - ${competition?.title || 'Archalley Competition'}`,
    description: `Competition leaderboard ranked by votes for ${competition?.title || 'competition'}`,
  };
}

// Revalidate every 30 seconds for near-real-time updates
export const revalidate = 30;

interface PageProps {
  params: Promise<{ competitionSlug: string }>;
  searchParams: Promise<{ category?: string }>;
}

export default async function LeaderboardPage({ params, searchParams }: PageProps) {
  const { competitionSlug } = await params;
  const { category } = await searchParams;

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

  const result = await getLeaderboard(selectedCategory, competition.id);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            LEADERBOARD
          </h1>
          <div className="w-64 h-0.5 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-base text-gray-600 font-light">
            Archalley Competition 2025 - CHRISTMAS IN FUTURE - Ranked by votes
          </p>
          <p className="text-sm text-gray-500 mt-2 font-light">
            Updates every 30 seconds
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-10 pb-8 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Filter:</span>
              <div className="flex gap-2">
                <Link
                  href={`/competitions/${competitionSlug}/leaderboard`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    !selectedCategory
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/leaderboard?category=DIGITAL`}
                  className={`px-4 py-1.5 text-sm font-medium transition-all ${
                    selectedCategory === 'DIGITAL'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Digital
                </Link>
                <Link
                  href={`/competitions/${competitionSlug}/leaderboard?category=PHYSICAL`}
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

            <div>
              <Link
                href={`/competitions/${competitionSlug}/entries`}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                ← Back to Gallery
              </Link>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        {result.success && result.leaderboard && result.leaderboard.length > 0 ? (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Entry
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Registration #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Votes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {result.leaderboard.map((entry) => (
                    <tr
                      key={entry.registrationNumber}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {getRankIcon(entry.rank)}
                          <span className="text-base font-semibold text-gray-900">
                            #{entry.rank}
                          </span>
                        </div>
                      </td>

                      {/* Thumbnail */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/submissions/${entry.registrationNumber}/view`}>
                          <div className="relative w-16 h-16 border border-gray-200 overflow-hidden hover:border-gray-400 transition-all">
                            <Image
                              src={entry.keyPhotographUrl}
                              alt={`Entry ${entry.registrationNumber}`}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        </Link>
                      </td>

                      {/* Registration Number */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/submissions/${entry.registrationNumber}/view`}
                          className="text-gray-900 hover:text-gray-600 font-mono font-medium hover:underline transition-colors"
                        >
                          {entry.registrationNumber}
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          inline-flex px-3 py-1 text-xs font-semibold rounded
                          ${entry.submissionCategory === 'DIGITAL'
                            ? 'bg-blue-500 text-white'
                            : 'bg-green-500 text-white'
                          }
                        `}>
                          {entry.submissionCategory === 'DIGITAL' ? 'Digital' : 'Physical'}
                        </span>
                      </td>

                      {/* Vote Count */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-gray-900">
                          {entry.voteCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center font-light">
                Total Entries: <span className="font-semibold text-gray-900">{result.leaderboard.length}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-400 text-base font-light">
              No entries found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
