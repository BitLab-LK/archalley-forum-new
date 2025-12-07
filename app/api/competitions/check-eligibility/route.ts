/**
 * Check Eligibility API
 * GET /api/competitions/check-eligibility?registrationId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canUserSubmit } from '@/lib/submission-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get('registrationId');
    
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }
    
    // Pass user role for admin bypass
    const userRole = session.user.role as string;
    const eligibility = await canUserSubmit(session.user.id, registrationId, userRole);
    
    return NextResponse.json(eligibility);
  } catch (error) {
    console.error('Check eligibility error:', error);
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
