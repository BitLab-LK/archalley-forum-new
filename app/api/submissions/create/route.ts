/**
 * Create Competition Submission API
 * POST /api/submissions/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  canUserSubmit,
} from '@/lib/submission-service';
import {
  uploadSubmissionFile,
  uploadMultiplePhotos,
  validateFile,
  validateMultiplePhotos,
  validateWordCount,
} from '@/lib/azure-blob-submission-upload';
import { sendSubmissionCreatedEmail } from '@/lib/competition-email-service';
import { SubmissionCategory } from '@prisma/client';
import type { FileMetadata } from '@/types/submission';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    // Extract form fields
    const registrationId = formData.get('registrationId') as string;
    const category = formData.get('category') as SubmissionCategory;
    const description = formData.get('description') as string;
    const isDraft = formData.get('isDraft') === 'true';

    // Basic validation
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // For non-drafts, require category
    if (!isDraft && !category) {
      return NextResponse.json(
        { error: 'Category is required for submission' },
        { status: 400 }
      );
    }

    // Validate category (if provided)
    if (
      category &&
      category !== 'DIGITAL' &&
      category !== 'PHYSICAL'
    ) {
      return NextResponse.json(
        { error: 'Invalid submission category. Must be DIGITAL or PHYSICAL' },
        { status: 400 }
      );
    }

    // Check eligibility (pass user role for admin bypass)
    const userRole = session.user.role as string;
    const eligibility = await canUserSubmit(session.user.id, registrationId, userRole);
    if (!eligibility.canSubmit) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    // Get registration number for the submission
    const registrationNumber = eligibility.registration!.registrationNumber;
    
    // Auto-generate title from registration number
    const title = `Submission ${registrationNumber}`;

    // Validate description word count (skip for drafts)
    if (!isDraft && description) {
      const wordCountValidation = validateWordCount(description, 50, 200);
      if (!wordCountValidation.valid) {
        return NextResponse.json(
          { error: wordCountValidation.error },
          { status: 400 }
        );
      }
    }

    // Get files or URLs from form data (URLs are preferred - files are uploaded immediately)
    const keyPhotoFile = formData.get('keyPhotograph') as File | null;
    const keyPhotoUrlFromForm = formData.get('keyPhotographUrl') as string | null;
    const additionalPhotosArray = formData.getAll('additionalPhotographs') as File[];
    const additionalPhotosUrlsFromForm = formData.getAll('additionalPhotographsUrls') as string[];
    const documentFile = formData.get('documentFile') as File | null;
    const documentFileUrlFromForm = formData.get('documentFileUrl') as string | null;
    const videoFile = formData.get('videoFile') as File | null;
    const videoFileUrlFromForm = formData.get('videoFileUrl') as string | null;

    let keyPhotoUrl: string | null = null;
    let photoUrls: string[] = [];
    let documentUrl: string | null = null;
    let videoUrl: string | null = null;
    let fileMetadata: FileMetadata | null = null;

    // Use URLs if provided (files already uploaded), otherwise upload files
    const hasUrls = keyPhotoUrlFromForm || additionalPhotosUrlsFromForm.length > 0 || documentFileUrlFromForm || videoFileUrlFromForm;
    const hasFiles = keyPhotoFile || additionalPhotosArray.length > 0 || documentFile || videoFile;
    
    if (hasUrls) {
      // Files already uploaded - use URLs directly
      keyPhotoUrl = keyPhotoUrlFromForm;
      photoUrls = additionalPhotosUrlsFromForm;
      documentUrl = documentFileUrlFromForm;
      videoUrl = videoFileUrlFromForm;
    } else if (hasFiles) {
      // Legacy: Upload files now (for backward compatibility)
      // For final submissions, validate all required files
      if (!isDraft) {
        // Validate required files
        if (!keyPhotoFile) {
          return NextResponse.json(
            { error: 'Key photograph is required' },
            { status: 400 }
          );
        }

        if (additionalPhotosArray.length < 2) {
          return NextResponse.json(
            { error: 'At least 2 additional photographs are required' },
            { status: 400 }
          );
        }
      }

      // Validate files if provided
      if (keyPhotoFile) {
        const keyPhotoValidation = validateFile(keyPhotoFile, 'photo');
        if (!keyPhotoValidation.valid) {
          return NextResponse.json(
            { error: `Key photograph: ${keyPhotoValidation.error}` },
            { status: 400 }
          );
        }
      }

      if (additionalPhotosArray.length > 0) {
        const additionalPhotosValidation = validateMultiplePhotos(additionalPhotosArray);
        if (!additionalPhotosValidation.valid) {
          return NextResponse.json(
            { error: additionalPhotosValidation.error },
            { status: 400 }
          );
        }
      }

      // Validate optional files
      if (documentFile) {
        const docValidation = validateFile(documentFile, 'document');
        if (!docValidation.valid) {
          return NextResponse.json(
            { error: `Document: ${docValidation.error}` },
            { status: 400 }
          );
        }
      }

      if (videoFile) {
        const videoValidation = validateFile(videoFile, 'video');
        if (!videoValidation.valid) {
          return NextResponse.json(
            { error: `Video: ${videoValidation.error}` },
            { status: 400 }
          );
        }
      }

      // Upload files to Azure Blob storage
      const year = new Date().getFullYear();
      const uploadConfig = { 
        registrationNumber,
        category: category as SubmissionCategory || 'DIGITAL', 
        year 
      };

      // Upload key photograph if provided
      if (keyPhotoFile) {
        const keyPhotoResult = await uploadSubmissionFile(
          keyPhotoFile,
          'key-photo',
          uploadConfig
        );
        keyPhotoUrl = keyPhotoResult.url;
      }

      // Upload additional photographs if provided
      if (additionalPhotosArray.length > 0) {
        const photoResults = await uploadMultiplePhotos(
          additionalPhotosArray,
          uploadConfig
        );
        photoUrls = photoResults.map((r) => r.url);
      }

      // Upload optional document if provided
      if (documentFile) {
        const docResult = await uploadSubmissionFile(
          documentFile,
          'document',
          uploadConfig
        );
        documentUrl = docResult.url;
      }

      // Upload optional video if provided
      if (videoFile) {
        const videoResult = await uploadSubmissionFile(
          videoFile,
          'video',
          uploadConfig
        );
        videoUrl = videoResult.url;
      }

      // Build file metadata for uploaded files
      fileMetadata = {
        keyPhoto: keyPhotoFile ? {
          filename: keyPhotoFile.name,
          size: keyPhotoFile.size,
          uploadedAt: new Date().toISOString(),
        } : null,
        photos: additionalPhotosArray.map((f) => ({
          filename: f.name,
          size: f.size,
          uploadedAt: new Date().toISOString(),
        })),
        document: documentFile ? {
          filename: documentFile.name,
          size: documentFile.size,
          uploadedAt: new Date().toISOString(),
        } : null,
        video: videoFile ? {
          filename: videoFile.name,
          size: videoFile.size,
          uploadedAt: new Date().toISOString(),
        } : null,
      };
    }

    // Check if this is an update (submission already exists)
    const existingSubmission = await prisma.competitionSubmission.findUnique({
      where: { registrationId },
    });

    // Prevent resubmission if already submitted (not a draft)
    // Each registration can only be submitted once
    if (existingSubmission && existingSubmission.status !== 'DRAFT') {
      if (!isDraft) {
        return NextResponse.json(
          { error: 'This entry has already been submitted. Each entry can only be submitted once and cannot be modified.' },
          { status: 400 }
        );
      } else {
        // Even for drafts, if already submitted, don't allow updates
        return NextResponse.json(
          { error: 'This entry has already been submitted and cannot be modified.' },
          { status: 400 }
        );
      }
    }

    console.log(existingSubmission ? `📝 Updating existing submission for registration: ${registrationId}` : '✨ Creating new submission');

    // Create or update submission record
    // Auto-validate and auto-publish non-draft submissions
    const submission = await prisma.competitionSubmission.upsert({
      where: { registrationId },
      create: {
        registrationId,
        registrationNumber,
        userId: session.user.id,
        competitionId: eligibility.registration!.competitionId,
        submissionCategory: category || 'DIGITAL', // Default for drafts
        title: title,
        description: description || '',
        keyPhotographUrl: keyPhotoUrl || '',
        additionalPhotographs: photoUrls,
        documentFileUrl: documentUrl,
        videoFileUrl: videoUrl,
        fileMetadata: fileMetadata as any,
        // Auto-validate and auto-publish non-draft submissions
        status: isDraft ? 'DRAFT' : 'PUBLISHED',
        submittedAt: isDraft ? null : new Date(),
        isValidated: !isDraft, // Auto-validate
        validatedAt: isDraft ? null : new Date(),
        isPublished: !isDraft, // Auto-publish
        publishedAt: isDraft ? null : new Date(),
      },
      update: {
        ...(category && { submissionCategory: category }),
        ...(description !== undefined && { description }),
        // Only update file fields if new files were uploaded
        ...(keyPhotoUrl && { keyPhotographUrl: keyPhotoUrl }),
        ...(photoUrls.length > 0 && { additionalPhotographs: photoUrls }),
        ...(documentUrl !== null && { documentFileUrl: documentUrl }),
        ...(videoUrl !== null && { videoFileUrl: videoUrl }),
        ...(fileMetadata && { fileMetadata: fileMetadata as any }),
        // Auto-validate and auto-publish when changing from DRAFT to final submission
        // Only allow status change if currently a draft
        ...(existingSubmission?.status === 'DRAFT' && {
          status: isDraft ? 'DRAFT' : 'PUBLISHED',
          submittedAt: isDraft ? null : new Date(),
          isValidated: isDraft ? false : true,
          validatedAt: isDraft ? null : new Date(),
          isPublished: !isDraft,
          publishedAt: isDraft ? null : new Date(),
        }),
      },
    });
    console.log(`✅ Submission saved: ${registrationNumber} (Status: ${submission.status})`);

    // Create voting stats record when submission is published
    if (!isDraft && submission.status === 'PUBLISHED') {
      await prisma.submissionVotingStats.upsert({
        where: { registrationNumber },
        create: {
          registrationNumber,
          publicVoteCount: 0,
          juryVoteCount: 0,
          juryScoreTotal: 0,
          viewCount: 0,
          shareCount: 0,
        },
        update: {}, // Do nothing if already exists
      });
      console.log(`📊 Voting stats initialized for ${registrationNumber}`);
    }

    // Send email notifications if submission is not a draft
    if (!isDraft && submission.status === 'PUBLISHED') {
      try {
        // Fetch user and competition details for email
        const [user, competition] = await Promise.all([
          prisma.users.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true },
          }),
          prisma.competition.findUnique({
            where: { id: eligibility.registration!.competitionId },
          }),
        ]);

        if (user && competition) {
          // Send submission completed email
          await sendSubmissionCreatedEmail({
            submission: {
              registrationNumber: submission.registrationNumber || registrationNumber,
              title: submission.title,
              submissionCategory: submission.submissionCategory,
              submittedAt: submission.submittedAt,
            },
            competition: competition as any,
            userName: user.name || 'Participant',
            userEmail: user.email,
          });
          console.log(`📧 Submission completed email sent to ${user.email}`);
        }
      } catch (emailError) {
        console.error('❌ Failed to send submission published email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      submission,
      message: isDraft
        ? 'Draft saved successfully'
        : 'Submission created successfully',
    });
  } catch (error) {
    console.error('Submission creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create submission',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
