import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getJuryMember, getJuryDashboardStats } from '@/lib/jury-service';

// GET /api/jury/dashboard - Get jury dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const juryMember = await getJuryMember(session.user.id);

    if (!juryMember || !juryMember.isActive) {
      return NextResponse.json(
        { error: 'Not authorized as jury member' },
        { status: 403 }
      );
    }

    const stats = await getJuryDashboardStats(juryMember.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
