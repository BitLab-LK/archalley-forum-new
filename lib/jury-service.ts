import { prisma } from './prisma';

// ============================================
// JURY ACCESS CONTROL
// ============================================

/**
 * Check if a user is an active jury member
 */
export async function isJuryMember(userId: string): Promise<boolean> {
  const juryMember = await prisma.juryMember.findUnique({
    where: {
      userId,
      isActive: true,
    },
  });
  return !!juryMember;
}

/**
 * Get jury member details by userId
 */
export async function getJuryMember(userId: string) {
  return await prisma.juryMember.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}

// ============================================
// JURY MANAGEMENT (ADMIN)
// ============================================

/**
 * Add a user as jury member
 */
export async function addJuryMember(data: {
  userId: string;
  title: string;
  assignedBy: string;
  competitionId?: string;
}) {
  // Check if user already exists as jury
  const existing = await prisma.juryMember.findUnique({
    where: { userId: data.userId },
  });

  if (existing) {
    throw new Error('User is already a jury member');
  }

  return await prisma.juryMember.create({
    data: {
      userId: data.userId,
      title: data.title,
      assignedBy: data.assignedBy,
      competitionId: data.competitionId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}

/**
 * Update jury member details
 */
export async function updateJuryMember(
  juryMemberId: string,
  data: {
    title?: string;
    isActive?: boolean;
    competitionId?: string | null;
  }
) {
  return await prisma.juryMember.update({
    where: { id: juryMemberId },
    data,
  });
}

/**
 * Remove jury member (soft delete by setting isActive = false)
 */
export async function removeJuryMember(juryMemberId: string) {
  return await prisma.juryMember.update({
    where: { id: juryMemberId },
    data: { isActive: false },
  });
}

/**
 * Permanently delete jury member
 */
export async function deleteJuryMember(juryMemberId: string) {
  return await prisma.juryMember.delete({
    where: { id: juryMemberId },
  });
}

/**
 * Get all jury members with their progress
 */
export async function getAllJuryMembers(competitionId?: string) {
  const juryMembers = await prisma.juryMember.findMany({
    where: competitionId ? { competitionId } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      progress: true,
      _count: {
        select: {
          scores: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return juryMembers;
}

// ============================================
// JURY SCORING
// ============================================

/**
 * Calculate total score from marking scheme
 */
export function calculateTotalScore(scores: {
  conceptScore: number;
  relevanceScore: number;
  compositionScore: number;
  balanceScore: number;
  colourScore: number;
  designRelativityScore: number;
  aestheticAppealScore: number;
  unconventionalMaterialsScore: number;
  overallMaterialScore: number;
}): number {
  return (
    scores.conceptScore +
    scores.relevanceScore +
    scores.compositionScore +
    scores.balanceScore +
    scores.colourScore +
    scores.designRelativityScore +
    scores.aestheticAppealScore +
    scores.unconventionalMaterialsScore +
    scores.overallMaterialScore
  );
}

/**
 * Submit jury score for a submission
 */
export async function submitJuryScore(
  juryMemberId: string,
  registrationNumber: string,
  scores: {
    conceptScore: number;
    relevanceScore: number;
    compositionScore: number;
    balanceScore: number;
    colourScore: number;
    designRelativityScore: number;
    aestheticAppealScore: number;
    unconventionalMaterialsScore: number;
    overallMaterialScore: number;
    comments?: string;
  }
) {
  // Validate scores
  if (scores.conceptScore < 0 || scores.conceptScore > 10) {
    throw new Error('Concept score must be between 0-10');
  }
  if (scores.relevanceScore < 0 || scores.relevanceScore > 15) {
    throw new Error('Relevance score must be between 0-15');
  }
  if (scores.compositionScore < 0 || scores.compositionScore > 10) {
    throw new Error('Composition score must be between 0-10');
  }
  if (scores.balanceScore < 0 || scores.balanceScore > 10) {
    throw new Error('Balance score must be between 0-10');
  }
  if (scores.colourScore < 0 || scores.colourScore > 10) {
    throw new Error('Colour score must be between 0-10');
  }
  if (scores.designRelativityScore < 0 || scores.designRelativityScore > 10) {
    throw new Error('Design Relativity score must be between 0-10');
  }
  if (scores.aestheticAppealScore < 0 || scores.aestheticAppealScore > 20) {
    throw new Error('Aesthetic Appeal score must be between 0-20');
  }
  if (scores.unconventionalMaterialsScore < 0 || scores.unconventionalMaterialsScore > 10) {
    throw new Error('Unconventional Materials score must be between 0-10');
  }
  if (scores.overallMaterialScore < 0 || scores.overallMaterialScore > 5) {
    throw new Error('Overall Material score must be between 0-5');
  }

  const totalScore = calculateTotalScore(scores);

  // Create or update jury score
  const juryScore = await prisma.juryScore.upsert({
    where: {
      juryMemberId_registrationNumber: {
        juryMemberId,
        registrationNumber,
      },
    },
    create: {
      juryMemberId,
      registrationNumber,
      ...scores,
      totalScore,
    },
    update: {
      ...scores,
      totalScore,
      submittedAt: new Date(),
    },
  });

  // Update jury scoring progress
  await updateJuryProgress(juryMemberId);

  // Update submission voting stats
  await updateSubmissionJuryStats(registrationNumber);

  return juryScore;
}

/**
 * Get submissions for jury member to score
 */
export async function getSubmissionsForJury(
  juryMemberId: string,
  filters?: {
    status?: 'scored' | 'not-scored';
    category?: string;
  }
) {
  const juryMember = await prisma.juryMember.findUnique({
    where: { id: juryMemberId },
  });

  if (!juryMember) {
    throw new Error('Jury member not found');
  }

  // Get all published submissions
  const submissions = await prisma.competitionSubmission.findMany({
    where: {
      isPublished: true,
      status: 'PUBLISHED',
      competitionId: juryMember.competitionId || undefined,
    },
    include: {
      juryScores: {
        where: { juryMemberId },
      },
      votingStats: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter based on scoring status
  if (filters?.status === 'scored') {
    return submissions.filter((s) => s.juryScores.length > 0);
  } else if (filters?.status === 'not-scored') {
    return submissions.filter((s) => s.juryScores.length === 0);
  }

  return submissions;
}

/**
 * Get jury member's score for a specific submission
 */
export async function getJuryScore(juryMemberId: string, registrationNumber: string) {
  return await prisma.juryScore.findUnique({
    where: {
      juryMemberId_registrationNumber: {
        juryMemberId,
        registrationNumber,
      },
    },
  });
}

/**
 * Update jury member's progress statistics
 */
async function updateJuryProgress(juryMemberId: string) {
  const juryMember = await prisma.juryMember.findUnique({
    where: { id: juryMemberId },
  });

  if (!juryMember) return;

  // Count total published submissions
  const totalSubmissions = await prisma.competitionSubmission.count({
    where: {
      isPublished: true,
      status: 'PUBLISHED',
      competitionId: juryMember.competitionId || undefined,
    },
  });

  // Count jury's submitted scores
  const submittedScores = await prisma.juryScore.count({
    where: { juryMemberId },
  });

  // Calculate average score given
  const scores = await prisma.juryScore.findMany({
    where: { juryMemberId },
    select: { totalScore: true },
  });

  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length
      : null;

  const completionPercentage =
    totalSubmissions > 0 ? (submittedScores / totalSubmissions) * 100 : 0;

  // Get last scored time
  const lastScore = await prisma.juryScore.findFirst({
    where: { juryMemberId },
    orderBy: { submittedAt: 'desc' },
    select: { submittedAt: true },
  });

  // Upsert progress record
  await prisma.juryScoringProgress.upsert({
    where: { juryMemberId },
    create: {
      juryMemberId,
      totalAssignedEntries: totalSubmissions,
      submittedScores,
      completionPercentage,
      averageScoreGiven: averageScore,
      lastScoredAt: lastScore?.submittedAt || null,
    },
    update: {
      totalAssignedEntries: totalSubmissions,
      submittedScores,
      completionPercentage,
      averageScoreGiven: averageScore,
      lastScoredAt: lastScore?.submittedAt || null,
    },
  });
}

/**
 * Update submission's jury voting statistics
 */
async function updateSubmissionJuryStats(registrationNumber: string) {
  const juryScores = await prisma.juryScore.findMany({
    where: { registrationNumber },
    select: { totalScore: true },
  });

  const juryVoteCount = juryScores.length;
  const juryScoreTotal = juryScores.reduce((sum, s) => sum + s.totalScore, 0);
  const juryScoreAverage = juryVoteCount > 0 ? juryScoreTotal / juryVoteCount : null;

  // Update or create voting stats
  await prisma.submissionVotingStats.upsert({
    where: { registrationNumber },
    create: {
      registrationNumber,
      juryVoteCount,
      juryScoreTotal,
      juryScoreAverage,
    },
    update: {
      juryVoteCount,
      juryScoreTotal,
      juryScoreAverage,
    },
  });
}

/**
 * Get jury dashboard statistics
 */
export async function getJuryDashboardStats(juryMemberId: string) {
  const progress = await prisma.juryScoringProgress.findUnique({
    where: { juryMemberId },
  });

  const juryMember = await prisma.juryMember.findUnique({
    where: { id: juryMemberId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return {
    juryMember,
    progress: progress || {
      totalAssignedEntries: 0,
      submittedScores: 0,
      completionPercentage: 0,
      averageScoreGiven: null,
      lastScoredAt: null,
    },
  };
}
