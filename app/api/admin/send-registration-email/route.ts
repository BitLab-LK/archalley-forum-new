import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import nodemailer from 'nodemailer';

/**
 * Admin API to send registration-related emails
 * POST /api/admin/send-registration-email
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📧 [EMAIL API] Request received');
    
    // Check admin authentication
    const session = await getServerSession(authOptions);
    console.log('🔐 [EMAIL API] Session:', session?.user?.email, 'Role:', session?.user?.role);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.error('❌ [EMAIL API] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📝 [EMAIL API] Request body:', {
      email: body.email,
      name: body.name,
      registrationNumber: body.registrationNumber,
      competitionTitle: body.competitionTitle,
    });
    
    const { 
      email, 
      name, 
      registrationNumber, 
      competitionTitle, 
      status, 
      submissionStatus,
      template 
    } = body;

    // Validate required fields
    if (!email || !name || !registrationNumber || !competitionTitle) {
      console.error('❌ [EMAIL API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: email, name, registrationNumber, competitionTitle' },
        { status: 400 }
      );
    }

    // Validate SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('❌ [EMAIL API] SMTP configuration missing');
      console.error('SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'Missing');
      console.error('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Missing');
      console.error('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'Missing');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    console.log('✅ [EMAIL API] SMTP config validated');

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Determine email subject and content based on status
    let subject = '';
    let message = '';
    
    if (template === 'BANK_TRANSFER_PENDING') {
      subject = `Payment Pending - ${competitionTitle}`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000000 0%, #f97316 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Archalley Forum</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #000000;">Thank You, ${name}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your bank transfer details for <strong>${competitionTitle}</strong> have been successfully submitted.
            </p>
            
            <div style="background: #fff7ed; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
              <p style="margin: 5px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Payment Verification Pending</p>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #000000; margin-top: 0;">What happens next?</h3>
              <ol style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>Our admin team will review your bank transfer slip within 24-48 hours</li>
                <li>Once verified, your payment status will be updated to "Confirmed"</li>
                <li>You'll receive another email confirming your registration</li>
              </ol>
            </div>

            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #1e40af; margin: 5px 0; font-size: 14px;">
                <strong>📧 Important:</strong> Please check your email regularly for updates.<br>
                <strong>📱 Questions?</strong> Contact us via WhatsApp: <a href="https://wa.me/94711942194" style="color: #f97316;">0711942194</a>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/profile" 
                 style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Registration Status
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Thank you for registering with Archalley Forum!
            </p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              © 2025 Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else if (template === 'PAYMENT_VERIFIED') {
      subject = `Payment Confirmed - ${competitionTitle}`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000000 0%, #10b981 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Archalley Forum</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; width: 60px; height: 60px; background: #d1fae5; border-radius: 50%; line-height: 60px;">
                <span style="font-size: 30px;">✓</span>
              </div>
            </div>

            <h2 style="color: #000000; text-align: center;">Payment Verified!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Great news, ${name}! Your bank transfer has been verified and your registration for <strong>${competitionTitle}</strong> is now confirmed.
            </p>
            
            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 5px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
              <p style="margin: 5px 0;"><strong>Competition:</strong> ${competitionTitle}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ✓ Payment Confirmed</p>
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #000000; margin-top: 0;">Next Steps:</h3>
              <ol style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>Review the competition guidelines carefully</li>
                <li>Prepare your submission according to the requirements</li>
                <li>Submit your entry before the deadline</li>
                <li>Check your profile regularly for updates</li>
              </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/profile" 
                 style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-right: 10px;">
                View My Registrations
              </a>
              <a href="${process.env.NEXTAUTH_URL}/events" 
                 style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Browse Events
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              We're excited to see your submission. Good luck!
            </p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              © 2025 Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else if (status === 'CONFIRMED' && submissionStatus === 'NOT_SUBMITTED') {
      subject = `Reminder: Submit Your Entry - ${competitionTitle}`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000000 0%, #f97316 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Archalley Forum</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #000000;">Hello ${name},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              This is a friendly reminder about your registration for <strong>${competitionTitle}</strong>.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
              <p style="margin: 5px 0;"><strong>Competition:</strong> ${competitionTitle}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${status.replace('_', ' ')}</p>
              <p style="margin: 5px 0;"><strong>Submission Status:</strong> ${submissionStatus.replace('_', ' ')}</p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We noticed you haven't submitted your entry yet. Please make sure to submit before the deadline.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/profile/competitions" 
                 style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View My Registrations
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              © 2025 Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else if (status === 'CONFIRMED' && submissionStatus === 'SUBMITTED') {
      subject = `Thank You for Your Submission - ${competitionTitle}`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000000 0%, #f97316 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Archalley Forum</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #000000;">Hello ${name},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for submitting your entry for <strong>${competitionTitle}</strong>!
            </p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 5px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
              <p style="margin: 5px 0;"><strong>Competition:</strong> ${competitionTitle}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ✅ ${status.replace('_', ' ')}</p>
              <p style="margin: 5px 0;"><strong>Submission Status:</strong> ✅ ${submissionStatus.replace('_', ' ')}</p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your submission is now under review by our team. We'll notify you about the results soon.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/profile/competitions" 
                 style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Submission Details
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; margin-top: 30px;">
              Good luck with your submission!
            </p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              © 2025 Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else {
      // Generic message for other statuses
      subject = `Update on Your Registration - ${competitionTitle}`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #000000 0%, #f97316 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Archalley Forum</h1>
          </div>
          
          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #000000;">Hello ${name},</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We're reaching out regarding your registration for <strong>${competitionTitle}</strong>.
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Registration Number:</strong> ${registrationNumber}</p>
              <p style="margin: 5px 0;"><strong>Competition:</strong> ${competitionTitle}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${status.replace('_', ' ')}</p>
              <p style="margin: 5px 0;"><strong>Submission Status:</strong> ${submissionStatus.replace('_', ' ')}</p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Please check your registration details and ensure everything is in order.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/profile/competitions" 
                 style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View My Registrations
              </a>
            </div>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; text-align: center;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              © 2025 Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    }

    // Send email
    console.log('📤 [EMAIL API] Sending email...');
    console.log('  To:', email);
    console.log('  From:', `"${process.env.EMAIL_FROM_NAME || 'Archalley Forum'}" <${process.env.SMTP_USER}>`);
    console.log('  Subject:', subject);
    
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Archalley Forum'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: message,
      text: message.replace(/<[^>]*>/g, ''), // Strip HTML for plain text version
    });

    console.log(`✅ [EMAIL API] Email sent successfully to ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('❌ [EMAIL API] Error sending email:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
