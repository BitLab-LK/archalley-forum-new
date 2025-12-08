import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendBriefDownloadLinkEmail } from '@/lib/brief-download-email-service';
import { z } from 'zod';
import crypto from 'crypto';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
  agreedToPrivacyPolicy: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Privacy Policy'
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Get session if user is logged in
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    // Check if a request already exists for this email
    let downloadRequest = await prisma.briefDownloadRequest.findUnique({
      where: { email: normalizedEmail }
    });

    let token: string;

    if (downloadRequest) {
      // Reuse existing token
      token = downloadRequest.token;
      
      // Update last requested time (optional - you might not want to update this)
      // await prisma.briefDownloadRequest.update({
      //   where: { id: downloadRequest.id },
      //   data: { firstRequestedAt: new Date() }
      // });
    } else {
      // Generate unique token
      token = crypto.randomBytes(32).toString('hex');
      
      // Create new request
      downloadRequest = await prisma.briefDownloadRequest.create({
        data: {
          email: normalizedEmail,
          token,
          userId: userId || null
        }
      });
    }

    // Send email with download link
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get('origin') || 'https://archalley.com';
    const downloadUrl = `${baseUrl}/api/brief-download/${token}`;

    const emailSent = await sendBriefDownloadLinkEmail(normalizedEmail, downloadUrl);

    if (!emailSent) {
      console.error('Failed to send brief download email to:', normalizedEmail);
      // Still return success since the token was created, just email failed
    }

    return NextResponse.json({
      success: true,
      message: 'Download link sent to your email'
    });

  } catch (error) {
    console.error('Error processing brief download request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

