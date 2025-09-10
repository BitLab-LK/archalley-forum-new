import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;
    const body = await request.json();

    // Verify the user is updating their own settings or is an admin
    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update user settings directly in the users table
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        profileVisibility: body.profileVisibility === 'public',
        // Note: Other settings like newConnections, messages, etc. would need corresponding fields in the schema
        // For now, we'll update what exists in the schema
      },
      select: {
        id: true,
        profileVisibility: true,
      }
    });

    return NextResponse.json({ 
      success: true,
      settings: updatedUser 
    });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: userId } = await params;

    // Verify the user is accessing their own settings or is an admin
    const currentUser = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user settings from the users table
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        profileVisibility: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return settings in the expected format
    const settings = {
      profileVisibility: user.profileVisibility ? "public" : "private",
      newConnections: true, // Default values for now
      messages: true,
      jobAlerts: true,
      weeklyDigest: true,
      securityAlerts: true,
      profileSearchable: true
    };

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
