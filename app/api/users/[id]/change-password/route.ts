import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { isPasswordInHistory, addPasswordToHistory } from '@/lib/password-history';

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(), // Made optional for social media users
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

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

    const { id } = await params;
    
    // Verify the user is changing their own password
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = changePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Get current user with password and check if they have social accounts
    const user = await prisma.users.findUnique({
      where: { id: id },
      select: { 
        id: true, 
        password: true, 
        email: true,
        Account: {
          select: {
            provider: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hasPassword = user.password !== null;

    // If user has a password, verify current password
    if (hasPassword && currentPassword) {
      // Ensure password is not null before comparing
      if (!user.password) {
        return NextResponse.json(
          { error: 'Password verification failed' },
          { status: 400 }
        );
      }
      
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    } else if (hasPassword && !currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required to change password' },
        { status: 400 }
      );
    }
    // If user doesn't have a password (social media signup), allow setting new password without current password

    // Check password history (prevent reusing last 5 passwords)
    // First check current password
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password)
      if (isSamePassword) {
        return NextResponse.json(
          { error: 'You cannot reuse your current password. Please choose a different password.' },
          { status: 400 }
        )
      }
    }

    // Check password history (last 5 passwords)
    try {
      const wasUsedRecently = await isPasswordInHistory(id, newPassword, 5)
      if (wasUsedRecently) {
        return NextResponse.json(
          { error: 'You cannot reuse any of your last 5 passwords. Please choose a different password.' },
          { status: 400 }
        )
      }
    } catch (historyError) {
      // If password history check fails, log but continue (fail open)
      console.error("Password history check failed:", historyError)
    }

    // Hash new password (using 14 rounds for better security)
    const hashedNewPassword = await bcrypt.hash(newPassword, 14);

    // Store old password in history before updating
    if (user.password) {
      try {
        await addPasswordToHistory(id, user.password, 5)
      } catch (historyError) {
        // Log but continue - password history is not critical
        console.error("Failed to add password to history:", historyError)
      }
    }

    // Update password in database
    await prisma.users.update({
      where: { id: id },
      data: { password: hashedNewPassword }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully' 
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
