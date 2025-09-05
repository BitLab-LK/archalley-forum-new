import { NextRequest, NextResponse } from 'next/server';
import { runDigestCron, sendDigests } from '@/lib/email-digest-service';

type EmailDigestFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export async function POST(request: NextRequest) {
  try {
    // Basic authentication for cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, frequency } = body;

    if (action === 'digest') {
      if (!frequency || !['DAILY', 'WEEKLY', 'MONTHLY'].includes(frequency)) {
        return NextResponse.json(
          { error: 'Invalid frequency. Must be DAILY, WEEKLY, or MONTHLY' },
          { status: 400 }
        );
      }

      const results = await sendDigests(frequency as EmailDigestFreq);
      
      return NextResponse.json({
        success: true,
        message: `${frequency} digests sent`,
        results
      });
    }

    if (action === 'auto') {
      // Run the automatic cron logic
      await runDigestCron();
      
      return NextResponse.json({
        success: true,
        message: 'Digest cron executed'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "digest" or "auto"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Cron API error:', error);
    return NextResponse.json(
      { error: 'Failed to process cron job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Email digest cron endpoint',
    usage: {
      auto: 'POST with {"action": "auto"} to run automatic digest logic',
      manual: 'POST with {"action": "digest", "frequency": "DAILY|WEEKLY|MONTHLY"} to send specific digests'
    },
    auth: 'Requires Authorization: Bearer <CRON_SECRET> header'
  });
}
