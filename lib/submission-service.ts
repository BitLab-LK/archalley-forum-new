/**
 * Competition Submission Service
 * Business logic for submission management
 */

import { prisma } from '@/lib/prisma';
import type {
  EligibilityCheck,
  SubmissionWithDetails,
  SubmissionSummary,
  WinnerData,
  SubmissionListFilter,
  SubmissionSortBy,
} from '@/types/submission';
import { RegistrationStatus } from '@prisma/client';

// ============================================
// ELIGIBILITY CHECKS
// ============================================

export async function canUserSubmit(
  userId: string,
  registrationId: string,
  userRole?: string
): Promise<EligibilityCheck> {
  
  // Check if user is admin or super admin
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  
  // Check existing registration status (READ-ONLY from existing table)
  const registration = await prisma.competitionRegistration.findFirst({
    where: {
      id: registrationId,
      userId: userId,
      status: RegistrationStatus.CONFIRMED, // Payment must be confirmed
    },
    include: {
      competition: true,
      registrationType: true,
    }
  });
  
  if (!registration) {
    return { 
      canSubmit: false, 
      reason: 'Registration not found or payment not confirmed' 
    };
  }
  
  // Admins and super admins can bypass submission period restrictions
  if (!isAdmin) {
    // Check submission period dates
    // Submission starts: 11th December 2025
    // Kids deadline: 21st December 2025
    // Other categories deadline: 24th December 2025
    const now = new Date();
    const submissionStartDate = new Date('2025-12-11T00:00:00+05:30');
    const kidsDeadline = new Date('2025-12-21T23:59:59+05:30');
    const otherCategoriesDeadline = new Date('2025-12-24T23:59:59+05:30');
    
    // Check if submission period has started
    if (now < submissionStartDate) {
      return {
        canSubmit: false,
        reason: 'Submission period has not started yet. Submissions open on 11th December 2025.'
      };
    }
    
    // Check category-specific deadline
    const isKidsCategory = registration.registrationType?.type === 'KIDS';
    const deadline = isKidsCategory ? kidsDeadline : otherCategoriesDeadline;
    
    if (now > deadline) {
      const categoryName = isKidsCategory ? 'kids' : 'other';
      const deadlineDate = isKidsCategory ? '21st December 2025' : '24th December 2025';
      return {
        canSubmit: false,
        reason: `Submission deadline for ${categoryName} category has passed (${deadlineDate})`
      };
    }
    
    // Check if competition accepts submissions
    if (registration.competition.status !== 'REGISTRATION_OPEN' && 
        registration.competition.status !== 'IN_PROGRESS') {
      return { 
        canSubmit: false, 
        reason: 'Competition is not accepting submissions' 
      };
    }
  }
  
  // Check if already submitted (from NEW submission table)
  // Each registration can only be submitted once
  const existingSubmission = await prisma.competitionSubmission.findUnique({
    where: { registrationId: registrationId }
  });
  
  if (existingSubmission && existingSubmission.status !== 'DRAFT') {
    return { 
      canSubmit: false, 
      reason: 'This entry has already been submitted. Each entry can only be submitted once.',
      existingSubmission 
    };
  }
  
  return { 
    canSubmit: true, 
    registration,
    existingSubmission // For edit mode
  };
}

// ============================================
// GET SUBMISSION WITH DETAILS
// ============================================

export async function getSubmissionWithDetails(
  submissionId: string
): Promise<SubmissionWithDetails | null> {
  
  // Get submission from NEW table
  const submission = await prisma.competitionSubmission.findUnique({
    where: { id: submissionId },
    include: { votes: true }
  });
  
  if (!submission) return null;
  
  // Fetch related data from existing tables (READ-ONLY)
  const [registration, user, competition] = await Promise.all([
    prisma.competitionRegistration.findUnique({
      where: { id: submission.registrationId },
      include: { 
        registrationType: true,
        payment: true 
      }
    }),
    prisma.users.findUnique({
      where: { id: submission.userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        image: true 
      }
    }),
    prisma.competition.findUnique({
      where: { id: submission.competitionId }
    })
  ]);
  
  // Combine data
  return {
    ...submission,
    registration: registration || undefined,
    user: user || undefined,
    competition: competition || undefined,
  };
}

// ============================================
// GET USER SUBMISSIONS
// ============================================

