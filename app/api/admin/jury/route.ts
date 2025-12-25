import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllJuryMembers, addJuryMember } from '@/lib/jury-service';

// GET /api/admin/jury - Get all jury members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const competitionId = searchParams.get('competitionId') || undefined;

    const juryMembers = await getAllJuryMembers(competitionId);

    return NextResponse.json({ juryMembers });
  } catch (error) {
    console.error('Error fetching jury members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jury members' },
      { status: 500 }
    );
  }
}

// POST /api/admin/jury - Add new jury member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, competitionId } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: 'userId and title are required' },
        { status: 400 }
      );
    }

    const juryMember = await addJuryMember({
      userId,
      title,
      assignedBy: session.user.id,
      competitionId,
    });

    return NextResponse.json({ juryMember }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding jury member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add jury member' },
      { status: 500 }
    );
  }
}
