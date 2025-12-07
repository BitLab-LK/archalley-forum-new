/**
 * Competition Submission Types
 * Type definitions for the competition submission system
 */

import {
  CompetitionSubmission,
  SubmissionVote,
  SubmissionCategory,
  CompetitionSubmissionStatus,
  Competition,
  CompetitionRegistration,
  CompetitionRegistrationType,
} from '@prisma/client';

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export type SubmissionWithDetails = CompetitionSubmission & {
  votes?: SubmissionVote[];
  registration?: CompetitionRegistration & {
    registrationType?: CompetitionRegistrationType;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  competition?: Competition;
};

// ============================================
// FORM DATA TYPES
// ============================================

export interface SubmissionFormData {
  registrationId: string;
  submissionCategory: SubmissionCategory; // DIGITAL or PHYSICAL - Required
  description: string; // 50-200 words
  
  // Files
  keyPhotograph: File;
  additionalPhotographs: File[]; // Min 2, Max 4
  documentFile?: File | null; // Optional PDF < 5MB
  videoFile?: File | null; // Optional MP4 < 10MB
}

export interface SubmissionDraftData {
  registrationId: string;
  submissionCategory?: SubmissionCategory;
  title?: string;
  description?: string;
}

// ============================================
// FILE HANDLING TYPES
// ============================================

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface FileMetadata {
  keyPhoto?: {
    filename: string;
    size: number;
    uploadedAt: string;
  } | null;
  photos: Array<{
    filename: string;
    size: number;
    uploadedAt: string;
  }>;
  document?: {
    filename: string;
    size: number;
    uploadedAt: string;
  } | null;
  video?: {
    filename: string;
    size: number;
    uploadedAt: string;
  } | null;
}

export interface UploadConfig {
  registrationNumber: string;
  category: SubmissionCategory;
  year: number;
}

// ============================================
// VALIDATION TYPES
// ============================================

export interface SubmissionValidation {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface EligibilityCheck {
  canSubmit: boolean;
  reason?: string;
  registration?: CompetitionRegistration & {
    competition: Competition;
    registrationType: CompetitionRegistrationType;
  };
  existingSubmission?: CompetitionSubmission | null;
}

// ============================================
// SUBMISSION RULES
// ============================================

export const SUBMISSION_RULES = {
  description: {
    minWords: 50,
    maxWords: 200,
    excludedCategories: ['KIDS'], // No description requirement for kids
  },
  keyPhotograph: {
    required: true,
    formats: ['image/jpeg', 'image/jpg'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  additionalPhotographs: {
    min: 2,
    max: 4,
    formats: ['image/jpeg', 'image/jpg'],
    maxSize: 5 * 1024 * 1024, // 5MB per file
  },
  documentFile: {
    required: false,
    formats: ['application/pdf'],
    maxSize: 5 * 1024 * 1024, // 5MB
    excludedCategories: ['KIDS'],
  },
  videoFile: {
    required: false,
    formats: ['video/mp4'],
    maxSize: 10 * 1024 * 1024, // 10MB
    excludedCategories: ['KIDS'],
  },
} as const;

// ============================================
// WINNER & JUDGING TYPES
// ============================================

export interface JudgeScore {
  judgeId: string;
  judgeName: string;
  score: number;
  comments: string;
  judgedAt: string;
}

export interface WinnerData {
  rank: number;
  award: string;
  registrationNumber: string; // Public announcement number (e.g., QZ8T4L)
  participantName: string;
  submissionTitle: string;
  submissionImage: string;
  category: SubmissionCategory;
  score?: number;
}

// ============================================
// ADMIN TYPES
// ============================================

export interface SubmissionSummary {
  registrationNumber: string;
  participantName: string;
  hasSubmitted: boolean;
  submissionStatus?: CompetitionSubmissionStatus | null;
  submissionCategory?: SubmissionCategory | null;
  submittedAt?: Date | null;
}

export interface ValidationAction {
  submissionId: string;
  action: 'approve' | 'reject';
  notes?: string;
  validatorId: string;
}

// ============================================
// VOTING TYPES
// ============================================

export interface VoteData {
  submissionId: string;
  userId?: string | null;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
}

export interface VoteStats {
  totalVotes: number;
  userHasVoted: boolean;
  rank?: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export type SubmissionListFilter = {
  competitionId?: string;
  userId?: string;
  category?: SubmissionCategory;
  status?: CompetitionSubmissionStatus;
  isPublished?: boolean;
};

export type SubmissionSortBy = 
  | 'newest' 
  | 'oldest' 
  | 'most-voted' 
  | 'highest-score'
  | 'rank';

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SubmissionResponse {
  success: boolean;
  submission?: CompetitionSubmission;
  error?: string;
  validationErrors?: ValidationError[];
}

export interface SubmissionListResponse {
  success: boolean;
  submissions: SubmissionWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================
// EXPORT PRISMA TYPES
// ============================================

export type {
  CompetitionSubmission,
  SubmissionVote,
  SubmissionCategory,
  CompetitionSubmissionStatus,
};
