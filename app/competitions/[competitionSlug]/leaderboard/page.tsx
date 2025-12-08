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

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-lg text-gray-600">
            {competition.title} - Ranked by votes
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Updates every 30 seconds
          </p>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <div className="flex gap-2">
              <Link
                href={`/competitions/${competitionSlug}/leaderboard`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Entries
              </Link>
              <Link
                href={`/competitions/${competitionSlug}/leaderboard?category=DIGITAL`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'DIGITAL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Digital Only
              </Link>
              <Link
                href={`/competitions/${competitionSlug}/leaderboard?category=PHYSICAL`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'PHYSICAL'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Physical Only
              </Link>
            </div>

            <div className="ml-auto">
              <Link
                href={`/competitions/${competitionSlug}/entries`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                ← Back to Gallery
              </Link>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        {result.success && result.leaderboard && result.leaderboard.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Votes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.leaderboard.map((entry) => (
                    <tr
                      key={entry.registrationNumber}
                      className={`hover:bg-gray-50 transition-colors ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50/30 to-transparent' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          <span className={`
                            inline-flex items-center justify-center w-10 h-10 rounded-full font-bold
                            ${getRankBadge(entry.rank)}
                          `}>
                            {entry.rank}
                          </span>
                        </div>
                      </td>

                      {/* Thumbnail */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/submissions/${entry.registrationNumber}/view`}>
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                          className="text-blue-600 hover:text-blue-800 font-mono font-semibold hover:underline"
                        >
                          {entry.registrationNumber}
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          inline-flex px-3 py-1 text-xs font-semibold rounded-full
                          ${entry.submissionCategory === 'DIGITAL'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                          }
                        `}>
                          {entry.submissionCategory === 'DIGITAL' ? 'Digital' : 'Physical'}
                        </span>
                      </td>

                      {/* Vote Count */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`
                          inline-flex items-center justify-center px-4 py-2 rounded-full font-bold text-lg
                          ${entry.rank <= 3
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                          }
                        `}>
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
              <p className="text-sm text-gray-600 text-center">
                Total Entries: <span className="font-semibold">{result.leaderboard.length}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              No entries found. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
