import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getJuryMember, getSubmissionsForJury } from '@/lib/jury-service';

// GET /api/jury/submissions - Get submissions for jury to score
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get jury member record
    const juryMember = await getJuryMember(session.user.id);

    if (!juryMember || !juryMember.isActive) {
      return NextResponse.json(
        { error: 'Not authorized as jury member' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'scored' | 'not-scored' | null;
    const category = searchParams.get('category') || undefined;

    const submissions = await getSubmissionsForJury(juryMember.id, {
      status: status || undefined,
      category,
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
