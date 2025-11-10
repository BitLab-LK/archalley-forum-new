import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { z } from 'zod';

const twoFactorSchema = z.object({
  action: z.enum(['enable', 'disable', 'verify']),
  token: z.string().optional(),
  secret: z.string().optional()
});

// Enable 2FA - Generate secret and QR code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = twoFactorSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { action, token } = validationResult.data;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true,
        twoFactorEnabled: true,
        twoFactorSecret: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'enable':
        // Generate new secret for 2FA setup
        const newSecret = speakeasy.generateSecret({
          name: `Archalley (${user.email})`,
          issuer: 'ArchAlley Forum',
          length: 32
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(newSecret.otpauth_url!);

        // Store temporary secret (not enabled yet)
        await prisma.users.update({
          where: { id: userId },
          data: { 
            twoFactorSecret: newSecret.base32,
            twoFactorEnabled: false // Will be enabled after verification
          }
        });

        return NextResponse.json({
          success: true,
          secret: newSecret.base32,
          qrCode: qrCodeUrl,
          manualEntryKey: newSecret.base32
        });

      case 'verify':
        if (!token || !user.twoFactorSecret) {
          return NextResponse.json(
            { error: 'Token and secret are required for verification' },
            { status: 400 }
          );
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: token,
          window: 2
        });

        if (!verified) {
          return NextResponse.json(
            { error: 'Invalid verification code' },
            { status: 400 }
          );
        }

        // Enable 2FA
        await prisma.users.update({
          where: { id: userId },
          data: { twoFactorEnabled: true }
        });

        return NextResponse.json({
          success: true,
          message: 'Two-factor authentication enabled successfully'
        });

      case 'disable':
        if (!token) {
          return NextResponse.json(
            { error: 'Verification code required to disable 2FA' },
            { status: 400 }
          );
        }

        if (!user.twoFactorSecret || !user.twoFactorEnabled) {
          return NextResponse.json(
            { error: '2FA is not enabled for this account' },
            { status: 400 }
          );
        }

        // Verify the token before disabling
        const disableVerified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: token,
          window: 2
        });

        if (!disableVerified) {
          return NextResponse.json(
            { error: 'Invalid verification code' },
            { status: 400 }
          );
        }

        // Disable 2FA
        await prisma.users.update({
          where: { id: userId },
          data: { 
            twoFactorEnabled: false,
            twoFactorSecret: null
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Two-factor authentication disabled successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get 2FA status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled || false
    });

  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