export async function getUserSubmissions(
  userId: string,
  competitionId?: string
): Promise<SubmissionWithDetails[]> {
  
  const where: any = { userId };
  if (competitionId) {
    where.competitionId = competitionId;
  }
  
  const submissions = await prisma.competitionSubmission.findMany({
    where,
    include: { votes: true },
    orderBy: { createdAt: 'desc' }
  });
  
  // Enrich with registration and competition data
  const enrichedSubmissions = await Promise.all(
    submissions.map(async (submission) => {
      const [registration, user, competition] = await Promise.all([
        prisma.competitionRegistration.findUnique({
          where: { id: submission.registrationId },
          include: { registrationType: true }
        }),
        prisma.users.findUnique({
          where: { id: submission.userId },
          select: { id: true, name: true, email: true, image: true }
        }),
        prisma.competition.findUnique({
          where: { id: submission.competitionId }
        })
      ]);
      
      return {
        ...submission,
        registration: registration || undefined,
        user: user || undefined,
        competition: competition || undefined,
      };
    })
  );
  
  return enrichedSubmissions;
}

// ============================================
// GET SUBMISSIONS LIST
// ============================================

export async function getSubmissions(
  filter: SubmissionListFilter = {},
  sortBy: SubmissionSortBy = 'newest',
  page: number = 1,
  pageSize: number = 20
): Promise<{ submissions: SubmissionWithDetails[]; total: number }> {
  
  const where: any = {};
  
  if (filter.competitionId) where.competitionId = filter.competitionId;
  if (filter.userId) where.userId = filter.userId;
  if (filter.category) where.submissionCategory = filter.category;
  if (filter.status) where.status = filter.status;
  if (filter.isPublished !== undefined) where.isPublished = filter.isPublished;
  
  // Sort configuration
  const orderBy: any = {};
  switch (sortBy) {
    case 'newest':
      orderBy.createdAt = 'desc';
      break;
    case 'oldest':
      orderBy.createdAt = 'asc';
      break;
    case 'most-voted':
      orderBy.votingStats = { publicVoteCount: 'desc' };
      break;
    case 'highest-score':
      orderBy.votingStats = { juryScoreAverage: 'desc' };
      break;
    case 'rank':
      orderBy.votingStats = { publicRank: 'asc' };
      break;
  }
  
  const [submissions, total] = await Promise.all([
    prisma.competitionSubmission.findMany({
      where,
      include: { votes: true, votingStats: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.competitionSubmission.count({ where })
  ]);
  
  // Enrich with details
  const enrichedSubmissions = await Promise.all(
    submissions.map(async (submission) => {
      const [registration, user, competition] = await Promise.all([
        prisma.competitionRegistration.findUnique({
          where: { id: submission.registrationId },
          include: { registrationType: true }
        }),
        prisma.users.findUnique({
          where: { id: submission.userId },
          select: { id: true, name: true, email: true, image: true }
        }),
        prisma.competition.findUnique({
          where: { id: submission.competitionId }
        })
      ]);
      
      return {
        ...submission,
        registration: registration || undefined,
        user: user || undefined,
        competition: competition || undefined,
      };
    })
  );
  
  return { submissions: enrichedSubmissions, total };
}

// ============================================
// REGISTRATION SUBMISSION STATUS
// ============================================

export async function getRegistrationSubmissionStatus(
  competitionId: string
): Promise<SubmissionSummary[]> {
  
  // Get all confirmed registrations for this competition
  const registrations = await prisma.competitionRegistration.findMany({
    where: { 
      competitionId,
      status: RegistrationStatus.CONFIRMED 
    },
    orderBy: { registrationNumber: 'asc' }
  });
  
  // Get all submissions for this competition
  const submissions = await prisma.competitionSubmission.findMany({
    where: { competitionId }
  });
  
  // Map registrations to submission status
  return registrations.map(reg => {
    const submission = submissions.find(sub => sub.registrationId === reg.id);
    
    // Extract participant name from registration data
    let participantName = 'Unknown';
    if (reg.teamName) {
      participantName = reg.teamName;
    } else if (reg.companyName) {
      participantName = reg.companyName;
    } else if (reg.members && typeof reg.members === 'object') {
      const members: any = reg.members;
      participantName = members.name || members.firstName + ' ' + members.lastName || 'Unknown';
    }
    
    return {
      registrationNumber: reg.registrationNumber,
      participantName,
      hasSubmitted: !!submission,
      submissionStatus: submission?.status || null,
      submissionCategory: submission?.submissionCategory || null,
      submittedAt: submission?.submittedAt || null,
    };
  });
}

// ============================================
// WINNER MANAGEMENT
// ============================================

export async function announceWinner(
  submissionId: string,
  award: string,
  rank: number,
  finalScore?: number
): Promise<WinnerData> {
  
  // Get submission
  const submission = await prisma.competitionSubmission.findUnique({
    where: { id: submissionId }
  });
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  // Get registration data (for the public announcement number)
  const registration = await prisma.competitionRegistration.findUnique({
    where: { id: submission.registrationId },
    include: { user: true, registrationType: true }
  });
  
  if (!registration) {
    throw new Error('Registration not found');
  }
  
  // Update submission status
  await prisma.competitionSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'PUBLISHED',
      isPublished: true,
    }
  });
  
  // Update voting stats with award and ranking
  await prisma.submissionVotingStats.upsert({
    where: {
      registrationNumber: registration.registrationNumber,
    },
    create: {
      registrationNumber: registration.registrationNumber,
      award,
      publicRank: rank,
      juryScoreAverage: finalScore,
    },
    update: {
      award,
      publicRank: rank,
      juryScoreAverage: finalScore,
    }
  });
  
  // Extract participant name
  let participantName = 'Unknown';
  if (registration.teamName) {
    participantName = registration.teamName;
  } else if (registration.companyName) {
    participantName = registration.companyName;
  } else if (registration.members && typeof registration.members === 'object') {
    const members: any = registration.members;
    participantName = members.name || `${members.firstName} ${members.lastName}` || 'Unknown';
  }
  
  return {
    rank,
    award,
    registrationNumber: registration.registrationNumber, // ⭐ Public number
    participantName,
    submissionTitle: submission.title,
    submissionImage: submission.keyPhotographUrl,
    category: submission.submissionCategory,
    score: finalScore,
  };
}

