import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  password: z.string().optional(), // Made optional for social media users
  confirmText: z.string().refine(
    (text) => text === 'DELETE MY ACCOUNT', 
    { message: 'Must type "DELETE MY ACCOUNT" to confirm' }
  ),
  emailVerificationCode: z.string().optional() // For social media users
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
    
    if (session.user.id !== id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = deleteAccountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    // Get user with password and social accounts
    const user = await prisma.users.findUnique({
      where: { id: id },
      select: { 
        id: true, 
        password: true, 
        email: true, 
        role: true,
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

    // Prevent admin account deletion
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted' },
        { status: 403 }
      );
    }

    const hasSocialAccount = user.Account && user.Account.length > 0;
    const hasPassword = user.password !== null;

    // Verify authentication based on account type
    if (hasPassword && password) {
      // Regular user with password - ensure password is not null before comparing
      if (!user.password) {
        return NextResponse.json(
          { error: 'Password verification failed' },
          { status: 400 }
        );
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 400 }
        );
      }
    } else if (hasPassword && !password) {
      // User has password but didn't provide it
      return NextResponse.json(
        { error: 'Password is required to delete your account' },
        { status: 400 }
      );
    } else if (!hasPassword && hasSocialAccount) {
      // Social media user - require email verification or alternative confirmation
      // For now, we'll allow deletion without password for social users
      // but you could implement email verification here
      console.log('Social media user attempting account deletion');
    } else {
      return NextResponse.json(
        { error: 'Unable to verify account for deletion' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete in order of dependencies
      
      // 1. Delete votes
      await tx.votes.deleteMany({
        where: { userId: id }
      });

      // 2. Delete comments
      await tx.comment.deleteMany({
        where: { authorId: id }
      });

      // 3. Delete posts
      await tx.post.deleteMany({
        where: { authorId: id }
      });

      // 4. Delete notifications
      await tx.notifications.deleteMany({
        where: { userId: id }
      });

      // 5. Delete work experience
      await tx.workExperience.deleteMany({
        where: { userId: id }
      });

      // 6. Delete education
      await tx.education.deleteMany({
        where: { userId: id }
      });

      // 7. Delete settings
      await tx.settings.deleteMany({
        where: { updatedById: id }
      });

      // 8. Delete flags
      await tx.flags.deleteMany({
        where: { userId: id }
      });

      // 9. Delete sessions
      await tx.session.deleteMany({
        where: { userId: id }
      });

      // 10. Delete accounts (OAuth connections)
      await tx.account.deleteMany({
        where: { userId: id }
      });

      // 11. Finally delete the user
      await tx.users.delete({
        where: { id: id }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
