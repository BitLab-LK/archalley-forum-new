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
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isDraft = formData.get('isDraft') === 'true';

    // Basic validation
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // For non-drafts, require all fields
    if (!isDraft && (!category || !title)) {
      return NextResponse.json(
        { error: 'Category and title are required for submission' },
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

    // Check eligibility
    const eligibility = await canUserSubmit(session.user.id, registrationId);
    if (!eligibility.canSubmit) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    // Get registration number for the submission
    const registrationNumber = eligibility.registration!.registrationNumber;

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

    // Get files from form data
    const keyPhotoFile = formData.get('keyPhotograph') as File | null;
    const additionalPhotosArray = formData.getAll('additionalPhotographs') as File[];
    const documentFile = formData.get('documentFile') as File | null;
    const videoFile = formData.get('videoFile') as File | null;

    let keyPhotoUrl: string | null = null;
    let photoUrls: string[] = [];
    let documentUrl: string | null = null;
    let videoUrl: string | null = null;
    let fileMetadata: FileMetadata | null = null;

    // For non-draft submissions, validate and upload files
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

      // Validate key photograph
      const keyPhotoValidation = validateFile(keyPhotoFile, 'photo');
      if (!keyPhotoValidation.valid) {
        return NextResponse.json(
          { error: `Key photograph: ${keyPhotoValidation.error}` },
          { status: 400 }
        );
      }

      // Validate additional photographs
      const additionalPhotosValidation = validateMultiplePhotos(additionalPhotosArray);
      if (!additionalPhotosValidation.valid) {
        return NextResponse.json(
          { error: additionalPhotosValidation.error },
          { status: 400 }
        );
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

      const year = new Date().getFullYear();
      const uploadConfig = { 
        registrationNumber,
        category: category as SubmissionCategory, 
        year 
      };

      // Upload files to Vercel Blob
      const keyPhotoResult = await uploadSubmissionFile(
        keyPhotoFile,
        'key-photo',
        uploadConfig
      );
      keyPhotoUrl = keyPhotoResult.url;

      const photoResults = await uploadMultiplePhotos(
        additionalPhotosArray,
        uploadConfig
      );
      photoUrls = photoResults.map((r) => r.url);

      if (documentFile) {
        const docResult = await uploadSubmissionFile(
          documentFile,
          'document',
          uploadConfig
        );
        documentUrl = docResult.url;
      }

      if (videoFile) {
        const videoResult = await uploadSubmissionFile(
          videoFile,
          'video',
          uploadConfig
        );
        videoUrl = videoResult.url;
      }

      // Build file metadata
      fileMetadata = {
        keyPhoto: {
          filename: keyPhotoFile.name,
          size: keyPhotoFile.size,
          uploadedAt: new Date().toISOString(),
        },
        photos: additionalPhotosArray.map((f) => ({
          filename: f.name,
          size: f.size,
          uploadedAt: new Date().toISOString(),
        })),
        document: documentFile
          ? {
              filename: documentFile.name,
              size: documentFile.size,
              uploadedAt: new Date().toISOString(),
            }
          : null,
        video: videoFile
          ? {
              filename: videoFile.name,
              size: videoFile.size,
              uploadedAt: new Date().toISOString(),
            }
          : null,
      };
    }

    // Check if this is an update (submission already exists)
    const existingSubmission = await prisma.competitionSubmission.findUnique({
      where: { registrationId },
    });

    console.log(existingSubmission ? `📝 Updating existing submission for registration: ${registrationId}` : '✨ Creating new submission');

    // Create or update submission record
    const submission = await prisma.competitionSubmission.upsert({
      where: { registrationId },
      create: {
        registrationId,
        registrationNumber,
        userId: session.user.id,
        competitionId: eligibility.registration!.competitionId,
        submissionCategory: category || 'DIGITAL', // Default for drafts
        title: title || 'Untitled Draft',
        description: description || '',
        keyPhotographUrl: keyPhotoUrl || '',
        additionalPhotographs: photoUrls,
        documentFileUrl: documentUrl,
        videoFileUrl: videoUrl,
        fileMetadata: fileMetadata as any,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        submittedAt: isDraft ? null : new Date(),
      },
      update: {
        ...(category && { submissionCategory: category }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        // Only update file fields if new files were uploaded
        ...(keyPhotoUrl && { keyPhotographUrl: keyPhotoUrl }),
        ...(photoUrls.length > 0 && { additionalPhotographs: photoUrls }),
        ...(documentUrl !== null && { documentFileUrl: documentUrl }),
        ...(videoUrl !== null && { videoFileUrl: videoUrl }),
        ...(fileMetadata && { fileMetadata: fileMetadata as any }),
        // Update status (can change from DRAFT to SUBMITTED)
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
        submittedAt: isDraft ? null : new Date(),
      },
    });
    console.log(`✅ Submission saved: ${registrationNumber} (Status: ${submission.status})`);

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
