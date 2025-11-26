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
  JudgeScore,
} from '@/types/submission';
import { SubmissionCategory, RegistrationStatus } from '@prisma/client';

// ============================================
// ELIGIBILITY CHECKS
// ============================================

export async function canUserSubmit(
  userId: string,
  registrationId: string
): Promise<EligibilityCheck> {
  
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
  
  // Check if submission deadline passed
  const now = new Date();
  if (now > registration.competition.endDate) {
    return { 
      canSubmit: false, 
      reason: 'Submission deadline has passed' 
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
  
  // Check if already submitted (from NEW submission table)
  const existingSubmission = await prisma.competitionSubmission.findUnique({
    where: { registrationId: registrationId }
  });
  
  if (existingSubmission && existingSubmission.status !== 'DRAFT') {
    return { 
      canSubmit: false, 
      reason: 'You have already submitted for this competition',
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
// SUBMISSION NUMBER GENERATION
// ============================================

export async function generateSubmissionNumber(
  category: SubmissionCategory
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = category === SubmissionCategory.DIGITAL ? 'DIG' : 'PHY';
  
  // Find last submission number for this category and year
  const lastSubmission = await prisma.competitionSubmission.findFirst({
    where: {
      submissionNumber: {
        startsWith: `SUB${year}-${prefix}`
      }
    },
    orderBy: { submissionNumber: 'desc' }
  });
  
  const sequence = lastSubmission 
    ? parseInt(lastSubmission.submissionNumber.split('-')[2]) + 1
    : 1;
    
  return `SUB${year}-${prefix}-${sequence.toString().padStart(3, '0')}`;
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
      orderBy.voteCount = 'desc';
      break;
    case 'highest-score':
      orderBy.finalScore = 'desc';
      break;
    case 'rank':
      orderBy.rank = 'asc';
      break;
  }
  
  const [submissions, total] = await Promise.all([
    prisma.competitionSubmission.findMany({
      where,
      include: { votes: true },
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
      submissionNumber: submission?.submissionNumber || null,
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
  
  // Update submission with award
  await prisma.competitionSubmission.update({
    where: { id: submissionId },
    data: {
      award,
      rank,
      finalScore,
      status: 'PUBLISHED',
      isPublished: true,
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
      award: { not: null }
    },
    orderBy: { rank: 'asc' }
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
        rank: sub.rank || 0,
        award: sub.award || '',
        registrationNumber: registration.registrationNumber,
        participantName,
        submissionTitle: sub.title,
        submissionImage: sub.keyPhotographUrl,
        category: sub.submissionCategory,
        score: sub.finalScore || undefined,
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
  
  const existingScores = (submission.judgeScores as any as JudgeScore[]) || [];
  
  const newScore: JudgeScore = {
    judgeId,
    judgeName,
    score,
    comments,
    judgedAt: new Date().toISOString(),
  };
  
  const updatedScores = [
    ...existingScores.filter((s: JudgeScore) => s.judgeId !== judgeId),
    newScore
  ];
  
  // Calculate final score (average)
  const finalScore = updatedScores.reduce((sum, s) => sum + s.score, 0) / updatedScores.length;
  
  await prisma.competitionSubmission.update({
    where: { id: submissionId },
    data: {
      judgeScores: updatedScores as any,
      finalScore,
    }
  });
}
