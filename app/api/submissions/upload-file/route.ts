/**
 * Upload File to Blob for Submission
 * POST /api/submissions/upload-file
 * Uploads a single file to Azure Blob Storage immediately
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadSubmissionFile } from '@/lib/azure-blob-submission-upload';
import { SubmissionCategory } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const registrationId = formData.get('registrationId') as string;
    const fileType = formData.get('fileType') as 'key-photo' | 'photo' | 'document' | 'video';
    const category = formData.get('category') as SubmissionCategory | null;
    const index = formData.get('index') ? parseInt(formData.get('index') as string) : undefined;

    if (!file || !registrationId || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, registrationId, fileType' },
        { status: 400 }
      );
    }

    // Get registration to verify ownership and get registration number
    const registration = await prisma.competitionRegistration.findUnique({
      where: { id: registrationId },
      select: {
        id: true,
        userId: true,
        registrationNumber: true,
        competitionId: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (registration.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use provided category or default to DIGITAL
    const submissionCategory = category || 'DIGITAL';

    // Upload file to blob
    const year = new Date().getFullYear();
    const uploadConfig = {
      registrationNumber: registration.registrationNumber,
      category: submissionCategory,
      year,
    };

    const result = await uploadSubmissionFile(file, fileType, uploadConfig, index);

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // If it's a validation error (file size, type, etc.), return 400
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes('too large') || 
          errorMessage.includes('Invalid file type') || 
          errorMessage.includes('File is empty') ||
          errorMessage.includes('Maximum size')) {
        return NextResponse.json(
          {
            error: errorMessage,
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

