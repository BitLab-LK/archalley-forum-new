import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateJuryMember, removeJuryMember, deleteJuryMember } from '@/lib/jury-service';

// PATCH /api/admin/jury/[id] - Update jury member
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, isActive, competitionId } = body;

    const juryMember = await updateJuryMember(params.id, {
      title,
      isActive,
      competitionId,
    });

    return NextResponse.json({ juryMember });
  } catch (error) {
    console.error('Error updating jury member:', error);
    return NextResponse.json(
      { error: 'Failed to update jury member' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/jury/[id] - Remove jury member (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      await deleteJuryMember(params.id);
    } else {
      await removeJuryMember(params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing jury member:', error);
    return NextResponse.json(
      { error: 'Failed to remove jury member' },
      { status: 500 }
    );
  }
}
