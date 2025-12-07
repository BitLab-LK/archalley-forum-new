/**
 * Auto-Save Draft Submission
 * POST /api/submissions/save-draft
 * Saves submission data as draft automatically
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUserSubmit } from '@/lib/submission-service';
import { SubmissionCategory } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      registrationId,
      category,
      description,
      keyPhotographUrl,
      additionalPhotographsUrls,
      documentFileUrl,
      videoFileUrl,
    } = body;

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Check eligibility (with admin bypass)
    const userRole = session.user.role as string;
    const eligibility = await canUserSubmit(session.user.id, registrationId, userRole);
    if (!eligibility.canSubmit) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    const registrationNumber = eligibility.registration!.registrationNumber;

    // Get or create draft submission
    const existingSubmission = await prisma.competitionSubmission.findUnique({
      where: { registrationId },
    });

    // Build file metadata
    const fileMetadata: any = {};
    if (keyPhotographUrl) {
      fileMetadata.keyPhoto = {
        filename: keyPhotographUrl.split('/').pop() || 'key-photo.jpg',
        uploadedAt: new Date().toISOString(),
      };
    }
    if (additionalPhotographsUrls && additionalPhotographsUrls.length > 0) {
      fileMetadata.photos = additionalPhotographsUrls.map((url: string) => ({
        filename: url.split('/').pop() || 'photo.jpg',
        uploadedAt: new Date().toISOString(),
      }));
    }
    if (documentFileUrl) {
      fileMetadata.document = {
        filename: documentFileUrl.split('/').pop() || 'document.pdf',
        uploadedAt: new Date().toISOString(),
      };
    }
    if (videoFileUrl) {
      fileMetadata.video = {
        filename: videoFileUrl.split('/').pop() || 'video.mp4',
        uploadedAt: new Date().toISOString(),
      };
    }

    // Auto-generate title
    const title = `Submission ${registrationNumber}`;

    if (existingSubmission) {
      // Update existing draft
      const submission = await prisma.competitionSubmission.update({
        where: { registrationId },
        data: {
          ...(category && { submissionCategory: category as SubmissionCategory }),
          ...(description !== undefined && { description }),
          ...(keyPhotographUrl && { keyPhotographUrl }),
          ...(additionalPhotographsUrls && { additionalPhotographs: additionalPhotographsUrls }),
          ...(documentFileUrl !== undefined && { documentFileUrl }),
          ...(videoFileUrl !== undefined && { videoFileUrl }),
          ...(Object.keys(fileMetadata).length > 0 && { fileMetadata }),
          status: 'DRAFT',
        },
      });

      return NextResponse.json({
        success: true,
        submission,
        message: 'Draft saved successfully',
      });
    } else {
      // Create new draft
      const submission = await prisma.competitionSubmission.create({
        data: {
          registrationId,
          registrationNumber,
          userId: session.user.id,
          competitionId: eligibility.registration!.competitionId,
          submissionCategory: (category as SubmissionCategory) || 'DIGITAL',
          title,
          description: description || '',
          keyPhotographUrl: keyPhotographUrl || '',
          additionalPhotographs: additionalPhotographsUrls || [],
          documentFileUrl: documentFileUrl || null,
          videoFileUrl: videoFileUrl || null,
          fileMetadata: Object.keys(fileMetadata).length > 0 ? fileMetadata : null,
          status: 'DRAFT',
        },
      });

      return NextResponse.json({
        success: true,
        submission,
        message: 'Draft created successfully',
      });
    }
  } catch (error) {
    console.error('Draft save error:', error);
    return NextResponse.json(
      {
        error: 'Failed to save draft',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

