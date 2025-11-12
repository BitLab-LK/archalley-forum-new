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
      template,
      rejectReason // NEW: Accept reject reason from verify-payment API
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
    
    console.log('📧 [EMAIL API] Template:', template);
    console.log('📧 [EMAIL API] Reject Reason:', rejectReason || 'N/A');
    
    if (template === 'BANK_TRANSFER_PENDING') {
      subject = `Payment Pending - Christmas in Future`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FFA000;">
            <h1 style="color: #FFA000; margin: 0; font-size: 32px;">ARCHALLEY</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">Payment Pending</h2>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              Dear ${name},
            </p>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              Your bank transfer details for <strong>Christmas in Future</strong> have been successfully submitted and are awaiting verification.
            </p>
            
            <!-- Registration Info Box -->
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e5e5e5;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 14px; width: 40%;">Registration Number</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #333; font-size: 14px; font-weight: 500;">${registrationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; color: #666; font-size: 14px;">Status</td>
                <td style="padding: 12px 15px; color: #FFA000; font-size: 14px; font-weight: 500;">Payment Verification Pending</td>
              </tr>
            </table>

            <!-- Next Steps -->
            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">What happens next</h3>
              <ol style="color: #333; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Our admin team will review your bank transfer slip within 24-48 hours</li>
                <li style="margin-bottom: 8px;">Once verified, your payment status will be updated to "Confirmed"</li>
                <li style="margin-bottom: 8px;">You will receive another email confirming your registration</li>
              </ol>
            </div>

            <!-- Contact Info -->
            <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666; font-size: 13px; line-height: 1.6; margin: 0;">
                <strong style="color: #333;">Important:</strong> Please check your email regularly for updates.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              Questions? Email us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
            </p>
            <div style="margin: 20px 0;">
              <a href="https://facebook.com/archalley" style="color: #1877f2; text-decoration: none; margin: 0 10px; font-size: 13px;">Facebook</a>
              <a href="https://instagram.com/archalley" style="color: #e4405f; text-decoration: none; margin: 0 10px; font-size: 13px;">Instagram</a>
              <a href="https://linkedin.com/company/archalley" style="color: #0a66c2; text-decoration: none; margin: 0 10px; font-size: 13px;">LinkedIn</a>
            </div>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
              © ${new Date().getFullYear()} Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else if (template === 'PAYMENT_REJECTED') {
      subject = `Payment Issue - Christmas in Future`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FFA000;">
            <h1 style="color: #FFA000; margin: 0; font-size: 32px;">ARCHALLEY</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">Payment Not Verified</h2>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              Dear ${name},
            </p>

            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              We regret to inform you that we were unable to verify your bank transfer payment for <strong>Christmas in Future</strong>.
            </p>
            
            <!-- Registration Info Box -->
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e5e5e5;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 14px; width: 40%;">Registration Number</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #333; font-size: 14px; font-weight: 500;">${registrationNumber}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 14px;">Competition</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #333; font-size: 14px; font-weight: 500;">Christmas in Future</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; color: #666; font-size: 14px;">Status</td>
                <td style="padding: 12px 15px; color: #dc2626; font-size: 14px; font-weight: 500;">Payment Rejected</td>
              </tr>
            </table>

            ${rejectReason ? `
              <!-- Admin's Note -->
              <div style="border: 2px solid #f59e0b; padding: 20px; margin: 25px 0; background: #fffbeb;">
                <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px; font-weight: 500;">Admin's Note</h3>
                <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6;">
                  ${rejectReason}
                </p>
              </div>
            ` : ''}

            <!-- Common Reasons -->
            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">Common reasons for payment issues</h3>
              <ul style="color: #333; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Bank slip image was unclear or unreadable</li>
                <li style="margin-bottom: 8px;">Payment details do not match our records</li>
                <li style="margin-bottom: 8px;">Incorrect amount transferred</li>
                <li style="margin-bottom: 8px;">Payment was not received in our account</li>
              </ul>
            </div>

            <!-- What to Do -->
            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">What you can do</h3>
              <ol style="color: #333; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Verify the payment was made to the correct account</li>
                <li style="margin-bottom: 8px;">Check if the correct amount was transferred</li>
                <li style="margin-bottom: 8px;">Upload a clearer image of your bank slip</li>
                <li style="margin-bottom: 8px;">Contact us directly for assistance</li>
              </ol>
            </div>

            <p style="color: #999; font-size: 13px; margin: 30px 0 0 0; text-align: center;">
              If you believe this is an error, please contact us with your payment proof.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              Questions? Email us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
            </p>
            <div style="margin: 20px 0;">
              <a href="https://facebook.com/archalley" style="color: #1877f2; text-decoration: none; margin: 0 10px; font-size: 13px;">Facebook</a>
              <a href="https://instagram.com/archalley" style="color: #e4405f; text-decoration: none; margin: 0 10px; font-size: 13px;">Instagram</a>
              <a href="https://linkedin.com/company/archalley" style="color: #0a66c2; text-decoration: none; margin: 0 10px; font-size: 13px;">LinkedIn</a>
            </div>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
              © ${new Date().getFullYear()} Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else if (template === 'PAYMENT_VERIFIED') {
      subject = `Payment Confirmed - Christmas in Future`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FFA000;">
            <h1 style="color: #FFA000; margin: 0; font-size: 32px;">ARCHALLEY</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <h2 style="color: #10b981; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">Payment Confirmed</h2>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              Dear ${name},
            </p>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              Great news! Your bank transfer has been verified and your registration for <strong>Christmas in Future</strong> is now confirmed.
            </p>
            
            <!-- Registration Info Box -->
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e5e5e5;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 14px; width: 40%;">Registration Number</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #333; font-size: 14px; font-weight: 500;">${registrationNumber}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 14px;">Competition</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #333; font-size: 14px; font-weight: 500;">Christmas in Future</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; color: #666; font-size: 14px;">Status</td>
                <td style="padding: 12px 15px; color: #10b981; font-size: 14px; font-weight: 500;">Payment Confirmed</td>
              </tr>
            </table>

            <!-- Next Steps -->
            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px; font-weight: 500;">Next steps</h3>
              <ol style="color: #333; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;">Review the competition guidelines carefully</li>
                <li style="margin-bottom: 8px;">Prepare your submission according to the requirements</li>
                <li style="margin-bottom: 8px;">Submit your entry before the deadline</li>
                <li style="margin-bottom: 8px;">Check your profile regularly for updates</li>
              </ol>
            </div>
            
            <!-- CTA Buttons -->
            <div style="text-align: center; margin: 35px 0 0 0;">
              <a href="${process.env.NEXTAUTH_URL}/profile" 
                 style="background: #FFA000; color: #ffffff; padding: 14px 35px; text-decoration: none; display: inline-block; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; border: 2px solid #FFA000; margin-right: 10px;">
                VIEW MY REGISTRATIONS
              </a>
              <a href="${process.env.NEXTAUTH_URL}/events" 
                 style="background: #ffffff; color: #FFA000; padding: 14px 35px; text-decoration: none; display: inline-block; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; border: 2px solid #FFA000;">
                BROWSE EVENTS
              </a>
            </div>

            <p style="color: #999; font-size: 13px; margin: 30px 0 0 0; text-align: center;">
              We look forward to seeing your submission. Good luck!
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              Questions? Email us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
            </p>
            <div style="margin: 20px 0;">
              <a href="https://facebook.com/archalley" style="color: #1877f2; text-decoration: none; margin: 0 10px; font-size: 13px;">Facebook</a>
              <a href="https://instagram.com/archalley" style="color: #e4405f; text-decoration: none; margin: 0 10px; font-size: 13px;">Instagram</a>
              <a href="https://linkedin.com/company/archalley" style="color: #0a66c2; text-decoration: none; margin: 0 10px; font-size: 13px;">LinkedIn</a>
            </div>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
              © ${new Date().getFullYear()} Archalley Forum. All rights reserved.
            </p>
          </div>
        </div>
      `;
    } else {
      // Generic message for other statuses
      subject = `Update on Your Registration - Christmas in Future`;
      message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #FFA000;">
            <h1 style="color: #FFA000; margin: 0; font-size: 32px;">ARCHALLEY</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">Registration Update</h2>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              Dear ${name},
            </p>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              We are reaching out regarding your registration for <strong>Christmas in Future</strong>.
            </p>
            
            <!-- Registration Info Box -->
            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #e5e5e5;">
              <tr style="background: #f9f9f9;">
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666; font-size: 14px; width: 40%;">Registration Number</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #333; font-size: 14px; font-weight: 500;">${registrationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; color: #666; font-size: 14px;">Payment Status</td>
                <td style="padding: 12px 15px; color: #333; font-size: 14px; font-weight: 500;">${status.replace('_', ' ')}</td>
              </tr>
            </table>
            
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
              Please check your registration details and ensure everything is in order.
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9f9f9; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e5e5;">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
              Questions? Email us at <a href="mailto:projects@archalley.com" style="color: #FFA000; text-decoration: none;">projects@archalley.com</a>
            </p>
            <div style="margin: 20px 0;">
              <a href="https://facebook.com/archalley" style="color: #1877f2; text-decoration: none; margin: 0 10px; font-size: 13px;">Facebook</a>
              <a href="https://instagram.com/archalley" style="color: #e4405f; text-decoration: none; margin: 0 10px; font-size: 13px;">Instagram</a>
              <a href="https://linkedin.com/company/archalley" style="color: #0a66c2; text-decoration: none; margin: 0 10px; font-size: 13px;">LinkedIn</a>
            </div>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
              © ${new Date().getFullYear()} Archalley Forum. All rights reserved.
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
