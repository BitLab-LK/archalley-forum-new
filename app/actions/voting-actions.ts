/**
 * Voting Server Actions
 * Handles all voting operations for competition submissions
 */

'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Toggle vote for a submission
 * If user has voted, remove the vote. If not, add a vote.
 */
export async function toggleVote(registrationNumber: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'You must be logged in to vote',
        requiresAuth: true,
      };
    }

    const userId = session.user.id;

    // Check if submission exists and is published
    const submission = await prisma.competitionSubmission.findUnique({
      where: { registrationNumber },
      select: {
        id: true,
        registrationNumber: true,
        isPublished: true,
        status: true,
      },
    });

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    if (!submission.isPublished || submission.status !== 'PUBLISHED') {
      return {
        success: false,
        error: 'This submission is not available for voting',
      };
    }

    // Check if user has already voted
    const existingVote = await prisma.submissionVote.findUnique({
      where: {
        registrationNumber_userId: {
          registrationNumber,
          userId,
        },
      },
    });

    let hasVoted: boolean;
    let voteCount: number;

    if (existingVote) {
      // Remove vote (unvote)
      await prisma.$transaction(async (tx) => {
        // Delete the vote
        await tx.submissionVote.delete({
          where: { id: existingVote.id },
        });

        // Update voting stats
        await tx.submissionVotingStats.upsert({
          where: { registrationNumber },
          create: {
            registrationNumber,
            publicVoteCount: 0,
            lastVotedAt: new Date(),
          },
          update: {
            publicVoteCount: {
              decrement: 1,
            },
            lastVotedAt: new Date(),
          },
        });
      });

      hasVoted = false;

      // Get updated vote count
      const stats = await prisma.submissionVotingStats.findUnique({
        where: { registrationNumber },
        select: { publicVoteCount: true },
      });
      voteCount = stats?.publicVoteCount || 0;
    } else {
      // Add vote
      await prisma.$transaction(async (tx) => {
        // Create the vote
        await tx.submissionVote.create({
          data: {
            registrationNumber,
            userId,
            voteType: 'PUBLIC',
          },
        });

        // Update voting stats
        await tx.submissionVotingStats.upsert({
          where: { registrationNumber },
          create: {
            registrationNumber,
            publicVoteCount: 1,
            firstVoteAt: new Date(),
            lastVotedAt: new Date(),
          },
          update: {
            publicVoteCount: {
              increment: 1,
            },
            lastVotedAt: new Date(),
          },
        });
      });

      hasVoted = true;

      // Get updated vote count
      const stats = await prisma.submissionVotingStats.findUnique({
        where: { registrationNumber },
        select: { publicVoteCount: true },
      });
      voteCount = stats?.publicVoteCount || 0;
    }

    // Revalidate pages
    revalidatePath(`/submissions/${registrationNumber}/view`);
    revalidatePath(`/competitions/archalley-competition-2025/entries`);
    revalidatePath(`/competitions/archalley-competition-2025/leaderboard`);

    return {
      success: true,
      hasVoted,
      voteCount,
    };
  } catch (error) {
    console.error('Error toggling vote:', error);
    return {
      success: false,
      error: 'Failed to toggle vote. Please try again.',
    };
  }
}

/**
 * Get vote status for a submission
 * Returns whether the current user has voted and the total vote count
 */
export async function getVoteStatus(registrationNumber: string) {
  try {
    const session = await getServerSession(authOptions);

    // Get submission status
    const submission = await prisma.competitionSubmission.findUnique({
      where: { registrationNumber },
      select: {
        isPublished: true,
        status: true,
      },
    });

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    // Get voting stats
    const stats = await prisma.submissionVotingStats.findUnique({
      where: { registrationNumber },
      select: { publicVoteCount: true },
    });

    let hasVoted = false;

    if (session?.user?.id) {
      const vote = await prisma.submissionVote.findUnique({
        where: {
          registrationNumber_userId: {
            registrationNumber,
            userId: session.user.id,
          },
        },
      });

      hasVoted = !!vote;
    }

    return {
      success: true,
      hasVoted,
      voteCount: stats?.publicVoteCount || 0,
      isPublished: submission.isPublished,
    };
  } catch (error) {
    console.error('Error getting vote status:', error);
    return {
      success: false,
      error: 'Failed to get vote status',
    };
  }
}

/**
 * Get submission with vote information
 * Used for displaying entry details with voting
 */
