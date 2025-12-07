/**
 * User Submissions API
 * GET /api/submissions/user/my-submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserSubmissions } from '@/lib/submission-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId') || undefined;
    
    const submissions = await getUserSubmissions(session.user.id, competitionId);
    
    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    console.error('Get user submissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user submissions' },
      { status: 500 }
    );
  }
}
