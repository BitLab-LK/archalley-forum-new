import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user data
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        emailNotifications: true,
        notifyOnSystem: true
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({
        success: false,
        message: 'No email address found in your profile. Please add an email address first.'
      }, { status: 400 });
    }

    // Check what might be blocking emails
    const diagnostics = {
      hasEmail: !!user.email,
      emailVerified: !!user.emailVerified,
      emailNotifications: user.emailNotifications,
      systemNotifications: user.notifyOnSystem,
      smtpHost: process.env.SMTP_HOST,
      smtpUser: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '***' : 'Not set',
      emailFrom: process.env.EMAIL_FROM
    };

    // Try to send email directly (bypassing preference checks for testing)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const emailContent = {
      subject: 'Forum Test Email - Direct SMTP Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🧪 Direct SMTP Test</h2>
          <p>Hi ${user.name || 'User'},</p>
          <p>This is a direct SMTP test to verify your email configuration.</p>
          
          <h3>Diagnostics:</h3>
          <ul>
            <li>Email Address: ${user.email}</li>
            <li>Email Verified: ${diagnostics.emailVerified ? '✅ Yes' : '❌ No'}</li>
            <li>Email Notifications: ${diagnostics.emailNotifications ? '✅ Enabled' : '❌ Disabled'}</li>
            <li>System Notifications: ${diagnostics.systemNotifications ? '✅ Enabled' : '❌ Disabled'}</li>
            <li>SMTP Host: ${diagnostics.smtpHost}</li>
            <li>SMTP User: ${diagnostics.smtpUser}</li>
            <li>Email From: ${diagnostics.emailFrom}</li>
          </ul>
          
          <p>If you received this email, your SMTP configuration is working!</p>
        </div>
      `,
      text: `Forum Test Email - If you received this, your SMTP configuration is working! Email: ${user.email}, Verified: ${diagnostics.emailVerified}`
    };

    console.log('🧪 Attempting direct SMTP test...', diagnostics);

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Forum Test'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log('✅ Direct SMTP test successful!');

    return NextResponse.json({
      success: true,
      message: `✅ Direct SMTP test successful! Email sent to ${user.email}`,
      diagnostics,
      recommendations: getRecommendations(diagnostics)
    });

  } catch (error) {
    console.error('❌ Direct SMTP test failed:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Direct SMTP test failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getRecommendations(diagnostics: any) {
  const recommendations = [];

  if (!diagnostics.emailVerified) {
    recommendations.push('⚠️ Email not verified - this prevents normal email notifications');
  }

  if (!diagnostics.emailNotifications) {
    recommendations.push('❌ Global email notifications disabled - enable in preferences');
  }

  if (!diagnostics.systemNotifications) {
    recommendations.push('❌ System notifications disabled - enable in preferences');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All email settings look good!');
  }

  return recommendations;
}
