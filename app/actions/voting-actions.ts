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
      await prisma.$transaction([
        prisma.submissionVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.competitionSubmission.update({
          where: { registrationNumber },
          data: {
            voteCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      hasVoted = false;

      // Get updated vote count
      const updated = await prisma.competitionSubmission.findUnique({
        where: { registrationNumber },
        select: { voteCount: true },
      });
      voteCount = updated?.voteCount || 0;
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.submissionVote.create({
          data: {
            registrationNumber,
            userId,
          },
        }),
        prisma.competitionSubmission.update({
          where: { registrationNumber },
          data: {
            voteCount: {
              increment: 1,
            },
          },
        }),
      ]);

      hasVoted = true;

      // Get updated vote count
      const updated = await prisma.competitionSubmission.findUnique({
        where: { registrationNumber },
        select: { voteCount: true },
      });
      voteCount = updated?.voteCount || 0;
    }

    // Revalidate pages
    revalidatePath(`/submissions/${registrationNumber}/view`);
    revalidatePath(`/competitions/tree-without-a-tree-2024/entries`);
    revalidatePath(`/competitions/tree-without-a-tree-2024/leaderboard`);

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

    // Get submission with vote count
    const submission = await prisma.competitionSubmission.findUnique({
      where: { registrationNumber },
      select: {
        voteCount: true,
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
      voteCount: submission.voteCount,
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
        voteCount: true,
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
      submission,
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

    const orderBy =
      sortBy === 'votes'
        ? { voteCount: 'desc' as const }
        : { publishedAt: 'desc' as const };

    const submissions = await prisma.competitionSubmission.findMany({
      where,
      orderBy,
      select: {
        id: true,
        registrationNumber: true,
        title: true,
        submissionCategory: true,
        keyPhotographUrl: true,
        voteCount: true,
        publishedAt: true,
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

    const submissionsWithVoteStatus = submissions.map((submission) => ({
      ...submission,
      hasVoted: userVotes.has(submission.registrationNumber),
    }));

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
      orderBy: [
        { voteCount: 'desc' },
        { publishedAt: 'asc' }, // Earlier submissions rank higher if tied
      ],
      select: {
        registrationNumber: true,
        title: true,
        submissionCategory: true,
        keyPhotographUrl: true,
        voteCount: true,
        publishedAt: true,
      },
    });

    // Add rank based on position
    const leaderboard = submissions.map((submission, index) => ({
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
