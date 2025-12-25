import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getJuryMember, submitJuryScore, getJuryScore } from '@/lib/jury-service';
import { prisma } from '@/lib/prisma';

// GET /api/jury/score/[registrationNumber] - Get jury's score for a submission
export async function GET(
  _request: NextRequest,
  { params }: { params: { registrationNumber: string } }
) {
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

    // Get submission details
    const submission = await prisma.competitionSubmission.findUnique({
      where: { registrationNumber: params.registrationNumber },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Get jury's score if exists
    const score = await getJuryScore(juryMember.id, params.registrationNumber);

    return NextResponse.json({
      submission,
      score,
    });
  } catch (error) {
    console.error('Error fetching score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch score' },
      { status: 500 }
    );
  }
}

// POST /api/jury/score/[registrationNumber] - Submit score for submission
export async function POST(
  request: NextRequest,
  { params }: { params: { registrationNumber: string } }
) {
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

    const body = await request.json();
    const {
      conceptScore,
      relevanceScore,
      compositionScore,
      balanceScore,
      colourScore,
      designRelativityScore,
      aestheticAppealScore,
      unconventionalMaterialsScore,
      overallMaterialScore,
      comments,
    } = body;

    // Validate required fields
    if (
      conceptScore === undefined ||
      relevanceScore === undefined ||
      compositionScore === undefined ||
      balanceScore === undefined ||
      colourScore === undefined ||
      designRelativityScore === undefined ||
      aestheticAppealScore === undefined ||
      unconventionalMaterialsScore === undefined ||
      overallMaterialScore === undefined
    ) {
      return NextResponse.json(
        { error: 'All scores are required' },
        { status: 400 }
      );
    }

    const score = await submitJuryScore(
      juryMember.id,
      params.registrationNumber,
      {
        conceptScore: Number(conceptScore),
        relevanceScore: Number(relevanceScore),
        compositionScore: Number(compositionScore),
        balanceScore: Number(balanceScore),
        colourScore: Number(colourScore),
        designRelativityScore: Number(designRelativityScore),
        aestheticAppealScore: Number(aestheticAppealScore),
        unconventionalMaterialsScore: Number(unconventionalMaterialsScore),
        overallMaterialScore: Number(overallMaterialScore),
        comments,
      }
    );

    return NextResponse.json({ score }, { status: 201 });
  } catch (error: any) {
    console.error('Error submitting score:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit score' },
      { status: 500 }
    );
  }
}