export async function getWinners(
  competitionId: string
): Promise<WinnerData[]> {
  
  const submissions = await prisma.competitionSubmission.findMany({
    where: {
      competitionId,
      votingStats: {
        award: { not: null }
      }
    },
    include: {
      votingStats: true
    },
    orderBy: {
      votingStats: {
        publicRank: 'asc'
      }
    }
  });
  
  const winners = await Promise.all(
    submissions.map(async (sub) => {
      const registration = await prisma.competitionRegistration.findUnique({
        where: { id: sub.registrationId },
        include: { user: true }
      });
      
      if (!registration) {
        throw new Error(`Registration not found for submission ${sub.id}`);
      }
      
      let participantName = 'Unknown';
      if (registration.teamName) {
        participantName = registration.teamName;
      } else if (registration.companyName) {
        participantName = registration.companyName;
      } else if (registration.members && typeof registration.members === 'object') {
        const members: any = registration.members;
        participantName = members.name || `${members.firstName} ${members.lastName}` || 'Unknown';
      }
      
      return {
        rank: sub.votingStats?.publicRank || 0,
        award: sub.votingStats?.award || '',
        registrationNumber: registration.registrationNumber,
        participantName,
        submissionTitle: sub.title,
        submissionImage: sub.keyPhotographUrl,
        category: sub.submissionCategory,
        score: sub.votingStats?.juryScoreAverage || undefined,
      };
    })
  );
  
  return winners;
}

// ============================================
// JUDGING
// ============================================

export async function addJudgeScore(
  submissionId: string,
  judgeId: string,
  judgeName: string,
  score: number,
  comments: string
): Promise<void> {
  
  const submission = await prisma.competitionSubmission.findUnique({
    where: { id: submissionId }
  });
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  // Use transaction to create/update jury vote and update voting stats
  await prisma.$transaction(async (tx) => {
    // Upsert the jury vote (using registrationNumber_userId unique constraint)
    await tx.submissionVote.upsert({
      where: {
        registrationNumber_userId: {
          registrationNumber: submission.registrationNumber,
          userId: judgeId
        }
      },
      create: {
        registrationNumber: submission.registrationNumber,
        userId: judgeId,
        voteType: 'JURY',
        score,
        comments,
        scoringCriteria: { judgeName } // Store judge name in criteria
      },
      update: {
        voteType: 'JURY', // Ensure it's marked as JURY vote
        score,
        comments,
        scoringCriteria: { judgeName },
        updatedAt: new Date()
      }
    });
    
    // Get all jury votes for this submission to calculate average
    const juryVotes = await tx.submissionVote.findMany({
      where: {
        registrationNumber: submission.registrationNumber,
        voteType: 'JURY'
      }
    });
    
    const juryScoreAverage = juryVotes.length > 0
      ? juryVotes.reduce((sum, v) => sum + (v.score || 0), 0) / juryVotes.length
      : 0;
    
    // Update voting stats
    await tx.submissionVotingStats.upsert({
      where: { registrationNumber: submission.registrationNumber },
      create: {
        registrationNumber: submission.registrationNumber,
        juryVoteCount: juryVotes.length,
        juryScoreAverage
      },
      update: {
        juryVoteCount: juryVotes.length,
        juryScoreAverage
      }
    });
  });
}