export async function getSubmissionWithVotes(registrationNumber: string) {
  try {
    const session = await getServerSession(authOptions);

    const submission = await prisma.competitionSubmission.findUnique({
      where: { registrationNumber },
      select: {
        id: true,
        registrationNumber: true,
        title: true,
        description: true,
        submissionCategory: true,
        keyPhotographUrl: true,
        additionalPhotographs: true,
        documentFileUrl: true,
        videoFileUrl: true,
        status: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    // Get voting stats
    const stats = await prisma.submissionVotingStats.findUnique({
      where: { registrationNumber },
      select: { publicVoteCount: true },
    });

    let hasVoted = false;

    if (session?.user?.id) {
      const vote = await prisma.submissionVote.findUnique({
        where: {
          registrationNumber_userId: {
            registrationNumber,
            userId: session.user.id,
          },
        },
      });

      hasVoted = !!vote;
    }

    return {
      success: true,
      submission: {
        ...submission,
        voteCount: stats?.publicVoteCount || 0,
      },
      hasVoted,
      isAuthenticated: !!session?.user?.id,
    };
  } catch (error) {
    console.error('Error getting submission:', error);
    return {
      success: false,
      error: 'Failed to get submission',
    };
  }
}

/**
 * Get all published submissions for gallery view
 */
export async function getPublishedSubmissions(
  category?: 'DIGITAL' | 'PHYSICAL',
  sortBy: 'votes' | 'newest' = 'votes',
  competitionId?: string
) {
  try {
    const session = await getServerSession(authOptions);

    const where = {
      isPublished: true,
      status: 'PUBLISHED' as const,
      ...(category && { submissionCategory: category }),
      ...(competitionId && { competitionId }),
    };

    const submissions = await prisma.competitionSubmission.findMany({
      where,
      select: {
        id: true,
        registrationNumber: true,
        title: true,
        submissionCategory: true,
        keyPhotographUrl: true,
        publishedAt: true,
        votingStats: {
          select: {
            publicVoteCount: true,
          },
        },
      },
    });

    // If user is logged in, get their votes
    let userVotes: Set<string> = new Set();
    if (session?.user?.id) {
      const votes = await prisma.submissionVote.findMany({
        where: {
          userId: session.user.id,
          registrationNumber: {
            in: submissions.map((s) => s.registrationNumber),
          },
        },
        select: {
          registrationNumber: true,
        },
      });

      userVotes = new Set(votes.map((v) => v.registrationNumber));
    }

    const submissionsWithVoteStatus = submissions
      .map((submission) => ({
        id: submission.id,
        registrationNumber: submission.registrationNumber,
        title: submission.title,
        submissionCategory: submission.submissionCategory,
        keyPhotographUrl: submission.keyPhotographUrl,
        publishedAt: submission.publishedAt,
        voteCount: submission.votingStats?.publicVoteCount || 0,
        hasVoted: userVotes.has(submission.registrationNumber),
      }))
      .sort((a, b) => {
        if (sortBy === 'votes') {
          return b.voteCount - a.voteCount;
        } else {
          return new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime();
        }
      });

    return {
      success: true,
      submissions: submissionsWithVoteStatus,
      isAuthenticated: !!session?.user?.id,
    };
  } catch (error) {
    console.error('Error getting submissions:', error);
    return {
      success: false,
      error: 'Failed to get submissions',
      submissions: [],
    };
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(category?: 'DIGITAL' | 'PHYSICAL', competitionId?: string) {
  try {
    const where = {
      isPublished: true,
      status: 'PUBLISHED' as const,
      ...(category && { submissionCategory: category }),
      ...(competitionId && { competitionId }),
    };

    const submissions = await prisma.competitionSubmission.findMany({
      where,
      select: {
        registrationNumber: true,
        title: true,
        submissionCategory: true,
        keyPhotographUrl: true,
        publishedAt: true,
        votingStats: {
          select: {
            publicVoteCount: true,
          },
        },
      },
    });

    // Sort by vote count and then by published date
    const sortedSubmissions = submissions
      .map((s) => ({
        registrationNumber: s.registrationNumber,
        title: s.title,
        submissionCategory: s.submissionCategory,
        keyPhotographUrl: s.keyPhotographUrl,
        publishedAt: s.publishedAt,
        voteCount: s.votingStats?.publicVoteCount || 0,
      }))
      .sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return b.voteCount - a.voteCount;
        }
        // Earlier submissions rank higher if tied
        return new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime();
      });

    // Add rank based on position
    const leaderboard = sortedSubmissions.map((submission, index) => ({
      ...submission,
      rank: index + 1,
    }));

    return {
      success: true,
      leaderboard,
    };
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return {
      success: false,
      error: 'Failed to get leaderboard',
      leaderboard: [],
    };
  }
}
