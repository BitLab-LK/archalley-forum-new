import { NextResponse } from 'next/server';
import { getEmailServiceStatus } from '@/lib/email-service';

// Simple endpoint to check email config without authentication
export async function GET() {
  try {
    const status = getEmailServiceStatus();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        hasHost: !!process.env.SMTP_HOST,
        hasPort: !!process.env.SMTP_PORT,
        hasUser: !!process.env.SMTP_USER,
        hasPassword: !!process.env.SMTP_PASSWORD,
        hasFrom: !!process.env.EMAIL_FROM,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        from: process.env.EMAIL_FROM
      },
      status
    });
  } catch (error) {
    console.error('Email config check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check email configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}