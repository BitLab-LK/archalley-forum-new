import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all brief download requests
    const requests = await prisma.briefDownloadRequest.findMany({
      orderBy: {
        firstRequestedAt: 'desc'
      }
    });

    // Calculate statistics
    const totalRequests = requests.length;
    const uniqueEmails = new Set(requests.map(r => r.email)).size;
    const totalAccesses = requests.reduce((sum, r) => sum + r.accessCount, 0);
    const totalDownloads = requests.reduce((sum, r) => sum + r.downloadCount, 0);

    return NextResponse.json({
      requests,
      stats: {
        totalRequests,
        uniqueEmails,
        totalAccesses,
        totalDownloads,
      }
    });

  } catch (error) {
    console.error('Error fetching brief download data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

