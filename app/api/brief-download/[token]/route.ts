import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid download token' },
        { status: 400 }
      );
    }

    // Find the download request by token
    const downloadRequest = await prisma.briefDownloadRequest.findUnique({
      where: { token }
    });

    if (!downloadRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired download link' },
        { status: 404 }
      );
    }

    // Update access count and last accessed time
    await prisma.briefDownloadRequest.update({
      where: { id: downloadRequest.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });

    // File path
    const filePath = path.join(
      process.cwd(),
      'public',
      'downloads',
      'Christmas Tree Competition 2025 - Brief.pdf'
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('Brief PDF file not found at:', filePath);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = 'Christmas Tree Competition 2025 - Brief.pdf';

    // Update download count (after successful file read)
    await prisma.briefDownloadRequest.update({
      where: { id: downloadRequest.id },
      data: {
        downloadCount: { increment: 1 }
      }
    });

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error serving brief download:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

